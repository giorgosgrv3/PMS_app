from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict
from models import Role

# these are provided when we create a user
class UserCreate(BaseModel):
    username:   str = Field(min_length=3, max_length=64)
    email:      EmailStr
    password:   str = Field(min_length=3, max_length=72)
    first_name: str = Field(min_length=1, max_length=64)
    last_name:  str = Field(min_length=1, max_length=64)

#these are what is SHOWN when we do GET /users
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username:   str
    email:      EmailStr
    first_name: str
    last_name:  str
    role:       Role
    active:     bool
    avatar_filename: Optional[str] = None

class Token(BaseModel):
    # schema for what we return to user after login, the user is characterized by the token
    access_token: str
    token_type: str

class TokenData(BaseModel):
    #schema for the data contained INSIDE the JWT
    username: str | None = None
    role: Role | None = None

class UserRoleUpdate(BaseModel):
    role: Role # only valid values from the enum