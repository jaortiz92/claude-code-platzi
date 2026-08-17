from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    """Schema for creating/updating a rating."""
    user_id: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)


class RatingResponse(BaseModel):
    """Schema for rating response."""
    id: int
    course_id: int
    user_id: str
    rating: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RatingSummary(BaseModel):
    """Schema for rating summary response."""
    average: float
    count: int
    user_rating: Optional[int] = None
