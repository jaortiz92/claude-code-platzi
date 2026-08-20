from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.teacher import Teacher
from app.models.course_rating import CourseRating


class CourseService:
    """
    Service class for handling course-related operations.
    Implements the contract specifications for course endpoints.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_all_courses(self) -> List[Dict[str, Any]]:
        """
        Get all courses with basic information including teacher names.
        
        Returns:
            List of course dictionaries with: id, title, description, thumbnail, slug, teacher, duration
        """
        courses = (
            self.db.query(Course)
            .options(joinedload(Course.teachers))
            .filter(Course.deleted_at.is_(None))
            .all()
        )
        
        return [
            {
                "id": course.id,
                "title": course.name,
                "description": course.description,
                "thumbnail": course.thumbnail,
                "slug": course.slug,
                "teacher": course.teachers[0].name if course.teachers else "",
                "duration": 0,
            }
            for course in courses
        ]

    def get_course_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Get course details by slug including teachers and lessons.
        
        Args:
            slug: The course slug
            
        Returns:
            Course dictionary with teachers and lessons, or None if not found
        """
        course = (
            self.db.query(Course)
            .options(
                joinedload(Course.teachers),
                joinedload(Course.lessons)
            )
            .filter(Course.slug == slug)
            .filter(Course.deleted_at.is_(None))
            .first()
        )
        
        if not course:
            return None

        rating_result = (
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

        return {
            "id": course.id,
            "title": course.name,
            "description": course.description,
            "thumbnail": course.thumbnail,
            "slug": course.slug,
            "teacher": course.teachers[0].name if course.teachers else "",
            "duration": 0,
            "teacher_id": [teacher.id for teacher in course.teachers],
            "rating": {
                "average": round(float(rating_result.average), 2) if rating_result.average else 0.0,
                "count": rating_result.count,
            },
            "classes": [
                {
                    "id": lesson.id,
                    "title": lesson.name,
                    "description": lesson.description,
                    "slug": lesson.slug,
                    "video": lesson.video_url,
                    "duration": 0,
                }
                for lesson in course.lessons
                if lesson.deleted_at is None
            ]
        }

    def get_class_by_id(self, course_slug: str, class_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a single class/lesson by ID within a course.
        
        Args:
            course_slug: The course slug
            class_id: The lesson ID
            
        Returns:
            Lesson dictionary or None if not found
        """
        lesson = (
            self.db.query(Lesson)
            .join(Course, Lesson.course_id == Course.id)
            .filter(
                Course.slug == course_slug,
                Lesson.id == class_id,
                Lesson.deleted_at.is_(None),
                Course.deleted_at.is_(None),
            )
            .first()
        )
        
        if not lesson:
            return None

        return {
            "id": lesson.id,
            "title": lesson.name,
            "description": lesson.description,
            "slug": lesson.slug,
            "video": lesson.video_url,
            "duration": 0,
        }