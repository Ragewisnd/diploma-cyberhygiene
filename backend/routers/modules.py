from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import db
from schemas.module import ModuleCreate, ModuleUpdate
from security import get_current_user

router = APIRouter(prefix="/modules", tags=["Modules"])

def serialize_module(module):
    return {
        "_id": str(module["_id"]),
        "course_id": module["course_id"],
        "title": module["title"],
        "module_type": module["module_type"],
        "order": module["order"],
        "is_required": module.get("is_required", True),
        "estimated_minutes": module.get("estimated_minutes", 10),
        "content": module.get("content", [])
    }

@router.post("/")
def create_module(
    module: ModuleCreate,
    current_user: dict = Depends(get_current_user)
):
    existing = db.modules.find_one({
        "course_id": module.course_id,
        "title": module.title,
        "order": module.order
    })

    if existing:
        return {"message": "Module already exists", "module": serialize_module(existing)}

    module_data = {
        "course_id": module.course_id,
        "title": module.title,
        "module_type": module.module_type,
        "order": module.order,
        "is_required": module.is_required,
        "estimated_minutes": module.estimated_minutes,
        "content": [block.model_dump() for block in module.content]
    }

    result = db.modules.insert_one(module_data)
    module_data["_id"] = str(result.inserted_id)

    return {"message": "Module created successfully", "id": module_data["_id"], "module": module_data}

@router.get("/course/{course_id}")
def get_modules_by_course(course_id: str, current_user: dict = Depends(get_current_user)):
    modules = list(db.modules.find({"course_id": course_id}).sort("order", 1))
    return [serialize_module(m) for m in modules]

@router.get("/{module_id}")
def get_module(module_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(module_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid module id")

    module = db.modules.find_one({"_id": oid})
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    return serialize_module(module)

@router.put("/{module_id}")
def update_module(
    module_id: str,
    data: ModuleUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        oid = ObjectId(module_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid module id")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "content" in update_data:
        update_data["content"] = [b.model_dump() if hasattr(b, 'model_dump') else b for b in data.content]

    db.modules.update_one({"_id": oid}, {"$set": update_data})
    updated = db.modules.find_one({"_id": oid})

    return {"message": "Module updated", "module": serialize_module(updated)}

@router.delete("/{module_id}")
def delete_module(
    module_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        oid = ObjectId(module_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid module id")

    db.modules.delete_one({"_id": oid})
    return {"message": "Module deleted"}
