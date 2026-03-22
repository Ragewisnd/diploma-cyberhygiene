from fastapi import APIRouter
from database import db
from schemas.course import CourseCreate

router = APIRouter(prefix="/courses", tags=["Courses"])

def serialize_course(course):
    return {
        "_id": str(course["_id"]),
        "title": course["title"],
        "description": course["description"],
        "order": course["order"]
    }

@router.get("/")
def get_courses():
    courses = list(db.courses.find({}))
    return [serialize_course(course) for course in courses]

@router.post("/")
def create_course(course: CourseCreate):
    course_data = course.model_dump()
    result = db.courses.insert_one(course_data)

    return {
        "message": "Course created successfully",
        "id": str(result.inserted_id),
        "course": {
            "title": course_data["title"],
            "description": course_data["description"],
            "order": course_data["order"]
        }
    }