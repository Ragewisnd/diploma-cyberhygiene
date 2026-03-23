from pydantic import BaseModel

class ModuleCreate(BaseModel):
    course_id: str
    title: str
    module_type: str
    content: str
    order: int