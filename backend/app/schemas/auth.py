"""Authentication schemas."""

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["elena@webvory.com"])
    password: str = Field(min_length=1, examples=["password123"])

    @field_validator("email")
    @classmethod
    def _normalise_email(cls, value: str) -> str:
        return value.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Token lifetime in seconds")
    user: UserRead
