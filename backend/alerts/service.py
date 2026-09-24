from datetime import datetime, timezone

from sqlmodel import (
    Session,
    select,
)

from .models import (
    Alert,
    AlertFrequency,
    AlertType,
    Notification,
)

from .schemas import (
    AlertCreate,
    AlertUpdate,
)


# =========================================================
# HELPERS
# =========================================================

def utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def normalize_symbol(
    symbol: str,
) -> str:
    return (
        symbol
        .strip()
        .upper()
    )


def alert_requires_threshold(
    alert_type: AlertType,
) -> bool:
    return alert_type in {
        AlertType.PRICE_ABOVE,
        AlertType.PRICE_BELOW,
        AlertType.PERCENT_CHANGE_ABOVE,
        AlertType.PERCENT_CHANGE_BELOW,
        AlertType.OPPORTUNITY_SCORE_ABOVE,
        AlertType.VOLUME_SPIKE,
    }


# =========================================================
# ALERTS
# =========================================================

def create_alert(
    *,
    session: Session,
    user_id: int,
    data: AlertCreate,
) -> Alert:
    symbol = normalize_symbol(
        data.symbol,
    )

    if not symbol:
        raise ValueError(
            "A symbol is required.",
        )

    if (
        alert_requires_threshold(
            data.alert_type,
        )
        and data.threshold is None
    ):
        raise ValueError(
            "This alert type requires a threshold.",
        )

    # Setup tracking is one tracker per user/symbol.
    # Scanner and Market Analyzer may both request the same
    # tracker, so reuse an existing active one instead of
    # creating duplicate rows.
    if data.alert_type == AlertType.POTENTIAL_ENTRY:
        existing_statement = (
            select(Alert)
            .where(
                Alert.user_id
                == user_id,
            )
            .where(
                Alert.symbol
                == symbol,
            )
            .where(
                Alert.alert_type
                == AlertType.POTENTIAL_ENTRY,
            )
            .where(
                Alert.is_active
                == True,
            )
            .order_by(
                Alert.created_at.asc(),
            )
        )

        existing_alert = session.exec(
            existing_statement,
        ).first()

        if existing_alert is not None:
            return existing_alert

    alert = Alert(
        user_id=user_id,
        symbol=symbol,
        alert_type=data.alert_type,
        threshold=data.threshold,
        frequency=data.frequency,
    )

    session.add(
        alert,
    )

    session.commit()

    session.refresh(
        alert,
    )

    return alert


def get_user_alerts(
    *,
    session: Session,
    user_id: int,
) -> list[Alert]:
    statement = (
        select(Alert)
        .where(
            Alert.user_id
            == user_id,
        )
        .order_by(
            Alert.created_at.desc(),
        )
    )

    return list(
        session.exec(
            statement,
        ).all()
    )


def get_user_alert(
    *,
    session: Session,
    user_id: int,
    alert_id: int,
) -> Alert | None:
    statement = (
        select(Alert)
        .where(
            Alert.id
            == alert_id,
        )
        .where(
            Alert.user_id
            == user_id,
        )
    )

    return session.exec(
        statement,
    ).first()


def update_alert(
    *,
    session: Session,
    alert: Alert,
    data: AlertUpdate,
) -> Alert:
    update_data = (
        data.model_dump(
            exclude_unset=True,
        )
    )

    # These fields are nullable in AlertUpdate only so they
    # can be omitted from a PATCH request. Explicit null
    # values are not valid for the persisted Alert model.
    non_nullable_fields = {
        "frequency",
        "is_active",
    }

    for field_name in non_nullable_fields:
        if (
            field_name in update_data
            and update_data[field_name] is None
        ):
            raise ValueError(
                f"{field_name} cannot be null."
            )

    # Threshold may be null for alert types that do not use
    # a numeric threshold, but threshold-based alerts must
    # always retain one.
    if (
        "threshold" in update_data
        and update_data["threshold"] is None
        and alert_requires_threshold(
            alert.alert_type,
        )
    ):
        raise ValueError(
            "Threshold cannot be null "
            "for this alert type."
        )

    for (
        field_name,
        value,
    ) in update_data.items():
        setattr(
            alert,
            field_name,
            value,
        )

    alert.updated_at = utc_now()

    session.add(
        alert,
    )

    session.commit()

    session.refresh(
        alert,
    )

    return alert


def delete_alert(
    *,
    session: Session,
    alert: Alert,
) -> None:
    session.delete(
        alert,
    )

    session.commit()


def deactivate_alert(
    *,
    session: Session,
    alert: Alert,
) -> Alert:
    alert.is_active = False

    alert.updated_at = utc_now()

    session.add(
        alert,
    )

    session.commit()

    session.refresh(
        alert,
    )

    return alert


