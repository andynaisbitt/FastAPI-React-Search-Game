"""
Game API Endpoints
Handles game mechanics: initialization, search, hints, answer checking
Ported from controllers/gameController.js
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import time

from app.core.database import get_db
from app.models.url import ShortURL
from app.models.analytics import URLAnalytics
from app.models.leaderboard import LeaderboardEntry
from app.utils.difficulty import get_difficulty, calculate_score, generate_hint_for_difficulty
from app.services.hint_service import generate_hint
from app.services.analytics_service import AnalyticsService
from app.services.websocket_manager import manager
from app.utils.profanity_filter import sanitize_nickname
from app.utils.roasting_system import (
    get_random_roast,
    get_completion_roast,
    get_hint_roast,
    get_difficulty_intro_roast
)

router = APIRouter()


# ==================== Pydantic Schemas ====================

class GameInitResponse(BaseModel):
    short_code: str
    long_url: str
    game_question: str
    difficulty: str
    time_limit: int
    max_hints: int
    difficulty_config: dict
    roast: str  # Pre-game roast message


class HintRequest(BaseModel):
    hint_level: int


class HintResponse(BaseModel):
    hint: str
    hints_used: int
    hint_penalty_seconds: int
    roast: str  # Hint-specific roast message


class CheckAnswerRequest(BaseModel):
    submitted_url: str


class CheckAnswerResponse(BaseModel):
    correct: bool
    score: int
    score_breakdown: dict
    time_elapsed: float
    long_url: Optional[str] = None
    roast: str  # Success/failure roast message


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str


class SearchResponse(BaseModel):
    results: List[SearchResult]
    has_correct_answer: bool
    fallback_mode: bool = False


class EndGameRequest(BaseModel):
    outcome: str  # 'completed', 'failed', 'timeout', 'abandoned'
    score: int
    time_remaining: int
    hints_used: int = 0
    attempts: int = 1
    completion_time: int = 0
    submit_to_leaderboard: bool = False
    nickname: Optional[str] = "Anonymous"
    session_id: Optional[int] = None


# ==================== Game Endpoints ====================

@router.get("/{short_code}/initialize", response_model=GameInitResponse)
async def initialize_game(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Initialize a game session
    Returns game configuration and question
    """
    # Get URL from database
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="Short code not found")

    if url.is_banned:
        raise HTTPException(status_code=403, detail="This URL has been banned")

    # Get difficulty configuration
    difficulty_config = get_difficulty(url.difficulty)

    # Create analytics session using AnalyticsService
    session_id = AnalyticsService.start_session(
        short_code=short_code,
        visitor_ip=request.client.host,
        visitor_user_agent=request.headers.get("user-agent", ""),
        referrer=request.headers.get("referer"),
        db=db
    )

    # Broadcast new player started (WebSocket)
    import asyncio
    asyncio.create_task(manager.broadcast_game_start(short_code, {
        'session_id': session_id,
        'active_players': manager.get_active_players(short_code)
    }))

    # Store session data (in production, use Redis or similar)
    # For now, we'll include it in the response
    game_question = url.challenge_text or f"Find the original URL for: {short_code}"

    # Get difficulty-specific roast
    roast = get_difficulty_intro_roast(url.difficulty)

    return GameInitResponse(
        short_code=short_code,
        long_url=url.long_url,
        game_question=game_question,
        difficulty=url.difficulty,
        time_limit=url.time_limit_seconds,
        max_hints=difficulty_config.max_hints,
        roast=roast,
        difficulty_config={
            "id": difficulty_config.id,
            "name": difficulty_config.name,
            "icon": difficulty_config.icon,
            "color": difficulty_config.color,
            "time_bonus": difficulty_config.time_bonus,
            "points_correct": difficulty_config.points_correct,
            "hint_penalty_seconds": difficulty_config.hint_penalty_seconds,
            "auto_fill_search": difficulty_config.auto_fill_search,
            "show_search_operators": difficulty_config.show_search_operators,
            "session_id": session_id  # Include session ID for future requests
        }
    )


