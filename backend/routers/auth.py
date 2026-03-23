from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from database import db
from schemas.user import UserCreate
from schemas.auth import Token
from security import get_password_hash, authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(user: UserCreate):
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    user_data = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "role": "user",
        "level": 0
    }

    result = db.users.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "id": str(result.inserted_id),
        "user": {
            "full_name": user_data["full_name"],
            "email": user_data["email"],
            "role": user_data["role"],
            "level": user_data["level"]
        }
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }