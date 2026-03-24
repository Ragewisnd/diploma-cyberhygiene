from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import db
from schemas.course import CourseCreate, CourseUpdate
from schemas.module import ModuleCreate, ModuleUpdate
from schemas.test import TestCreate, TestUpdate
from schemas.user import UserUpdate
from security import require_admin
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["Admin"])

# ── utils ──────────────────────────────────────────────────────────

def s_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

def oid(id_str):
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")

# ── courses ────────────────────────────────────────────────────────

@router.get("/courses")
def admin_list_courses(admin=Depends(require_admin)):
    courses = list(db.courses.find({}))
    return [s_id(c) for c in courses]

@router.post("/courses")
def admin_create_course(data: CourseCreate, admin=Depends(require_admin)):
    doc = data.model_dump()
    doc["created_by"] = str(admin["_id"])
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    result = db.courses.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"message": "Course created", "course": doc}

@router.put("/courses/{course_id}")
def admin_update_course(course_id: str, data: CourseUpdate, admin=Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.courses.update_one({"_id": oid(course_id)}, {"$set": update})
    updated = db.courses.find_one({"_id": oid(course_id)})
    return {"message": "Course updated", "course": s_id(updated)}

@router.delete("/courses/{course_id}")
def admin_delete_course(course_id: str, admin=Depends(require_admin)):
    db.courses.delete_one({"_id": oid(course_id)})
    db.modules.delete_many({"course_id": course_id})
    db.tests.delete_many({"course_id": course_id})
    db.enrollments.delete_many({"course_id": course_id})
    db.progress.delete_many({"course_id": course_id})
    db.test_attempts.delete_many({"course_id": course_id})
    return {"message": "Course and all related data deleted"}

# ── modules ────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/modules")
def admin_list_modules(course_id: str, admin=Depends(require_admin)):
    modules = list(db.modules.find({"course_id": course_id}).sort("order", 1))
    return [s_id(m) for m in modules]

@router.post("/modules")
def admin_create_module(data: ModuleCreate, admin=Depends(require_admin)):
    existing = db.modules.find_one({
        "course_id": data.course_id,
        "order": data.order
    })
    if existing:
        raise HTTPException(status_code=400, detail="Module with this order already exists in course")

    doc = {
        "course_id": data.course_id,
        "title": data.title,
        "module_type": data.module_type,
        "order": data.order,
        "is_required": data.is_required,
        "estimated_minutes": data.estimated_minutes,
        "content": [b.model_dump() for b in data.content]
    }
    result = db.modules.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"message": "Module created", "module": doc}

@router.put("/modules/{module_id}")
def admin_update_module(module_id: str, data: ModuleUpdate, admin=Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if "content" in update and data.content is not None:
        update["content"] = [b.model_dump() if hasattr(b, 'model_dump') else b for b in data.content]
    db.modules.update_one({"_id": oid(module_id)}, {"$set": update})
    updated = db.modules.find_one({"_id": oid(module_id)})
    return {"message": "Module updated", "module": s_id(updated)}

@router.delete("/modules/{module_id}")
def admin_delete_module(module_id: str, admin=Depends(require_admin)):
    db.modules.delete_one({"_id": oid(module_id)})
    db.progress.delete_many({"module_id": module_id})
    return {"message": "Module deleted"}

# ── tests ──────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/tests")
def admin_list_tests(course_id: str, admin=Depends(require_admin)):
    tests = list(db.tests.find({"course_id": course_id}))
    return [s_id(t) for t in tests]

@router.post("/tests")
def admin_create_test(data: TestCreate, admin=Depends(require_admin)):
    doc = data.model_dump()
    result = db.tests.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"message": "Test created", "test": doc}

