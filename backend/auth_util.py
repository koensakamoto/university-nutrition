from passlib.context import CryptContext
from fastapi import HTTPException, status, Response, Request, Depends
from pymongo.collection import Collection
from jwt_util import create_access_token, decode_access_token

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
        path="/",
        domain=None  # Let browser set domain automatically for localhost/127.0.0.1 compatibility
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")

def get_user_by_email(users_collection: Collection, email: str):
    return users_collection.find_one({"email": email})

def get_current_user(request: Request, users_collection: Collection):
    print(f"Checking auth for: {request.url}")
    print(f"All cookies: {dict(request.cookies)}")
    token = request.cookies.get("access_token")
    print(f"Access token found: {bool(token)}")
    if not token:
        print("No access token found in cookies")
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(token)
        print(f"Token decoded successfully for: {payload.get('sub')}")
    except Exception as e:
        print(f"Token decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    user = users_collection.find_one({"email": payload["sub"]})
    if not user:
        print(f"User not found for email: {payload.get('sub')}")
        raise HTTPException(status_code=401, detail="User not found")
    print(f"User authenticated successfully: {payload.get('sub')}")
    return user