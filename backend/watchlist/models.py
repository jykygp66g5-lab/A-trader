from datetime import datetime, timezone

from sqlmodel import (
    Field,
    SQLModel,
    UniqueConstraint,
)


# =========================================================
# WATCHLIST DATABASE MODEL
# =========================================================

class WatchlistItem(
    SQLModel,
    table=True,
):
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "symbol",
            name="uq_watchlist_user_symbol",
        ),
    )

    id: int | None = Field(
        default=None,
        primary_key=True,
    )

    user_id: int = Field(
        foreign_key="user.id",
        index=True,
    )

    symbol: str = Field(
        index=True,
        min_length=1,
        max_length=20,
    )

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )


# =========================================================
# API RESPONSE MODEL
# =========================================================

class WatchlistItemRead(SQLModel):
    id: int

    symbol: str

    created_at: datetime
