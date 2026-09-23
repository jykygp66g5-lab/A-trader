from collections import defaultdict
from dataclasses import dataclass, field

from sqlmodel import Session

from market.service import (
    get_market_snapshot,
)

from scanner import (
    analyze_scan_symbol,
)

from .market_conditions import (
    ConditionResult,
    evaluate_percent_change_alert,
    evaluate_potential_entry_alert,
    evaluate_price_alert,
)

from .models import (
    Alert,
    AlertType,
)

from .notifications import (
    create_alert_notification,
)

from .service import (
    can_alert_trigger,
    get_active_alerts,
    record_alert_check,
    record_alert_trigger,
)


# =========================================================
# ENGINE RESULT
# =========================================================

@dataclass
class AlertEngineResult:
    alerts_checked: int = 0
    alerts_triggered: int = 0

    symbols_checked: int = 0
    symbols_failed: int = 0

    notifications_created: int = 0

    errors: list[str] = field(
        default_factory=list,
    )


# =========================================================
# ALERT GROUPS
# =========================================================

LIGHTWEIGHT_ALERT_TYPES = {
    AlertType.PRICE_ABOVE,
    AlertType.PRICE_BELOW,
    AlertType.PERCENT_CHANGE_ABOVE,
    AlertType.PERCENT_CHANGE_BELOW,
}


SETUP_ALERT_TYPES = {
    AlertType.POTENTIAL_ENTRY,
}


def group_alerts_by_symbol(
    alerts: list[Alert],
    *,
    supported_types: set[AlertType],
) -> dict[str, list[Alert]]:
    grouped: dict[
        str,
        list[Alert],
    ] = defaultdict(
        list,
    )

    for alert in alerts:
        if (
            alert.alert_type
            not in supported_types
        ):
            continue

        grouped[
            alert.symbol.upper()
        ].append(
            alert,
        )

    return dict(
        grouped,
    )


# =========================================================
# LIGHTWEIGHT CONDITION EVALUATION
# =========================================================

def evaluate_lightweight_alert(
    *,
    alert: Alert,
    snapshot: dict[str, float | int],
) -> ConditionResult | None:
    if alert.alert_type in {
        AlertType.PRICE_ABOVE,
        AlertType.PRICE_BELOW,
    }:
        return evaluate_price_alert(
            alert=alert,
            current_price=float(
                snapshot["price"],
            ),
        )

    if alert.alert_type in {
        AlertType.PERCENT_CHANGE_ABOVE,
        AlertType.PERCENT_CHANGE_BELOW,
    }:
        return evaluate_percent_change_alert(
            alert=alert,
            current_percent_change=float(
                snapshot[
                    "percent_change"
                ],
            ),
        )

    return None


# =========================================================
# PROCESS LIGHTWEIGHT ALERT
# =========================================================

def process_lightweight_alert(
    *,
    session: Session,
    alert: Alert,
    snapshot: dict[str, float | int],
) -> bool:
    result = evaluate_lightweight_alert(
        alert=alert,
        snapshot=snapshot,
    )

    if result is None:
        return False

    if result.triggered:
        if can_alert_trigger(
            alert=alert,
        ):
            create_alert_notification(
                session=session,
                alert=alert,
                trigger_value=(
                    result.observed_value
                ),
            )

            record_alert_trigger(
                session=session,
                alert=alert,
                observed_value=(
                    result.observed_value
                ),
            )

            return True

        # The market condition crossed, but this alert's
        # frequency does not permit another notification.
        # Still persist the observation so crossing and
        # re-arm state remain accurate.
        record_alert_check(
            session=session,
            alert=alert,
            observed_value=(
                result.observed_value
            ),
        )

        return False

    record_alert_check(
        session=session,
        alert=alert,
        observed_value=(
            result.observed_value
        ),
    )

    return False


# =========================================================
# PROCESS SETUP ALERT
# =========================================================

def process_setup_alert(
    *,
    session: Session,
    alert: Alert,
    current_state: str,
) -> bool:
    result = evaluate_potential_entry_alert(
        alert=alert,
        current_state=current_state,
    )

    if result.triggered:
        if can_alert_trigger(
            alert=alert,
        ):
            create_alert_notification(
                session=session,
                alert=alert,
                trigger_value=None,
            )

            record_alert_trigger(
                session=session,
                alert=alert,
                observed_state=current_state,
            )

            return True

        # Frequency blocked the notification, but the
        # current setup state must still be persisted.
        record_alert_check(
            session=session,
            alert=alert,
            observed_state=current_state,
        )

        return False

    record_alert_check(
        session=session,
        alert=alert,
        observed_state=current_state,
    )

    return False


# =========================================================
# RUN ALERT ENGINE
# =========================================================

def run_alert_engine(
    *,
    session: Session,
) -> AlertEngineResult:
    engine_result = (
        AlertEngineResult()
    )

    active_alerts = (
        get_active_alerts(
            session=session,
        )
    )

    lightweight_alerts = (
        group_alerts_by_symbol(
            active_alerts,
            supported_types=(
                LIGHTWEIGHT_ALERT_TYPES
            ),
        )
    )

    setup_alerts = (
        group_alerts_by_symbol(
            active_alerts,
            supported_types=(
                SETUP_ALERT_TYPES
            ),
        )
    )

    checked_symbols: set[str] = set()

    # -----------------------------------------------------
    # LIGHTWEIGHT PRICE / MOVEMENT ALERTS
    # -----------------------------------------------------

    for (
        symbol,
        symbol_alerts,
    ) in lightweight_alerts.items():
        try:
            snapshot = (
                get_market_snapshot(
                    symbol,
                )
            )

            checked_symbols.add(
                symbol,
            )

        except Exception as exc:
            engine_result.symbols_failed += 1

            engine_result.errors.append(
                f"{symbol}: {exc}"
            )

            continue

        for alert in symbol_alerts:
            try:
                engine_result.alerts_checked += 1

                triggered = (
                    process_lightweight_alert(
                        session=session,
                        alert=alert,
                        snapshot=snapshot,
                    )
                )

                if triggered:
                    engine_result.alerts_triggered += 1
                    engine_result.notifications_created += 1

            except Exception as exc:
                engine_result.errors.append(
                    (
                        f"Alert {alert.id} "
                        f"({symbol}): {exc}"
                    )
                )

    # -----------------------------------------------------
    # SCANNER SETUP ALERTS
    # -----------------------------------------------------

    for (
        symbol,
        symbol_alerts,
    ) in setup_alerts.items():
        try:
            scanner_analysis = (
                analyze_scan_symbol(
                    symbol,
                )
            )

            current_state = (
                scanner_analysis
                .action_state
            )

            checked_symbols.add(
                symbol,
            )

        except Exception as exc:
            engine_result.symbols_failed += 1

            engine_result.errors.append(
                f"{symbol} setup analysis: {exc}"
            )

            continue

        for alert in symbol_alerts:
            try:
                engine_result.alerts_checked += 1

                triggered = (
                    process_setup_alert(
                        session=session,
                        alert=alert,
                        current_state=current_state,
                    )
                )

                if triggered:
                    engine_result.alerts_triggered += 1
                    engine_result.notifications_created += 1

            except Exception as exc:
                engine_result.errors.append(
                    (
                        f"Alert {alert.id} "
                        f"({symbol} setup): {exc}"
                    )
                )

    engine_result.symbols_checked = len(
        checked_symbols,
    )

    return engine_result
