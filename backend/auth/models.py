from datetime import datetime, timezone

from sqlmodel import (
    Field,
    SQLModel,
)


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