@router.post("/{short_code}/hint", response_model=HintResponse)
async def get_hint(
    short_code: str,
    hint_req: HintRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a hint for the current game
    Returns hint with time penalty and roast message
    """
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="Short code not found")

    difficulty_config = get_difficulty(url.difficulty)

    # Check if hint level is valid
    if hint_req.hint_level > difficulty_config.max_hints:
        raise HTTPException(status_code=400, detail="Maximum hints exceeded")

    # Analyze URL for hint generation
    from urllib.parse import urlparse
    parsed = urlparse(url.long_url)
    analyzed_url = {
        'domain': parsed.netloc,
        'path': parsed.path,
        'url': url.long_url,
        'keywords': url.long_url.split('/'),
        'search_operators': [],
        'category': 'unknown'
    }

    # Generate difficulty-appropriate hint
    hint_text = generate_hint_for_difficulty(url.difficulty, analyzed_url, hint_req.hint_level)

    # Get roast message for hint usage
    roast = get_hint_roast(hint_req.hint_level, difficulty_config.max_hints)

    return HintResponse(
        hint=hint_text,
        hints_used=hint_req.hint_level,
        hint_penalty_seconds=difficulty_config.hint_penalty_seconds,
        roast=roast
    )


@router.post("/{short_code}/search", response_model=SearchResponse)
async def search_for_answer(
    short_code: str,
    search_req: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform a Google search to help find the answer
    Returns search results and indicates if correct URL is present
    """
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="Short code not found")

    # Check if Google API is configured
    import os
    api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
    cx = os.getenv("GOOGLE_SEARCH_CX")

    if not api_key or not cx:
        # Fallback mode - return Google search link
        google_search_url = f"https://www.google.com/search?q={search_req.query}"
        return SearchResponse(
            results=[
                SearchResult(
                    title="Search on Google (API not configured)",
                    url=google_search_url,
                    snippet=f'Click here to search for "{search_req.query}" on Google. Configure GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX in .env for integrated search.'
                )
            ],
            has_correct_answer=False,
            fallback_mode=True
        )

    # Perform Google Custom Search
    try:
        import httpx

        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": api_key,
            "cx": cx,
            "q": search_req.query,
            "num": 10
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

        if "items" not in data:
            return SearchResponse(
                results=[],
                has_correct_answer=False,
                fallback_mode=False
            )

        # Parse search results
        from urllib.parse import urlparse
        correct_domain = urlparse(url.long_url).netloc.lower()
        has_correct = False

        search_results = []
        for item in data["items"]:
            result_domain = urlparse(item["link"]).netloc.lower()

            # Check if this result matches the correct answer
            if result_domain == correct_domain or url.long_url.lower() == item["link"].lower():
                has_correct = True

            search_results.append(SearchResult(
                title=item.get("title", ""),
                url=item.get("link", ""),
                snippet=item.get("snippet", "")
            ))

        return SearchResponse(
            results=search_results,
            has_correct_answer=has_correct,
            fallback_mode=False
        )

    except Exception as e:
        # On error, return fallback
        google_search_url = f"https://www.google.com/search?q={search_req.query}"
        return SearchResponse(
            results=[
                SearchResult(
                    title="Search on Google (API error)",
                    url=google_search_url,
                    snippet=f'Search API encountered an error. Click to search manually on Google. Error: {str(e)}'
                )
            ],
            has_correct_answer=False,
            fallback_mode=True
        )


@router.post("/{short_code}/check-answer", response_model=CheckAnswerResponse)
async def check_answer(
    short_code: str,
    answer_req: CheckAnswerRequest,
    db: Session = Depends(get_db)
):
    """
    Check if the submitted URL is correct
    Returns result with score and roast message
    """
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="Short code not found")

    # Check if domains match (simple domain comparison)
    from urllib.parse import urlparse
    submitted_domain = urlparse(answer_req.submitted_url).netloc
    correct_domain = urlparse(url.long_url).netloc

    is_correct = submitted_domain.lower() == correct_domain.lower()

    # Calculate score (placeholder - need actual time tracking)
    time_remaining = 60  # TODO: Track actual time
    hints_used = 0  # TODO: Track from session

    score_breakdown = calculate_score(
        url.difficulty,
        time_remaining,
        hints_used,
        is_correct
    )

    # Get appropriate roast message
    if is_correct:
        # Completion roast based on performance
        roast = get_completion_roast(
            completion_time=url.time_limit_seconds - time_remaining,
            time_limit=url.time_limit_seconds,
            score=score_breakdown.total_score
        )
    else:
        # Wrong answer roast
        roast = get_random_roast('wrong_answer')

    # Update stats
    if is_correct:
        url.total_completions += 1
    else:
        url.total_failures += 1
    db.commit()

    return CheckAnswerResponse(
        correct=is_correct,
        score=score_breakdown.total_score,
        score_breakdown={
            "base_points": score_breakdown.base_points,
            "time_bonus": score_breakdown.time_bonus,
            "hint_penalty": score_breakdown.hint_penalty,
            "total_score": score_breakdown.total_score,
        },
        time_elapsed=60.0,  # TODO: Calculate actual time
        long_url=url.long_url if is_correct else None,
        roast=roast
    )


