from pydantic import BaseModel
from typing import List, Optional

class QuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = ""
    order: int = 0

class TestCreate(BaseModel):
    course_id: str
    title: str
    description: str
    pass_percent: int = 70
    shuffle_questions: bool = False
    questions: List[QuestionItem] = []

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pass_percent: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    questions: Optional[List[QuestionItem]] = None

class AnswerItem(BaseModel):
    question: str
    selected_answer: str

class TestSubmit(BaseModel):
    answers: List[AnswerItem]
