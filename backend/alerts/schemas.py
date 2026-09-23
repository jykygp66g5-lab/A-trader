from datetime import datetime

from sqlmodel import (
    Field,
    SQLModel,
)

from .models import (
    AlertFrequency,
    AlertType,
    NotificationType,
)


# =========================================================
# ALERT CREATE
# =========================================================

class AlertCreate(SQLModel):
    symbol: str = Field(
        min_length=1,
        max_length=20,
    )

    alert_type: AlertType

    threshold: float | None = None

    frequency: AlertFrequency = (
        AlertFrequency.ONCE
    )


# =========================================================
# ALERT UPDATE
# =========================================================

class AlertUpdate(SQLModel):
    threshold: float | None = None

    frequency: AlertFrequency | None = None

    is_active: bool | None = None


# =========================================================
# ALERT RESPONSE
# =========================================================

class AlertRead(SQLModel):
    id: int

    symbol: str

    alert_type: AlertType

    threshold: float | None

    frequency: AlertFrequency

    is_active: bool

    created_at: datetime

    updated_at: datetime

    last_checked_at: datetime | None

    last_triggered_at: datetime | None

    last_observed_value: float | None

    last_observed_state: str | None

    trigger_count: int


# =========================================================
# ALERT LIST
# =========================================================

class AlertListResponse(SQLModel):
    alerts: list[AlertRead]

    count: int

    active_count: int


# =========================================================
# NOTIFICATION RESPONSE
# =========================================================

class NotificationRead(SQLModel):
    id: int

    alert_id: int | None

    notification_type: NotificationType

    symbol: str | None

    title: str

    message: str

    trigger_value: float | None

    target_url: str | None

    is_read: bool

    created_at: datetime

    read_at: datetime | None


# =========================================================
# NOTIFICATION LIST
# =========================================================

class NotificationListResponse(SQLModel):
    notifications: list[NotificationRead]

    count: int

    unread_count: int


# =========================================================
# UNREAD COUNT
# =========================================================

class NotificationUnreadCount(SQLModel):
    unread_count: int


# =========================================================
# SIMPLE API MESSAGE
# =========================================================

class AlertMessage(SQLModel):
    message: str