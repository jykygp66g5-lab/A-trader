from sqlmodel import Session

from .models import (
    Alert,
    Notification,
    NotificationType,
)
from .push_service import send_push_to_user


# =========================================================
# MESSAGE BUILDING
# =========================================================

def build_alert_notification_message(
    *,
    alert: Alert,
    trigger_value: float | None,
) -> tuple[str, str]:
    symbol = alert.symbol

    # Threshold-based alerts should normally always have
    # a threshold because alert creation validates them.
    # Keep notification generation defensive so malformed
    # or legacy data cannot crash the alert engine.
    threshold = alert.threshold

    if alert.alert_type.value == "price_above":
        title = f"{symbol} crossed above your price level"
        message = (
            f"{symbol} crossed above "
            f"${threshold:,.2f}."
            if threshold is not None
            else f"{symbol} crossed above your configured price level."
        )

    elif alert.alert_type.value == "price_below":
        title = f"{symbol} crossed below your price level"
        message = (
            f"{symbol} crossed below "
            f"${threshold:,.2f}."
            if threshold is not None
            else f"{symbol} crossed below your configured price level."
        )

    elif alert.alert_type.value == "percent_change_above":
        title = f"{symbol} reached your movement alert"
        message = (
            f"{symbol} moved above your "
            f"{threshold:,.2f}% threshold."
            if threshold is not None
            else f"{symbol} moved above your configured movement level."
        )

    elif alert.alert_type.value == "percent_change_below":
        title = f"{symbol} reached your movement alert"
        message = (
            f"{symbol} moved below your "
            f"{threshold:,.2f}% threshold."
            if threshold is not None
            else f"{symbol} moved below your configured movement level."
        )

    elif alert.alert_type.value == "opportunity_score_above":
        title = f"{symbol} Opportunity Score changed"
        message = (
            f"{symbol} reached an Opportunity Score "
            f"above {threshold:,.0f}."
            if threshold is not None
            else f"{symbol} reached your configured Opportunity Score level."
        )

    elif alert.alert_type.value == "potential_entry":
        title = f"{symbol} setup status changed"
        message = (
            f"{symbol} now meets A-Trader's "
            f"Potential Entry setup criteria."
        )

    elif alert.alert_type.value == "breakout":
        title = f"{symbol} breakout detected"
        message = (
            f"A-Trader detected a breakout "
            f"setup for {symbol}."
        )

    elif alert.alert_type.value == "breakdown":
        title = f"{symbol} breakdown detected"
        message = (
            f"A-Trader detected a breakdown "
            f"setup for {symbol}."
        )

    elif alert.alert_type.value == "volume_spike":
        title = f"{symbol} volume spike detected"
        message = (
            f"{symbol} reached your configured "
            f"volume-spike threshold."
        )

    elif alert.alert_type.value == "golden_cross":
        title = f"{symbol} Golden Cross detected"
        message = (
            f"A-Trader detected a Golden Cross "
            f"for {symbol}."
        )

    elif alert.alert_type.value == "death_cross":
        title = f"{symbol} Death Cross detected"
        message = (
            f"A-Trader detected a Death Cross "
            f"for {symbol}."
        )

    else:
        title = f"{symbol} alert triggered"
        message = (
            f"One of your A-Trader alerts "
            f"for {symbol} was triggered."
        )

    return title, message


# =========================================================
# CREATE ALERT NOTIFICATION
# =========================================================

def create_alert_notification(
    *,
    session: Session,
    alert: Alert,
    trigger_value: float | None = None,
) -> Notification:
    if alert.id is None:
        raise ValueError(
            "Cannot create a notification "
            "for an alert without an ID.",
        )

    title, message = build_alert_notification_message(
        alert=alert,
        trigger_value=trigger_value,
    )

    notification = Notification(
        user_id=alert.user_id,
        alert_id=alert.id,
        notification_type=(
            NotificationType.ALERT_TRIGGERED
        ),
        symbol=alert.symbol,
        title=title,
        message=message,
        trigger_value=trigger_value,
        target_url=(
            f"/market?symbol={alert.symbol}"
        ),
    )

    # The in-app notification is the source of truth.
    # Save it before attempting Web Push.
    session.add(notification)
    session.commit()
    session.refresh(notification)

    # Web Push is an additional delivery channel.
    # send_push_to_user handles push failures internally,
    # so a failed device notification cannot erase the
    # already-created in-app notification.
    send_push_to_user(
        session=session,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        url=notification.target_url,
        tag=(
            f"a-trader-notification-"
            f"{notification.id}"
        ),
    )

    return notification
