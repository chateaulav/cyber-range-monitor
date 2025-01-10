from pydantic import BaseModel, Field, model_validator, ConfigDict,
from typing import Optional
from datetime import datetime

from api.models.user import UserRoles


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=3, max_length=100)

    @model_validator(mode='after')
    def check_creds(cls, v):
        SchemaCheck.no_space(v.username, 'Username')
        SchemaCheck.no_space(v.password, 'Password')
        return v


class UserAuth(BaseModel):
    id: int
    username: str
    permission: str


class ReadUser(BaseModel):
    id: int
    username: str
    permission: str
    password_hash: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BaseUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    permission: str = Field(
        default=UserRoles.user.value,
        min_length=3,
        max_length=20
    )
    password: str = Field(..., max_length=255)

    @model_validator(mode='after')
    def check_base_user(cls, v):
        if v.permission:
            SchemaCheck.check_permission(v.permission)

        if v.username:
            SchemaCheck.no_space(v.username, 'Username')

        if v.password:
            SchemaCheck.no_space(v.password, 'Password')

        return v


class CreateUser(BaseUser):
    pass


class UpdateUser(BaseUser):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    permission: Optional[str] = Field(None, min_length=3, max_length=20)
    password: Optional[str] = Field(None, max_length=255)