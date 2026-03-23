from pydantic import BaseModel
from typing import List

class QuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class TestCreate(BaseModel):
    course_id: str
    title: str
    description: str
    questions: List[QuestionItem]