@router.put("/tests/{test_id}")
def admin_update_test(test_id: str, data: TestUpdate, admin=Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    db.tests.update_one({"_id": oid(test_id)}, {"$set": update})
    updated = db.tests.find_one({"_id": oid(test_id)})
    return {"message": "Test updated", "test": s_id(updated)}

@router.delete("/tests/{test_id}")
def admin_delete_test(test_id: str, admin=Depends(require_admin)):
    db.tests.delete_one({"_id": oid(test_id)})
    db.test_attempts.delete_many({"test_id": test_id})
    return {"message": "Test deleted"}

# ── users ──────────────────────────────────────────────────────────

@router.get("/users")
def admin_list_users(admin=Depends(require_admin)):
    users = list(db.users.find({}, {"hashed_password": 0}))
    return [s_id(u) for u in users]

@router.put("/users/{user_id}")
def admin_update_user(user_id: str, data: UserUpdate, admin=Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    db.users.update_one({"_id": oid(user_id)}, {"$set": update})
    updated = db.users.find_one({"_id": oid(user_id)}, {"hashed_password": 0})
    return {"message": "User updated", "user": s_id(updated)}

@router.post("/users/{user_id}/enroll")
def admin_enroll_user(
    user_id: str,
    body: dict,
    admin=Depends(require_admin)
):
    course_id = body.get("course_id")
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id required")

    course = db.courses.find_one({"_id": oid(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.enrollments.find_one({"user_id": user_id, "course_id": course_id})
    if existing:
        return {"message": "Already enrolled"}

    db.enrollments.insert_one({
        "user_id": user_id,
        "course_id": course_id,
        "course_title": course["title"],
        "status": "active",
        "assigned_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "User enrolled in course"}

# ── analytics ──────────────────────────────────────────────────────

@router.get("/reports/overview")
def admin_reports_overview(admin=Depends(require_admin)):
    total_users = db.users.count_documents({"role": "user"})
    total_courses = db.courses.count_documents({})
    total_enrollments = db.enrollments.count_documents({})
    total_attempts = db.test_attempts.count_documents({})
    passed_attempts = db.test_attempts.count_documents({"passed": True})

    all_attempts = list(db.test_attempts.find({}, {"score_percent": 1}))
    avg_score = 0
    if all_attempts:
        avg_score = round(sum(a["score_percent"] for a in all_attempts) / len(all_attempts), 1)

    completed_progress = db.progress.count_documents({"completed": True})
    total_progress = db.progress.count_documents({})
    completion_rate = 0
    if total_progress > 0:
        completion_rate = round(completed_progress / total_progress * 100, 1)

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_attempts": total_attempts,
        "passed_attempts": passed_attempts,
        "pass_rate": round(passed_attempts / total_attempts * 100, 1) if total_attempts else 0,
        "avg_score": avg_score,
        "completion_rate": completion_rate
    }

@router.get("/reports/course/{course_id}")
def admin_reports_course(course_id: str, admin=Depends(require_admin)):
    enrollments = list(db.enrollments.find({"course_id": course_id}))
    total_enrolled = len(enrollments)

    modules = list(db.modules.find({"course_id": course_id}).sort("order", 1))

    module_stats = []
    for module in modules:
        completed_count = db.progress.count_documents({
            "course_id": course_id,
            "module_title": module["title"],
            "completed": True
        })
        module_stats.append({
            "module_id": str(module["_id"]),
            "title": module["title"],
            "order": module["order"],
            "completed_by": completed_count,
            "completion_rate": round(completed_count / total_enrolled * 100, 1) if total_enrolled else 0
        })

    attempts = list(db.test_attempts.find({"course_id": course_id}))
    total_attempts = len(attempts)
    passed_attempts = len([a for a in attempts if a["passed"]])
    avg_score = 0
    if attempts:
        avg_score = round(sum(a["score_percent"] for a in attempts) / len(attempts), 1)

    users_completed_all = 0
    for enrollment in enrollments:
        uid = enrollment["user_id"]
        completed = db.progress.count_documents({
            "user_id": uid,
            "course_id": course_id,
            "completed": True
        })
        if completed >= len(modules):
            users_completed_all += 1

    return {
        "course_id": course_id,
        "total_enrolled": total_enrolled,
        "users_completed_all": users_completed_all,
        "overall_completion_rate": round(users_completed_all / total_enrolled * 100, 1) if total_enrolled else 0,
        "total_attempts": total_attempts,
        "passed_attempts": passed_attempts,
        "pass_rate": round(passed_attempts / total_attempts * 100, 1) if total_attempts else 0,
        "avg_score": avg_score,
        "module_stats": module_stats
    }
