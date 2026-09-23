from datetime import datetime, timezone

from sqlmodel import (
    Field,
    SQLModel,
)


class PushSubscription(
    SQLModel,
    table=True,
):
    id: int | None = Field(
        default=None,
        primary_key=True,
    )

    user_id: int = Field(
        foreign_key="user.id",
        index=True,
    )

    endpoint: str = Field(
        unique=True,
    )

    p256dh: str

    auth: str

    user_agent: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool = Field(
        default=True,
        index=True,
    )

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )

    updated_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )
