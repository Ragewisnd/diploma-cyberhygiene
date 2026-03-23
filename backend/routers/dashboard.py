from fastapi import APIRouter, Depends
from database import db
from security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/me")
def get_my_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    enrollments = list(db.enrollments.find({"user_id": user_id}))
    progress_items = list(db.progress.find({"user_id": user_id}))

    courses_data = []

    for enrollment in enrollments:
        course_id = enrollment["course_id"]
        total_modules = db.modules.count_documents({"course_id": course_id})
        completed_modules = db.progress.count_documents({
            "user_id": user_id,
            "course_id": course_id,
            "completed": True
        })

        progress_percent = 0
        if total_modules > 0:
            progress_percent = round((completed_modules / total_modules) * 100, 2)

        courses_data.append({
            "course_id": course_id,
            "course_title": enrollment["course_title"],
            "status": enrollment["status"],
            "total_modules": total_modules,
            "completed_modules": completed_modules,
            "progress_percent": progress_percent
        })

    return {
        "user": {
            "id": user_id,
            "full_name": current_user["full_name"],
            "email": current_user["email"],
            "level": current_user["level"]
        },
        "stats": {
            "total_courses": len(enrollments),
            "completed_progress_items": len(progress_items)
        },
        "courses": courses_data
    }

@router.get("/course/{course_id}")
def get_course_dashboard(course_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    modules = list(db.modules.find({"course_id": course_id}).sort("order", 1))
    progress_items = list(db.progress.find({
        "user_id": user_id,
        "course_id": course_id
    }))

    completed_titles = {item["module_title"] for item in progress_items}

    module_view = []
    for module in modules:
        module_view.append({
            "_id": str(module["_id"]),
            "title": module["title"],
            "module_type": module["module_type"],
            "order": module["order"],
            "completed": module["title"] in completed_titles
        })

    total_modules = len(modules)
    completed_modules = len([item for item in module_view if item["completed"]])

    progress_percent = 0
    if total_modules > 0:
        progress_percent = round((completed_modules / total_modules) * 100, 2)

    return {
        "course_id": course_id,
        "total_modules": total_modules,
        "completed_modules": completed_modules,
        "progress_percent": progress_percent,
        "modules": module_view
    }