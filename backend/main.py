from fastapi import FastAPI
from database import client, mongodb_db_name
from routers.courses import router as courses_router
from routers.lessons import router as lessons_router
from routers.tests import router as tests_router
from routers.results import router as results_router
from routers.auth import router as auth_router
from routers.users import router as users_router

app = FastAPI(title="CyberHygiene API")

app.include_router(courses_router)
app.include_router(lessons_router)
app.include_router(tests_router)
app.include_router(results_router)
app.include_router(auth_router)
app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "CyberHygiene API is running"}

@app.get("/health")
def health():
    try:
        client.admin.command("ping")
        return {
            "status": "ok",
            "database": mongodb_db_name,
            "mongodb": "connected"
        }
    except Exception as e:
        return {
            "status": "error",
            "mongodb": str(e)
        }