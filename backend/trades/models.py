from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    JSON,
)

from sqlmodel import (
    Field,
    SQLModel,
)


# =========================================================
# TRADE BASE MODEL
# =========================================================

class TradeBase(SQLModel):
    symbol: str = Field(
        index=True,
        min_length=1,
        max_length=10,
    )

    direction: str = Field(
        min_length=1,
        max_length=20,
    )

    entry_price: float = Field(
        gt=0,
    )

    exit_price: float = Field(
        gt=0,
    )

    stop_loss: float | None = Field(
        default=None,
        gt=0,
    )

    target_price: float | None = Field(
        default=None,
        gt=0,
    )

    position_size: float = Field(
        gt=0,
    )

    risk_percent: float = Field(
        ge=0,
    )

    strategy: str = Field(
        min_length=1,
        max_length=100,
    )

    custom_strategy: str = Field(
        default="",
        max_length=100,
    )

    playbook_setup_id: str = Field(
        default="",
        max_length=100,
    )

    playbook_setup_name: str = Field(
        default="",
        max_length=150,
    )

    tags: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )

    confidence: int = Field(
        ge=1,
        le=10,
    )

    psychology_notes: str = ""

    lesson_learned: str = ""

    trade_time: datetime | None = None


# =========================================================
# TRADE DATABASE MODEL
# =========================================================

class Trade(
    TradeBase,
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

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )


# =========================================================
# TRADE CREATE MODEL
# =========================================================

class TradeCreate(
    TradeBase,
):
    pass


# =========================================================
# TRADE READ MODEL
# =========================================================

class TradeRead(
    TradeBase,
):
    id: int

    created_at: datetime


# =========================================================
# TRADE UPDATE MODEL
# =========================================================

class TradeUpdate(SQLModel):
    symbol: str | None = Field(
        default=None,
        min_length=1,
        max_length=10,
    )

    direction: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    entry_price: float | None = Field(
        default=None,
        gt=0,
    )

    exit_price: float | None = Field(
        default=None,
        gt=0,
    )

    stop_loss: float | None = Field(
        default=None,
        gt=0,
    )

    target_price: float | None = Field(
        default=None,
        gt=0,
    )

    position_size: float | None = Field(
        default=None,
        gt=0,
    )

    risk_percent: float | None = Field(
        default=None,
        ge=0,
    )

    strategy: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    custom_strategy: str | None = Field(
        default=None,
        max_length=100,
    )

    playbook_setup_id: str | None = Field(
        default=None,
        max_length=100,
    )

    playbook_setup_name: str | None = Field(
        default=None,
        max_length=150,
    )

    tags: list[str] | None = None

    confidence: int | None = Field(
        default=None,
        ge=1,
        le=10,
    )

    psychology_notes: str | None = None

    lesson_learned: str | None = None

    trade_time: datetime | None = None