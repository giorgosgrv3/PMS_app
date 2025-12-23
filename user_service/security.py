from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.hash import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pydantic import ValidationError  
from sqlalchemy.orm import Session  

from models import Role, User  
from schemas import TokenData  
from db import get_db  
import os

# secret key, hashing algorithm, token expiration duration
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_please_change") #the default is only in case of failure to read from .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ---- password hashing ----------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password) #checks if the passwd provided in sign in matches the one in the DB

def get_password_hash(password: str) -> str:
    return bcrypt.hash(password) #hash passwd provided by user, used in routes.py when user registers

# ----- JTW token creation

# called by login_for_access_token
# takes the data given to it, adds the expiration time (1hr), encrypts the data using jwt.encode()
# sends it back to login_for_access_token
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

#looks for user's token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/token")

# standard error in case of failure
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    #break down token, find user
    try:
        # 1. decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 2. extract data from token
        token_data = TokenData(
            username=payload.get("sub"), 
            role=payload.get("role")
        )
        
        if token_data.username is None:
            raise credentials_exception
            
    except (JWTError, ValidationError):
        # error if token is invalid or expired
        raise credentials_exception

    # 3. find the user in the db
    user = db.query(User).filter(User.username == token_data.username).first()
    
    if user is None:
        raise credentials_exception
        
    # 4. check if user is active
    if not user.active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have privileges to perform this action"
        )
    return current_user