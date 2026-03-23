from fastapi import APIRouter
from database import db
from schemas.test import TestCreate

router = APIRouter(prefix="/tests", tags=["Tests"])

def serialize_test(test):
    return {
        "_id": str(test["_id"]),
        "course_id": test["course_id"],
        "title": test["title"],
        "description": test["description"],
        "questions": test["questions"]
    }

@router.get("/")
def get_tests():
    tests = list(db.tests.find({}))
    return [serialize_test(test) for test in tests]

@router.get("/course/{course_id}")
def get_tests_by_course(course_id: str):
    tests = list(db.tests.find({"course_id": course_id}))
    return [serialize_test(test) for test in tests]

@router.post("/")
def create_test(test: TestCreate):
    test_data = test.model_dump()
    result = db.tests.insert_one(test_data)

    return {
        "message": "Test created successfully",
        "id": str(result.inserted_id),
        "test": {
            "course_id": test_data["course_id"],
            "title": test_data["title"],
            "description": test_data["description"],
            "questions": test_data["questions"]
        }
    }