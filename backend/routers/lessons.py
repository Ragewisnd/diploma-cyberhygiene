from fastapi import APIRouter
from database import db
from schemas.lesson import LessonCreate

router = APIRouter(prefix="/lessons", tags=["Lessons"])

def serialize_lesson(lesson):
    return {
        "_id": str(lesson["_id"]),
        "course_id": lesson["course_id"],
        "title": lesson["title"],
        "content": lesson["content"],
        "order": lesson["order"]
    }

@router.get("/")
def get_lessons():
    lessons = list(db.lessons.find({}))
    return [serialize_lesson(lesson) for lesson in lessons]

@router.get("/course/{course_id}")
def get_lessons_by_course(course_id: str):
    lessons = list(db.lessons.find({"course_id": course_id}))
    return [serialize_lesson(lesson) for lesson in lessons]

@router.post("/")
def create_lesson(lesson: LessonCreate):
    lesson_data = lesson.model_dump()
    result = db.lessons.insert_one(lesson_data)

    return {
        "message": "Lesson created successfully",
        "id": str(result.inserted_id),
        "lesson": {
            "course_id": lesson_data["course_id"],
            "title": lesson_data["title"],
            "content": lesson_data["content"],
            "order": lesson_data["order"]
        }
    }