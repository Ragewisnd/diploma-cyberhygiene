from pydantic import BaseModel

class ProgressComplete(BaseModel):
    course_id: str
    module_type: str
    module_title: str
    order: int