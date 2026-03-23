from pydantic import BaseModel
from typing import List

class AnswerItem(BaseModel):
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool

class ResultCreate(BaseModel):
    user_name: str
    course_id: str
    test_id: str
    score: int
    total_questions: int
    answers: List[AnswerItem]