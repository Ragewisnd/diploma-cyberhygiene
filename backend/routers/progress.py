from fastapi import APIRouter, Depends
from database import db
from security import get_current_user
from schemas.progress import ProgressComplete

router = APIRouter(prefix="/progress", tags=["Progress"])

def serialize_progress(progress):
    return {
        "_id": str(progress["_id"]),
        "user_id": progress["user_id"],
        "course_id": progress["course_id"],
        "module_type": progress["module_type"],
        "module_title": progress["module_title"],
        "order": progress["order"],
        "completed": progress["completed"]
    }

@router.post("/complete")
def complete_module(
    progress: ProgressComplete,
    current_user: dict = Depends(get_current_user)
):
    existing = db.progress.find_one({
        "user_id": str(current_user["_id"]),
        "course_id": progress.course_id,
        "module_title": progress.module_title
    })

    if existing:
        return {
            "message": "Module already completed",
            "progress": serialize_progress(existing)
        }

    progress_data = {
        "user_id": str(current_user["_id"]),
        "course_id": progress.course_id,
        "module_type": progress.module_type,
        "module_title": progress.module_title,
        "order": progress.order,
        "completed": True
    }

    result = db.progress.insert_one(progress_data)

    return {
        "message": "Module marked as completed",
        "id": str(result.inserted_id),
        "progress": {
            "user_id": progress_data["user_id"],
            "course_id": progress_data["course_id"],
            "module_type": progress_data["module_type"],
            "module_title": progress_data["module_title"],
            "order": progress_data["order"],
            "completed": progress_data["completed"]
        }
    }

@router.get("/course/{course_id}")
def get_course_progress(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    progress_items = list(db.progress.find({
        "user_id": str(current_user["_id"]),
        "course_id": course_id
    }))

    return [serialize_progress(item) for item in progress_items]