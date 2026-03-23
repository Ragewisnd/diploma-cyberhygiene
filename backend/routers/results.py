from fastapi import APIRouter
from database import db
from schemas.result import ResultCreate

router = APIRouter(prefix="/results", tags=["Results"])

def serialize_result(result):
    return {
        "_id": str(result["_id"]),
        "user_name": result["user_name"],
        "course_id": result["course_id"],
        "test_id": result["test_id"],
        "score": result["score"],
        "total_questions": result["total_questions"],
        "answers": result["answers"]
    }

@router.get("/")
def get_results():
    results = list(db.results.find({}))
    return [serialize_result(result) for result in results]

@router.get("/test/{test_id}")
def get_results_by_test(test_id: str):
    results = list(db.results.find({"test_id": test_id}))
    return [serialize_result(result) for result in results]

@router.post("/")
def create_result(result: ResultCreate):
    result_data = result.model_dump()
    inserted = db.results.insert_one(result_data)

    return {
        "message": "Result created successfully",
        "id": str(inserted.inserted_id),
        "result": {
            "user_name": result_data["user_name"],
            "course_id": result_data["course_id"],
            "test_id": result_data["test_id"],
            "score": result_data["score"],
            "total_questions": result_data["total_questions"],
            "answers": result_data["answers"]
        }
    }