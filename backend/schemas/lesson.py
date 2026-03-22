from pydantic import BaseModel

class LessonCreate(BaseModel):
    course_id: str
    title: str
    content: str
    order: int