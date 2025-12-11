"""
Analytics API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/{short_code}/summary")
async def get_analytics_summary(
    short_code: str,
    db: Session = Depends(get_db)
):
    """
    Get analytics summary for a short code

    Returns:
        - total_views: Total number of views
        - total_completions: Games completed successfully
        - total_failures: Games failed
        - total_timeouts: Games that timed out
        - avg_completion_time: Average time to complete
        - completion_rate: Percentage of completions
    """
    summary = AnalyticsService.get_analytics_summary(short_code, db)

    if not summary:
        raise HTTPException(status_code=404, detail="URL not found")

    return summary


@router.get("/{short_code}/detailed")
async def get_detailed_analytics(
    short_code: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for a short code

    Args:
        limit: Number of sessions to return (default 100)

    Returns:
        List of analytics sessions with full details
    """
    sessions = AnalyticsService.get_detailed_analytics(short_code, limit, db)

    # Convert to dict for JSON response
    return [
        {
            'id': s.id,
            'short_code': s.short_code,
            'visitor_ip': s.visitor_ip,
            'visitor_user_agent': s.visitor_user_agent,
            'referrer': s.referrer,
            'session_start': s.session_start.isoformat() if s.session_start else None,
            'session_end': s.session_end.isoformat() if s.session_end else None,
            'outcome': s.outcome,
            'completion_time': s.completion_time,
            'hints_used': s.hints_used,
            'attempts': s.attempts,
            'score': s.score,
            'ads_shown': s.ads_shown,
            'ads_clicked': s.ads_clicked,
            'estimated_revenue': s.estimated_revenue
        }
        for s in sessions
    ]


@router.get("/global")
async def get_global_analytics(db: Session = Depends(get_db)):
    """
    Get global analytics across all URLs

    Returns:
        - total_urls: Total number of shortened URLs
        - total_views: Total views across all URLs
        - total_completions: Total games completed
        - avg_completion_time: Average completion time
        - total_failures: Total games failed
        - total_timeouts: Total games timed out
        - total_revenue: Total estimated ad revenue
        - completion_rate: Overall completion rate
    """
    return AnalyticsService.get_global_analytics(db)


@router.post("/{short_code}/track-abandonment")
async def track_abandonment(
    short_code: str,
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Track game abandonment (user left before completing)

    Args:
        session_id: Analytics session ID
    """
    AnalyticsService.track_abandonment(session_id, db)

    return {"success": True, "message": "Abandonment tracked"}


@router.post("/{short_code}/track-ad-impression")
async def track_ad_impression(
    short_code: str,
    session_id: int,
    placement_type: str,
    db: Session = Depends(get_db)
):
    """
    Track ad impression

    Args:
        session_id: Analytics session ID
        placement_type: Ad placement type (e.g., 'pre-challenge', 'mid-challenge')
    """
    AnalyticsService.track_ad_impression(session_id, placement_type, db)

    return {"success": True, "message": "Ad impression tracked"}


@router.post("/{short_code}/track-ad-click")
async def track_ad_click(
    short_code: str,
    session_id: int,
    placement_type: str,
    estimated_revenue: float = 0.02,
    db: Session = Depends(get_db)
):
    """
    Track ad click

    Args:
        session_id: Analytics session ID
        placement_type: Ad placement type
        estimated_revenue: Estimated revenue from click (default $0.02)
    """
    AnalyticsService.track_ad_click(session_id, placement_type, estimated_revenue, db)

    return {"success": True, "message": "Ad click tracked"}
