from pydantic import BaseModel
from typing import List, Optional

class ContentBlock(BaseModel):
    order: int
    type: str = "text"
    title: str
    text: str

class ModuleCreate(BaseModel):
    course_id: str
    title: str
    module_type: str
    order: int
    is_required: bool = True
    estimated_minutes: int = 10
    content: List[ContentBlock] = []

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    module_type: Optional[str] = None
    order: Optional[int] = None
    is_required: Optional[bool] = None
    estimated_minutes: Optional[int] = None
    content: Optional[List[ContentBlock]] = None
