from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import client, mongodb_db_name
from routers.courses import router as courses_router
from routers.lessons import router as lessons_router
from routers.tests import router as tests_router
from routers.results import router as results_router
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.enrollments import router as enrollments_router
from routers.progress import router as progress_router
from routers.dashboard import router as dashboard_router
from routers.modules import router as modules_router
from routers.admin import router as admin_router

app = FastAPI(title="CyberHygiene API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(modules_router)
app.include_router(lessons_router)
app.include_router(tests_router)
app.include_router(results_router)
app.include_router(enrollments_router)
app.include_router(progress_router)
app.include_router(dashboard_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "CyberHygiene API is running"}

@app.get("/health")
def health():
    try:
        client.admin.command("ping")
        return {"status": "ok", "database": mongodb_db_name, "mongodb": "connected"}
    except Exception as e:
        return {"status": "error", "mongodb": str(e)}
