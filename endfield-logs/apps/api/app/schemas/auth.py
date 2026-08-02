from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class SendCodeRequest(BaseModel):
    email: EmailStr
    purpose: Literal["web_login", "uploader_login"]


class SendCodeResponse(BaseModel):
    ok: bool
    cooldownSeconds: int
    purpose: str
    debugCode: str | None = None


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    purpose: Literal["web_login", "uploader_login"]
    code: str


class CompleteProfileRequest(BaseModel):
    profileSetupToken: str
    nickname: str


class PasswordRegisterRequest(BaseModel):
    email: EmailStr
    purpose: Literal["web_login", "uploader_login"]
    password: str = Field(min_length=8, max_length=128)
    nickname: str = Field(min_length=2, max_length=32)
    code: str | None = Field(default=None, min_length=1, max_length=16)


class PasswordLoginRequest(BaseModel):
    email: EmailStr
    purpose: Literal["web_login", "uploader_login"]
    password: str = Field(min_length=1, max_length=128)


class UpdateNicknameRequest(BaseModel):
    nickname: str = Field(min_length=2, max_length=32)


class CheckNicknameResponse(BaseModel):
    available: bool


class CheckEmailResponse(BaseModel):
    available: bool


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    nickname: str
    isAdmin: bool = False


class VerifyCodeResponse(BaseModel):
    status: Literal["authenticated", "needs_profile"]
    user: AuthUser | None = None
    profileSetupToken: str | None = None
    sessionToken: str | None = None
    clientType: Literal["web", "uploader"] | None = None


class AuthSessionResponse(BaseModel):
    status: Literal["authenticated"]
    user: AuthUser
    sessionToken: str | None = None
    clientType: Literal["web", "uploader"]


class AuthMeResponse(BaseModel):
    authenticated: bool
    user: AuthUser | None = None


class LogoutResponse(BaseModel):
    ok: bool
