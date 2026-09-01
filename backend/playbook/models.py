from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Column,
    JSON,
)

from sqlmodel import (
    Field,
    SQLModel,
)


# =========================================================
# PLAYBOOK BASE MODEL
# =========================================================

class PlaybookSetupBase(SQLModel):
    name: str = Field(
        min_length=1,
        max_length=150,
    )

    description: str = Field(
        default="",
        max_length=2000,
    )

    market_condition: str = Field(
        default="Trending",
        max_length=100,
    )

    timeframe: str = Field(
        default="5m",
        max_length=20,
    )

    max_risk_percent: float = Field(
        default=1,
        ge=0,
    )

    entry_rules: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )

    invalidation_rules: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )

    target_rules: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )

    confirmations: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )

    mistakes_to_avoid: list[str] = Field(
        default_factory=list,
        sa_column=Column(
            JSON,
            nullable=False,
        ),
    )


# =========================================================
# PLAYBOOK DATABASE MODEL
# =========================================================

class PlaybookSetup(
    PlaybookSetupBase,
    table=True,
):
    id: str = Field(
        default_factory=lambda:
            str(
                uuid4(),
            ),
        primary_key=True,
        max_length=100,
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

    updated_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
    )


# =========================================================
# PLAYBOOK CREATE MODEL
# =========================================================

class PlaybookSetupCreate(
    PlaybookSetupBase,
):
    pass


# =========================================================
# PLAYBOOK READ MODEL
# =========================================================

class PlaybookSetupRead(
    PlaybookSetupBase,
):
    id: str
    created_at: datetime
    updated_at: datetime


# =========================================================
# PLAYBOOK UPDATE MODEL
# =========================================================

class PlaybookSetupUpdate(SQLModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    market_condition: str | None = Field(
        default=None,
        max_length=100,
    )

    timeframe: str | None = Field(
        default=None,
        max_length=20,
    )

    max_risk_percent: float | None = Field(
        default=None,
        ge=0,
    )

    entry_rules: list[str] | None = None

    invalidation_rules: list[str] | None = None

    target_rules: list[str] | None = None

    confirmations: list[str] | None = None

    mistakes_to_avoid: list[str] | None = None