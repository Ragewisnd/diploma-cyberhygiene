from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
mongodb_db_name = os.getenv("MONGODB_DB", "cyberhygiene")

client = MongoClient(mongodb_url)
db = client[mongodb_db_name]