@router.post("/{short_code}/end")
async def end_game(
    short_code: str,
    end_req: EndGameRequest,
    db: Session = Depends(get_db)
):
    """
    End the game and optionally submit to leaderboard
    """
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="Short code not found")

    # Track game outcome in analytics
    if end_req.session_id:
        if end_req.outcome == 'completed':
            AnalyticsService.track_completion(
                session_id=end_req.session_id,
                completion_time=end_req.completion_time,
                hints_used=end_req.hints_used,
                attempts=end_req.attempts,
                score=end_req.score,
                db=db
            )
        elif end_req.outcome == 'failed':
            AnalyticsService.track_failure(
                session_id=end_req.session_id,
                attempts=end_req.attempts,
                hints_used=end_req.hints_used,
                score=end_req.score,
                db=db
            )
        elif end_req.outcome == 'timeout':
            AnalyticsService.track_timeout(
                session_id=end_req.session_id,
                attempts=end_req.attempts,
                hints_used=end_req.hints_used,
                score=end_req.score,
                db=db
            )
        elif end_req.outcome == 'abandoned':
            AnalyticsService.track_abandonment(
                session_id=end_req.session_id,
                db=db
            )

    # Submit to leaderboard if requested
    leaderboard_id = None
    if end_req.submit_to_leaderboard and end_req.outcome == 'completed':
        # Sanitize nickname to remove profanity
        clean_nickname = sanitize_nickname(end_req.nickname)

        leaderboard_id = AnalyticsService.add_to_leaderboard(
            short_code=short_code,
            nickname=clean_nickname,
            completion_time=end_req.completion_time,
            hints_used=end_req.hints_used,
            score=end_req.score,
            difficulty=url.difficulty,
            country=None,  # TODO: Add geo-location
            db=db
        )

        # Broadcast new score to WebSocket clients
        import asyncio
        asyncio.create_task(manager.broadcast_new_score(short_code, {
            'nickname': clean_nickname,
            'score': end_req.score,
            'completion_time': end_req.completion_time,
            'hints_used': end_req.hints_used,
            'difficulty': url.difficulty,
            'leaderboard_id': leaderboard_id
        }))

        # Broadcast updated leaderboard
        leaderboard_entries = AnalyticsService.get_leaderboard(short_code, 10, db)
        asyncio.create_task(manager.broadcast_leaderboard_update(short_code, {
            'entries': leaderboard_entries
        }))

    # Broadcast game completion
    import asyncio
    clean_nickname_for_broadcast = sanitize_nickname(end_req.nickname) if end_req.submit_to_leaderboard else None
    asyncio.create_task(manager.broadcast_game_complete(short_code, {
        'outcome': end_req.outcome,
        'score': end_req.score,
        'nickname': clean_nickname_for_broadcast
    }))

    return {
        "message": "Game ended successfully",
        "outcome": end_req.outcome,
        "final_score": end_req.score,
        "leaderboard_id": leaderboard_id
    }


@router.get("/{short_code}/leaderboard")
async def get_leaderboard(
    short_code: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get leaderboard for a specific URL
    """
    entries = AnalyticsService.get_leaderboard(short_code, limit, db)

    return {
        "short_code": short_code,
        "entries": entries
    }


@router.get("/global/leaderboard")
async def get_global_leaderboard(
    time_filter: str = 'all',
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get global leaderboard across all URLs

    Args:
        time_filter: Filter by time period - 'all', 'week', or 'today'
        limit: Maximum number of entries to return (default 100)

    Returns:
        Global leaderboard entries sorted by score
    """
    if time_filter not in ['all', 'week', 'today']:
        raise HTTPException(status_code=400, detail="Invalid time_filter. Must be 'all', 'week', or 'today'")

    entries = AnalyticsService.get_global_leaderboard(time_filter, limit, db)

    return {
        "time_filter": time_filter,
        "entries": entries,
        "total_count": len(entries)
    }
