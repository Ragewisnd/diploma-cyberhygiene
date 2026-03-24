from pydantic import BaseModel
from typing import Optional

class CourseCreate(BaseModel):
    title: str
    description: str
    category: str = "general"
    is_published: bool = False
    order: int = 0

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None
    order: Optional[int] = None
