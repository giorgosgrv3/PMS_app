from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import ValidationError
import os
from motor.motor_asyncio import AsyncIOMotorDatabase # NEW IMPORT
from db import get_database # NEW IMPORT
from bson import ObjectId # NEW IMPORT
from models import Team # NEW IMPORT


# We import our local schema for TokenData
from schemas import TokenData, Role

# --- Settings (MUST be the same as user_service) ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256" 

bearer_scheme = HTTPBearer()

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> TokenData:
    """
    The new "get_current_user" for this microservice.
    It DOES NOT query a database.
    It simply decodes the token and trusts its contents.
    """
    if SECRET_KEY is None:
        raise Exception("SECRET_KEY not set in environment")
        
    try:
        # 1. Decode the token using the *shared* SECRET_KEY
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 2. Get the data from the token payload
        token_data = TokenData(
            username=payload.get("sub"), 
            role=payload.get("role")
        )
        if token_data.username is None or token_data.role is None:
            raise credentials_exception
            
    except (JWTError, ValidationError):
        raise credentials_exception
    
    token_data.token = token.credentials 

    # return trusted data
    return token_data


async def get_current_admin_user(
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    
    if current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have privileges to perform this action"
        )
    return current_user

async def get_team_leader_or_admin(
    team_id: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Team: # returns team obj if success
    
    #returns the team document if authorized, otherwise raises 403/404.
    
    try:
        obj_id = ObjectId(team_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid team ID format")

    # find team in the database
    team_doc = await db["teams"].find_one({"_id": obj_id})
    
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")

    # convert to pydantic model
    team = Team(**team_doc)

    # this is the core logic, check if admin or team leader. this should succeed if one of the two is true
    if current_user.role == Role.ADMIN or team.leader_id == current_user.username:
        return team
    
    # if we get here, then the user is NEITHER admin NOR team leader
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to modify this team."
    )

async def get_team_leader_only(
    team_id: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Team:

    # block Admin users from accessing team functionalities (such as member addition)
    if current_user.role == Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin users cannot manage team members directly; this is a Team Leader function."
        )
    
    # check TEAM ID validity and find the team
    try:
        obj_id = ObjectId(team_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid team ID format")

    team_doc = await db["teams"].find_one({"_id": obj_id})
    
    if not team_doc:
        raise HTTPException(status_code=404, detail="Team not found")

    team = Team(**team_doc)
    
    # is the non-admin user the actual leader?
    if team.leader_id == current_user.username:
        return team
    
    # fail if not the leader
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to manage members for this team."
    )

# This is used during the task creation.
async def get_team_access_or_admin(
    team_id: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Team:

    #Check if a user is an ADMIN or MEMBER of the specific team
    #Returns the team document if authorized

    # ambiguous error when team isn't found or access is denied
    ambiguous_error = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="The requested resource was not found or is inaccessible."
    )

    try:
        obj_id = ObjectId(team_id)
    except Exception:
        # return separate error in case of invalid team ID format, more informative than the ambiguous above
        raise HTTPException(status_code=400, detail="Invalid team ID format") 

    team_doc = await db["teams"].find_one({"_id": obj_id})
    
    # 404 not found ?? then return ambiguous error
    if not team_doc:
        raise ambiguous_error 

    team = Team(**team_doc)
    
    # 2. 403 ?? then user is ADMIN or MEMBER
    if current_user.role == Role.ADMIN or current_user.username in team.member_ids:
        return team 
    
    # 3. if user NOT ADMIN or MEMBER, return ambiguous again
    raise ambiguous_error
    