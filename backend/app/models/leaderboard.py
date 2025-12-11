"""
LeaderboardEntry Model - Stores top scores for each URL
"""
from sqlalchemy import Column, String, Integer, Float, DateTime
from datetime import datetime
import uuid

from app.core.database import Base


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    short_code = Column(String(10), nullable=False, index=True)

    # Player information (anonymous)
    player_nickname = Column(String(50), default='Anonymous')
    player_country = Column(String(2), nullable=True)

    # Performance metrics
    completion_time_seconds = Column(Float, nullable=False, index=True)
    hints_used = Column(Integer, default=0)
    score = Column(Integer, nullable=False)
    difficulty = Column(String(20), nullable=True, index=True)

    # Ranking (calculated periodically)
    rank = Column(Integer, nullable=True, index=True)
    percentile = Column(Float, nullable=True)

    completed_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LeaderboardEntry {self.player_nickname} - {self.score}>"
