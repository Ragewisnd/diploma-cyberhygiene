from fastapi import APIRouter
from database import db
from schemas.module import ModuleCreate

router = APIRouter(prefix="/modules", tags=["Modules"])

def serialize_module(module):
    return {
        "_id": str(module["_id"]),
        "course_id": module["course_id"],
        "title": module["title"],
        "module_type": module["module_type"],
        "content": module["content"],
        "order": module["order"]
    }

@router.post("/")
def create_module(module: ModuleCreate):
    existing = db.modules.find_one({
        "course_id": module.course_id,
        "title": module.title,
        "order": module.order
    })

    if existing:
        return {
            "message": "Module already exists",
            "module": serialize_module(existing)
        }

    module_data = {
        "course_id": module.course_id,
        "title": module.title,
        "module_type": module.module_type,
        "content": module.content,
        "order": module.order
    }

    result = db.modules.insert_one(module_data)

    return {
        "message": "Module created successfully",
        "id": str(result.inserted_id),
        "module": {
            "course_id": module_data["course_id"],
            "title": module_data["title"],
            "module_type": module_data["module_type"],
            "content": module_data["content"],
            "order": module_data["order"]
        }
    }

@router.get("/course/{course_id}")
def get_modules_by_course(course_id: str):
    modules = list(db.modules.find({"course_id": course_id}).sort("order", 1))
    return [serialize_module(module) for module in modules]