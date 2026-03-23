from fastapi import APIRouter, Depends, HTTPException, status
from database import db
from security import get_current_user
from schemas.enrollment import EnrollmentCreate

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

def serialize_enrollment(enrollment):
    return {
        "_id": str(enrollment["_id"]),
        "user_id": enrollment["user_id"],
        "course_id": enrollment["course_id"],
        "course_title": enrollment["course_title"],
        "status": enrollment["status"]
    }

@router.post("/")
def create_enrollment(
    enrollment: EnrollmentCreate,
    current_user: dict = Depends(get_current_user)
):
    existing = db.enrollments.find_one({
        "user_id": str(current_user["_id"]),
        "course_id": enrollment.course_id
    })

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already enrolled in this course"
        )

    course = None
    for item in db.courses.find({}):
        if str(item["_id"]) == enrollment.course_id:
            course = item
            break

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    enrollment_data = {
        "user_id": str(current_user["_id"]),
        "course_id": enrollment.course_id,
        "course_title": course["title"],
        "status": "active"
    }

    result = db.enrollments.insert_one(enrollment_data)

    return {
        "message": "Enrollment created successfully",
        "id": str(result.inserted_id),
        "enrollment": {
            "user_id": enrollment_data["user_id"],
            "course_id": enrollment_data["course_id"],
            "course_title": enrollment_data["course_title"],
            "status": enrollment_data["status"]
        }
    }

@router.get("/my")
def get_my_enrollments(current_user: dict = Depends(get_current_user)):
    enrollments = list(db.enrollments.find({
        "user_id": str(current_user["_id"])
    }))
    return [serialize_enrollment(item) for item in enrollments]