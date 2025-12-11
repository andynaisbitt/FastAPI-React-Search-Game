"""
URL Shortening Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.url import ShortURL
from app.schemas.url import URLCreateRequest, URLResponse
from app.utils.short_code import generate_unique_short_code
from app.utils.profanity_filter import clean_text, clean_list

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/", response_model=URLResponse)
@limiter.limit("3/hour")
async def create_short_url(
    request: Request,
    url_data: URLCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new shortened URL with optional challenge configuration

    Rate Limited: 3 URLs per hour per IP address
    """
    # Generate unique short code
    short_code = generate_unique_short_code(db)

    # Clean user-generated content to remove profanity
    clean_challenge_text = clean_text(url_data.challenge_text) if url_data.challenge_text else None
    clean_hints = clean_list(url_data.hints) if url_data.hints else None

    # Create ShortURL entry
    new_url = ShortURL(
        short_code=short_code,
        long_url=str(url_data.long_url),
        difficulty=url_data.difficulty,
        challenge_text=clean_challenge_text,
        hints=clean_hints,
        time_limit_seconds=url_data.time_limit_seconds,
        creator_ip=request.client.host,
        creator_user_agent=request.headers.get("user-agent", "")
    )

    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    # Build short URL
    base_url = settings.ALLOWED_ORIGINS[0] if settings.ALLOWED_ORIGINS else "http://localhost:5173"
    short_url = f"{base_url}/{short_code}"

    return URLResponse(
        short_code=short_code,
        long_url=str(url_data.long_url),
        short_url=short_url,
        difficulty=url_data.difficulty,
        created_at=new_url.created_at
    )


@router.get("/my-urls")
async def get_my_urls(
    request: Request,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get URLs created by the current user (based on IP address)

    Returns up to `limit` URLs created from the same IP address
    """
    creator_ip = request.client.host

    # Query URLs created by this IP, ordered by most recent first
    urls = db.query(ShortURL).filter(
        ShortURL.creator_ip == creator_ip
    ).order_by(
        ShortURL.created_at.desc()
    ).limit(limit).all()

    # Format response
    return [
        {
            "short_code": url.short_code,
            "long_url": url.long_url,
            "difficulty": url.difficulty,
            "challenge_text": url.challenge_text,
            "created_at": url.created_at.isoformat() if url.created_at else None,
            "total_plays": url.total_views,  # Using total_views as total_plays
            "total_completions": url.total_completions,
            "is_banned": url.is_banned
        }
        for url in urls
    ]


@router.get("/{short_code}")
async def get_url(short_code: str, db: Session = Depends(get_db)):
    """
    Get URL details by short code
    """
    url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

    if not url:
        raise HTTPException(status_code=404, detail="URL not found")

    return url
