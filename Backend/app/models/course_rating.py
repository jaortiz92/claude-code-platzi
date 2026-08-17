from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import BaseModel


class CourseRating(BaseModel):
    """
    Course rating model for user ratings (1-5 stars).
    """
    __tablename__ = 'course_ratings'

    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False, index=True)
    user_id = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='ck_course_ratings_range'),
        UniqueConstraint('course_id', 'user_id', name='uq_course_ratings_active'),
    )

    course = relationship("Course", back_populates="ratings")

    def __repr__(self):
        return f"<CourseRating(id={self.id}, course_id={self.course_id}, user_id='{self.user_id}', rating={self.rating})>"
