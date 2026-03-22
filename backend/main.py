from fastapi import FastAPI
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="CyberHygiene API")

mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
mongodb_db_name = os.getenv("MONGODB_DB", "cyberhygiene")

client = MongoClient(mongodb_url)
db = client[mongodb_db_name]

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