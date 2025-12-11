"""
Pydantic schemas for URL endpoints
"""
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime


class URLCreateRequest(BaseModel):
    long_url: HttpUrl
    difficulty: str = Field(default='medium', pattern='^(simple|medium|hard|expert)$')
    challenge_text: Optional[str] = None
    hints: Optional[List[str]] = None
    time_limit_seconds: int = Field(default=180, ge=30, le=600)


class URLResponse(BaseModel):
    short_code: str
    long_url: str
    short_url: str  # Full URL: http://jfgi.app/abc123
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True
