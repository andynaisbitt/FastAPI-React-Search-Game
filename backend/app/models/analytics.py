"""
URLAnalytics Model - Tracks user sessions and game outcomes
"""
from sqlalchemy import Column, String, Integer, Float, DateTime
from datetime import datetime
import uuid

from app.core.database import Base


class URLAnalytics(Base):
    __tablename__ = "url_analytics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    short_code = Column(String(10), nullable=False, index=True)

    # Session tracking
    session_start = Column(DateTime, default=datetime.utcnow, index=True)
    session_end = Column(DateTime, nullable=True)

    # Visitor information
    visitor_ip = Column(String(45), nullable=True)
    visitor_user_agent = Column(String(500), nullable=True)
    visitor_country = Column(String(2), nullable=True)  # ISO country code
    referrer = Column(String(500), nullable=True)

    # Game results
    outcome = Column(String(20), index=True)  # completed, failed, timeout, abandoned
    attempts = Column(Integer, default=0)
    hints_used = Column(Integer, default=0)
    completion_time_seconds = Column(Float, nullable=True)
    score = Column(Integer, nullable=True)

    # Ad tracking
    ads_shown = Column(Integer, default=0)
    ads_clicked = Column(Integer, default=0)
    estimated_revenue_usd = Column(Float, default=0.0)

    def __repr__(self):
        return f"<URLAnalytics {self.short_code} - {self.outcome}>"
