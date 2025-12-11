"""
ShortURL Model - Stores shortened URLs and challenge configuration
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON
from datetime import datetime
import uuid

from app.core.database import Base


class ShortURL(Base):
    __tablename__ = "short_urls"

    # Primary Key (String for SQLite compatibility)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    short_code = Column(String(10), unique=True, nullable=False, index=True)
    long_url = Column(String(2048), nullable=False)

    # Challenge Configuration
    difficulty = Column(String(20), default='medium')  # simple, medium, hard, expert
    challenge_text = Column(String(500), nullable=True)
    hints = Column(JSON, nullable=True)  # Array of hint strings
    correct_answers = Column(JSON, nullable=True)  # Array of acceptable answers
    time_limit_seconds = Column(Integer, default=180)

    # Creator Info
    creator_ip = Column(String(45), nullable=True)
    creator_user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)

    # Analytics (denormalized for performance)
    total_views = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    total_failures = Column(Integer, default=0)
    total_timeouts = Column(Integer, default=0)
    avg_completion_time_seconds = Column(Float, nullable=True)

    # Moderation
    is_flagged = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)

    def __repr__(self):
        return f"<ShortURL {self.short_code} -> {self.long_url[:50]}...>"
