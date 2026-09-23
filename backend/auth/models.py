from datetime import datetime, timezone

from sqlmodel import (
    Field,
    SQLModel,
)


# =========================================================
# LEGAL DOCUMENT VERSIONS
# =========================================================

CURRENT_TERMS_VERSION = "2026-09-15"
CURRENT_PRIVACY_VERSION = "2026-09-15"


# =========================================================
# USER DATABASE MODEL
# =========================================================

class User(
    SQLModel,
    table=True,
):
    id: int | None = Field(
        default=None,
        primary_key=True,
    )

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: str = Field(
        index=True,
        unique=True,
        max_length=255,
    )

    hashed_password: str

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )

    age_confirmed_at: datetime | None = Field(
        default=None,
    )

    terms_version: str | None = Field(
        default=None,
        max_length=50,
    )

    terms_accepted_at: datetime | None = Field(
        default=None,
    )

    privacy_version: str | None = Field(
        default=None,
        max_length=50,
    )

    privacy_accepted_at: datetime | None = Field(
        default=None,
    )


# =========================================================
# USER CREATE
# =========================================================

class UserCreate(SQLModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

    email: str = Field(
        min_length=3,
        max_length=255,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    age_confirmed: bool

    terms_accepted: bool

    privacy_accepted: bool

    terms_version: str = Field(
        min_length=1,
        max_length=50,
    )

    privacy_version: str = Field(
        min_length=1,
        max_length=50,
    )


# =========================================================
# USER RESPONSE
# =========================================================

class UserRead(SQLModel):
    id: int

    name: str

    email: str

    created_at: datetime


# =========================================================
# AUTH TOKEN
# =========================================================

class Token(SQLModel):
    access_token: str

    token_type: str
