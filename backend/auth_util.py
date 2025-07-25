from passlib.context import CryptContext
from fastapi import HTTPException, status, Response, Request, Depends
from pymongo.collection import Collection
from jwt_util import create_access_token, decode_access_token
import os

# Determine if running in production
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

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
        secure=IS_PRODUCTION,  # True in production (HTTPS), False in development
        samesite="lax",
        max_age=3600,
        path="/",
        domain=".crimsonbites.com" if IS_PRODUCTION else None  # Share cookies across subdomains in production
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")

def get_user_by_email(users_collection: Collection, email: str):
    return users_collection.find_one({"email": email})

def get_current_user(request: Request, users_collection: Collection):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = users_collection.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user