from datetime import datetime, timezone
from enum import Enum

from sqlmodel import (
    Field,
    SQLModel,
)


# =========================================================
# ENUMS
# =========================================================

class AlertType(str, Enum):
    PRICE_ABOVE = "price_above"
    PRICE_BELOW = "price_below"

    PERCENT_CHANGE_ABOVE = "percent_change_above"
    PERCENT_CHANGE_BELOW = "percent_change_below"

    OPPORTUNITY_SCORE_ABOVE = "opportunity_score_above"

    POTENTIAL_ENTRY = "potential_entry"

    BREAKOUT = "breakout"
    BREAKDOWN = "breakdown"

    VOLUME_SPIKE = "volume_spike"

    GOLDEN_CROSS = "golden_cross"
    DEATH_CROSS = "death_cross"


class AlertFrequency(str, Enum):
    ONCE = "once"
    ONCE_PER_DAY = "once_per_day"
    EVERY_OCCURRENCE = "every_occurrence"


class NotificationType(str, Enum):
    ALERT_TRIGGERED = "alert_triggered"
    SYSTEM = "system"


# =========================================================
# ALERT
# =========================================================

class Alert(
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

    symbol: str = Field(
        index=True,
        min_length=1,
        max_length=20,
    )

    alert_type: AlertType = Field(
        index=True,
    )

    threshold: float | None = Field(
        default=None,
    )

    frequency: AlertFrequency = Field(
        default=AlertFrequency.ONCE,
    )

    is_active: bool = Field(
        default=True,
        index=True,
    )

    # Used by crossing-based alerts to prevent repeated
    # notifications when a value oscillates around the
    # configured threshold.
    is_armed: bool = Field(
        default=True,
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

    last_checked_at: datetime | None = Field(
        default=None,
    )

    last_triggered_at: datetime | None = Field(
        default=None,
    )

    last_observed_value: float | None = Field(
        default=None,
    )

    last_observed_state: str | None = Field(
        default=None,
        max_length=50,
    )

    trigger_count: int = Field(
        default=0,
    )


# =========================================================
# NOTIFICATION
# =========================================================

class Notification(
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

    alert_id: int | None = Field(
        default=None,
        foreign_key="alert.id",
        index=True,
    )

    notification_type: NotificationType = Field(
        default=NotificationType.ALERT_TRIGGERED,
        index=True,
    )

    symbol: str | None = Field(
        default=None,
        index=True,
        max_length=20,
    )

    title: str = Field(
        max_length=200,
    )

    message: str = Field(
        max_length=1000,
    )

    trigger_value: float | None = Field(
        default=None,
    )

    target_url: str | None = Field(
        default=None,
        max_length=500,
    )

    is_read: bool = Field(
        default=False,
        index=True,
    )

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc,
            ),
        index=True,
    )

    read_at: datetime | None = Field(
        default=None,
    )