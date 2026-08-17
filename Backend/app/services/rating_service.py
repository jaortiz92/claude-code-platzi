from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.course import Course
from app.models.course_rating import CourseRating


class RatingService:
    """Service class for handling rating-related operations."""

    def __init__(self, db: Session):
        self.db = db

    def _get_course_by_slug(self, slug: str) -> Optional[Course]:
        """Get a course by slug, or None if not found."""
        return (
            self.db.query(Course)
            .filter(Course.slug == slug, Course.deleted_at.is_(None))
            .first()
        )

    def get_rating_summary(self, slug: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get rating summary for a course.

        Returns:
            Dict with average, count, and user_rating (if user_id provided).
            None if course not found.
        """
        course = self._get_course_by_slug(slug)
        if not course:
            return None

        result = (
            self.db.query(
                func.avg(CourseRating.rating).label("average"),
                func.count(CourseRating.id).label("count"),
            )
            .filter(
                CourseRating.course_id == course.id,
                CourseRating.deleted_at.is_(None),
            )
            .first()
        )

        average = round(float(result.average), 2) if result.average else 0.0
        count = result.count

        user_rating = None
        if user_id:
            rating_row = (
                self.db.query(CourseRating)
                .filter(
                    CourseRating.course_id == course.id,
                    CourseRating.user_id == user_id,
                    CourseRating.deleted_at.is_(None),
                )
                .first()
            )
            if rating_row:
                user_rating = rating_row.rating

        return {
            "average": average,
            "count": count,
            "user_rating": user_rating,
        }

    def upsert_rating(self, slug: str, user_id: str, rating: int) -> Dict[str, Any]:
        """
        Create or update a user's rating for a course.

        Returns:
            Dict with rating data.
        Raises:
            ValueError: If course not found.
        """
        course = self._get_course_by_slug(slug)
        if not course:
            raise ValueError("Course not found")

        existing = (
            self.db.query(CourseRating)
            .filter(
                CourseRating.course_id == course.id,
                CourseRating.user_id == user_id,
                CourseRating.deleted_at.is_(None),
            )
            .first()
        )

        if existing:
            existing.rating = rating
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            new_rating = CourseRating(
                course_id=course.id,
                user_id=user_id,
                rating=rating,
            )
            self.db.add(new_rating)
            self.db.commit()
            self.db.refresh(new_rating)
            return new_rating

    def delete_rating(self, slug: str, user_id: str) -> bool:
        """
        Soft-delete a user's rating for a course.

        Returns:
            True if rating was deleted, False if not found.
        Raises:
            ValueError: If course not found.
        """
        course = self._get_course_by_slug(slug)
        if not course:
            raise ValueError("Course not found")

        rating = (
            self.db.query(CourseRating)
            .filter(
                CourseRating.course_id == course.id,
                CourseRating.user_id == user_id,
                CourseRating.deleted_at.is_(None),
            )
            .first()
        )

        if not rating:
            return False

        from datetime import datetime
        rating.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
