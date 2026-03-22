from pydantic import BaseModel

class CourseCreate(BaseModel):
    title: str
    description: str
    order: int

class CourseResponse(BaseModel):
    title: str
    description: str
    order: int