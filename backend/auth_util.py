from passlib.context import CryptContext
from fastapi import HTTPException, status, Response, Request, Depends
from pymongo.collection import Collection
from .jwt_utils import create_access_token, decode_access_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS)
        samesite="lax",
        max_age=3600,
        path="/"
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")

def get_user_by_email(users_collection: Collection, email: str):
    return users_collection.find_one({"email": email})

def get_current_user(request: Request, users_collection: Collection):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    user = users_collection.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user