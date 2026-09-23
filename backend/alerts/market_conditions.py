from dataclasses import dataclass

from .models import (
    Alert,
    AlertType,
)


# =========================================================
# RESULT
# =========================================================

@dataclass
class ConditionResult:
    triggered: bool

    observed_value: float | None = None

    reason: str | None = None


# =========================================================
# CROSSING HELPERS
# =========================================================

def crossed_above(
    *,
    previous: float | None,
    current: float,
    threshold: float,
) -> bool:
    if previous is None:
        return False

    return (
        previous <= threshold
        and current > threshold
    )


def crossed_below(
    *,
    previous: float | None,
    current: float,
    threshold: float,
) -> bool:
    if previous is None:
        return False

    return (
        previous >= threshold
        and current < threshold
    )


# =========================================================
# PRICE ALERT RE-ARMING
# =========================================================

PRICE_REARM_PERCENT = 0.001
PRICE_REARM_MINIMUM = 0.01


def get_price_rearm_buffer(
    threshold: float,
) -> float:
    return max(
        abs(threshold) * PRICE_REARM_PERCENT,
        PRICE_REARM_MINIMUM,
    )


def should_rearm_price_alert(
    *,
    alert: Alert,
    current_price: float,
) -> bool:
    if alert.threshold is None:
        return False

    buffer = get_price_rearm_buffer(
        alert.threshold,
    )

    if alert.alert_type == AlertType.PRICE_ABOVE:
        return (
            current_price
            <= alert.threshold - buffer
        )

    if alert.alert_type == AlertType.PRICE_BELOW:
        return (
            current_price
            >= alert.threshold + buffer
        )

    return False


# =========================================================
# PRICE CONDITIONS
# =========================================================

def evaluate_price_alert(
    *,
    alert: Alert,
    current_price: float,
) -> ConditionResult:
    if alert.threshold is None:
        return ConditionResult(
            triggered=False,
            observed_value=current_price,
            reason="Alert has no threshold.",
        )

    # A triggered recurring price alert stays disarmed
    # until price moves meaningfully back across the
    # opposite side of the configured threshold.
    if not alert.is_armed:
        if should_rearm_price_alert(
            alert=alert,
            current_price=current_price,
        ):
            alert.is_armed = True

            return ConditionResult(
                triggered=False,
                observed_value=current_price,
                reason="Price alert re-armed.",
            )

        return ConditionResult(
            triggered=False,
            observed_value=current_price,
            reason=(
                "Price alert is waiting for "
                "its re-arm level."
            ),
        )

    if alert.alert_type == AlertType.PRICE_ABOVE:
        triggered = crossed_above(
            previous=alert.last_observed_value,
            current=current_price,
            threshold=alert.threshold,
        )

        if triggered:
            alert.is_armed = False

        return ConditionResult(
            triggered=triggered,
            observed_value=current_price,
            reason=(
                "Price crossed above threshold."
                if triggered
                else "Price has not crossed above threshold."
            ),
        )

    if alert.alert_type == AlertType.PRICE_BELOW:
        triggered = crossed_below(
            previous=alert.last_observed_value,
            current=current_price,
            threshold=alert.threshold,
        )

        if triggered:
            alert.is_armed = False

        return ConditionResult(
            triggered=triggered,
            observed_value=current_price,
            reason=(
                "Price crossed below threshold."
                if triggered
                else "Price has not crossed below threshold."
            ),
        )

    return ConditionResult(
        triggered=False,
        observed_value=current_price,
        reason="Alert is not a price alert.",
    )


# =========================================================
# PERCENTAGE CONDITIONS
# =========================================================

def evaluate_percent_change_alert(
    *,
    alert: Alert,
    current_percent_change: float,
) -> ConditionResult:
    if alert.threshold is None:
        return ConditionResult(
            triggered=False,
            observed_value=current_percent_change,
            reason="Alert has no threshold.",
        )

    if (
        alert.alert_type
        == AlertType.PERCENT_CHANGE_ABOVE
    ):
        triggered = crossed_above(
            previous=alert.last_observed_value,
            current=current_percent_change,
            threshold=alert.threshold,
        )

        return ConditionResult(
            triggered=triggered,
            observed_value=current_percent_change,
            reason=(
                "Percent change crossed above threshold."
                if triggered
                else (
                    "Percent change has not crossed "
                    "above threshold."
                )
            ),
        )

    if (
        alert.alert_type
        == AlertType.PERCENT_CHANGE_BELOW
    ):
        triggered = crossed_below(
            previous=alert.last_observed_value,
            current=current_percent_change,
            threshold=alert.threshold,
        )

        return ConditionResult(
            triggered=triggered,
            observed_value=current_percent_change,
            reason=(
                "Percent change crossed below threshold."
                if triggered
                else (
                    "Percent change has not crossed "
                    "below threshold."
                )
            ),
        )

    return ConditionResult(
        triggered=False,
        observed_value=current_percent_change,
        reason="Alert is not a percent-change alert.",
    )


# =========================================================
# OPPORTUNITY SCORE
# =========================================================

def evaluate_opportunity_score_alert(
    *,
    alert: Alert,
    current_score: float,
) -> ConditionResult:
    if alert.threshold is None:
        return ConditionResult(
            triggered=False,
            observed_value=current_score,
            reason="Alert has no threshold.",
        )

    if (
        alert.alert_type
        != AlertType.OPPORTUNITY_SCORE_ABOVE
    ):
        return ConditionResult(
            triggered=False,
            observed_value=current_score,
            reason="Alert is not an Opportunity Score alert.",
        )

    triggered = crossed_above(
        previous=alert.last_observed_value,
        current=current_score,
        threshold=alert.threshold,
    )

    return ConditionResult(
        triggered=triggered,
        observed_value=current_score,
        reason=(
            "Opportunity Score crossed above threshold."
            if triggered
            else (
                "Opportunity Score has not crossed "
                "above threshold."
            )
        ),
    )

# =========================================================
# SETUP STATE
# =========================================================

def evaluate_potential_entry_alert(
    *,
    alert: Alert,
    current_state: str,
) -> ConditionResult:
    normalized_current = (
        current_state
        .strip()
        .lower()
    )

    previous_state = (
        alert.last_observed_state
        .strip()
        .lower()
        if alert.last_observed_state
        else None
    )

    # The first check establishes a baseline.
    # It must never create a notification.
    if previous_state is None:
        return ConditionResult(
            triggered=False,
            reason="Setup-state baseline established.",
        )

    triggered = (
        previous_state
        != "potential entry"
        and normalized_current
        == "potential entry"
    )

    return ConditionResult(
        triggered=triggered,
        reason=(
            "Setup changed to Potential entry."
            if triggered
            else "Setup has not newly changed to Potential entry."
        ),
    )
