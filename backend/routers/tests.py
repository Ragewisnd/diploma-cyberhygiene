from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import db
from schemas.test import TestCreate, TestUpdate, TestSubmit
from security import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/tests", tags=["Tests"])

def serialize_test(test, hide_answers=False):
    questions = test.get("questions", [])
    if hide_answers:
        questions = [
            {
                "question": q["question"],
                "options": q["options"],
                "order": q.get("order", 0)
            }
            for q in questions
        ]
    return {
        "_id": str(test["_id"]),
        "course_id": test["course_id"],
        "title": test["title"],
        "description": test["description"],
        "pass_percent": test.get("pass_percent", 70),
        "shuffle_questions": test.get("shuffle_questions", False),
        "questions": questions
    }

@router.get("/")
def get_tests(current_user: dict = Depends(get_current_user)):
    tests = list(db.tests.find({}))
    return [serialize_test(t, hide_answers=True) for t in tests]

@router.get("/course/{course_id}")
def get_tests_by_course(course_id: str, current_user: dict = Depends(get_current_user)):
    tests = list(db.tests.find({"course_id": course_id}))
    return [serialize_test(t, hide_answers=True) for t in tests]

@router.get("/{test_id}")
def get_test(test_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(test_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid test id")

    test = db.tests.find_one({"_id": oid})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    return serialize_test(test, hide_answers=True)

@router.post("/")
def create_test(test: TestCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    test_data = test.model_dump()
    result = db.tests.insert_one(test_data)

    return {"message": "Test created successfully", "id": str(result.inserted_id)}

@router.put("/{test_id}")
def update_test(
    test_id: str,
    data: TestUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        oid = ObjectId(test_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid test id")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    db.tests.update_one({"_id": oid}, {"$set": update_data})

    return {"message": "Test updated"}

@router.post("/{test_id}/submit")
def submit_test(
    test_id: str,
    submission: TestSubmit,
    current_user: dict = Depends(get_current_user)
):
    try:
        oid = ObjectId(test_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid test id")

    test = db.tests.find_one({"_id": oid})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    questions = test.get("questions", [])
    pass_percent = test.get("pass_percent", 70)

    correct = 0
    detailed_answers = []

    for answer in submission.answers:
        matched_question = next(
            (q for q in questions if q["question"] == answer.question), None
        )
        is_correct = False
        correct_answer = ""
        explanation = ""

        if matched_question:
            correct_answer = matched_question["correct_answer"]
            explanation = matched_question.get("explanation", "")
            is_correct = answer.selected_answer == correct_answer
            if is_correct:
                correct += 1

        detailed_answers.append({
            "question": answer.question,
            "selected_answer": answer.selected_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": explanation
        })

    total = len(questions)
    score_percent = round((correct / total * 100), 2) if total > 0 else 0
    passed = score_percent >= pass_percent

    user_id = str(current_user["_id"])

    attempt_number = db.test_attempts.count_documents({
        "user_id": user_id,
        "test_id": test_id
    }) + 1

    attempt = {
        "user_id": user_id,
        "course_id": test["course_id"],
        "test_id": test_id,
        "score_percent": score_percent,
        "passed": passed,
        "correct": correct,
        "total": total,
        "answers": detailed_answers,
        "attempt_number": attempt_number,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    db.test_attempts.insert_one(attempt)

    if passed:
        db.progress.update_one(
            {
                "user_id": user_id,
                "course_id": test["course_id"],
                "module_title": test["title"]
            },
            {
                "$set": {
                    "user_id": user_id,
                    "course_id": test["course_id"],
                    "module_type": "test",
                    "module_title": test["title"],
                    "order": 99,
                    "completed": True
                }
            },
            upsert=True
        )

    return {
        "score_percent": score_percent,
        "correct": correct,
        "total": total,
        "passed": passed,
        "pass_percent": pass_percent,
        "attempt_number": attempt_number,
        "answers": detailed_answers
    }

@router.get("/attempts/me")
def get_my_attempts(
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    attempts = list(db.test_attempts.find({"user_id": user_id}).sort("created_at", -1))
    for a in attempts:
        a["_id"] = str(a["_id"])
    return attempts