# =========================================================
# ENGINE-RELATED ALERT OPERATIONS
# =========================================================

def get_active_alerts(
    *,
    session: Session,
) -> list[Alert]:
    statement = (
        select(Alert)
        .where(
            Alert.is_active
            == True,  # noqa: E712
        )
        .order_by(
            Alert.id,
        )
    )

    return list(
        session.exec(
            statement,
        ).all()
    )


def record_alert_check(
    *,
    session: Session,
    alert: Alert,
    observed_value: float | None = None,
    observed_state: str | None = None,
) -> Alert:
    alert.last_checked_at = (
        utc_now()
    )

    if observed_value is not None:
        alert.last_observed_value = (
            observed_value
        )

    if observed_state is not None:
        alert.last_observed_state = (
            observed_state
        )

    session.add(
        alert,
    )

    session.commit()

    session.refresh(
        alert,
    )

    return alert



# =========================================================
# ALERT FREQUENCY GATE
# =========================================================

def can_alert_trigger(
    *,
    alert: Alert,
    now=None,
) -> bool:
    """
    Return whether an alert is allowed to create a new
    notification according to its configured frequency.

    Condition evaluation and re-arming are separate from
    this frequency gate.
    """
    if not alert.is_active:
        return False

    if (
        alert.frequency
        == AlertFrequency.EVERY_OCCURRENCE
    ):
        return True

    if (
        alert.frequency
        == AlertFrequency.ONCE
    ):
        return alert.trigger_count == 0

    if (
        alert.frequency
        == AlertFrequency.ONCE_PER_DAY
    ):
        if alert.last_triggered_at is None:
            return True

        current_time = (
            now
            if now is not None
            else utc_now()
        )

        last_triggered = (
            alert.last_triggered_at
        )

        # PostgreSQL may return a naive datetime depending
        # on the column configuration. Compare calendar
        # dates consistently rather than subtracting them.
        return (
            last_triggered.date()
            != current_time.date()
        )

    return False



def record_alert_trigger(
    *,
    session: Session,
    alert: Alert,
    observed_value: float | None = None,
    observed_state: str | None = None,
    commit: bool = True,
) -> Alert:
    now = utc_now()

    alert.last_checked_at = now
    alert.last_triggered_at = now

    if observed_value is not None:
        alert.last_observed_value = (
            observed_value
        )

    if observed_state is not None:
        alert.last_observed_state = (
            observed_state
        )

    alert.trigger_count += 1

    if (
        alert.frequency
        == AlertFrequency.ONCE
    ):
        alert.is_active = False

    alert.updated_at = now

    session.add(
        alert,
    )

    if commit:
        session.commit()

        session.refresh(
            alert,
        )
    else:
        session.flush()

    return alert


# =========================================================
# NOTIFICATIONS
# =========================================================

def get_user_notifications(
    *,
    session: Session,
    user_id: int,
    limit: int = 50,
) -> list[Notification]:
    safe_limit = max(
        1,
        min(
            limit,
            100,
        ),
    )

    statement = (
        select(Notification)
        .where(
            Notification.user_id
            == user_id,
        )
        .order_by(
            Notification.created_at.desc(),
        )
        .limit(
            safe_limit,
        )
    )

    return list(
        session.exec(
            statement,
        ).all()
    )


def get_user_notification(
    *,
    session: Session,
    user_id: int,
    notification_id: int,
) -> Notification | None:
    statement = (
        select(Notification)
        .where(
            Notification.id
            == notification_id,
        )
        .where(
            Notification.user_id
            == user_id,
        )
    )

    return session.exec(
        statement,
    ).first()


def get_unread_notification_count(
    *,
    session: Session,
    user_id: int,
) -> int:
    statement = (
        select(Notification)
        .where(
            Notification.user_id
            == user_id,
        )
        .where(
            Notification.is_read
            == False,  # noqa: E712
        )
    )

    return len(
        session.exec(
            statement,
        ).all()
    )


def mark_notification_read(
    *,
    session: Session,
    notification: Notification,
) -> Notification:
    if not notification.is_read:
        notification.is_read = True

        notification.read_at = (
            utc_now()
        )

        session.add(
            notification,
        )

        session.commit()

        session.refresh(
            notification,
        )

    return notification


def mark_all_notifications_read(
    *,
    session: Session,
    user_id: int,
) -> int:
    statement = (
        select(Notification)
        .where(
            Notification.user_id
            == user_id,
        )
        .where(
            Notification.is_read
            == False,  # noqa: E712
        )
    )

    notifications = list(
        session.exec(
            statement,
        ).all()
    )

    if not notifications:
        return 0

    now = utc_now()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now

        session.add(
            notification,
        )

    session.commit()

    return len(
        notifications,
    )