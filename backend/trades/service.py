from fastapi import (
    HTTPException,
    status,
)

from .models import Trade


# =========================================================
# TRADE CALCULATIONS
# =========================================================

def calculate_trade_pnl(
    trade: Trade,
) -> float:
    direction = (
        trade.direction
        .strip()
        .lower()
    )

    if direction == "short":
        difference = (
            trade.entry_price
            - trade.exit_price
        )
    else:
        difference = (
            trade.exit_price
            - trade.entry_price
        )

    return (
        difference
        * trade.position_size
    )


def calculate_trade_risk_dollars(
    trade: Trade,
) -> float | None:
    if trade.stop_loss is None:
        return None

    risk_per_unit = abs(
        trade.entry_price
        - trade.stop_loss
    )

    if risk_per_unit <= 0:
        return None

    return (
        risk_per_unit
        * trade.position_size
    )


def calculate_trade_r_multiple(
    trade: Trade,
) -> float | None:
    risk_dollars = (
        calculate_trade_risk_dollars(
            trade,
        )
    )

    if (
        risk_dollars is None
        or risk_dollars <= 0
    ):
        return None

    pnl = (
        calculate_trade_pnl(
            trade,
        )
    )

    return (
        pnl
        / risk_dollars
    )


def calculate_planned_reward_risk(
    trade: Trade,
) -> float | None:
    if (
        trade.stop_loss is None
        or trade.target_price is None
    ):
        return None

    risk_per_unit = abs(
        trade.entry_price
        - trade.stop_loss
    )

    reward_per_unit = abs(
        trade.target_price
        - trade.entry_price
    )

    if risk_per_unit <= 0:
        return None

    return (
        reward_per_unit
        / risk_per_unit
    )


def get_trade_strategy_name(
    trade: Trade,
) -> str:
    if (
        trade.strategy == "Custom"
        and trade.custom_strategy.strip()
    ):
        return (
            trade.custom_strategy
            .strip()
        )

    return (
        trade.strategy
        .strip()
        or "Unspecified"
    )


# =========================================================
# TRADE VALIDATION
# =========================================================

def validate_trade_values(
    direction: str,
    entry_price: float,
    stop_loss: float | None,
    target_price: float | None,
):
    normalized_direction = (
        direction
        .strip()
        .lower()
    )

    if (
        normalized_direction
        not in {
            "long",
            "short",
        }
    ):
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Direction must be Long or Short."
            ),
        )

    if normalized_direction == "long":
        if (
            stop_loss is not None
            and stop_loss >= entry_price
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "For a Long trade, the stop loss "
                    "must be below the entry price."
                ),
            )

        if (
            target_price is not None
            and target_price <= entry_price
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "For a Long trade, the target price "
                    "must be above the entry price."
                ),
            )

    if normalized_direction == "short":
        if (
            stop_loss is not None
            and stop_loss <= entry_price
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "For a Short trade, the stop loss "
                    "must be above the entry price."
                ),
            )

        if (
            target_price is not None
            and target_price >= entry_price
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "For a Short trade, the target price "
                    "must be below the entry price."
                ),
            )


# =========================================================
# TRADE NORMALIZATION
# =========================================================

def normalize_trade_create_values(
    values: dict,
) -> dict:
    values["symbol"] = (
        values["symbol"]
        .strip()
        .upper()
    )

    values["direction"] = (
        values["direction"]
        .strip()
        .capitalize()
    )

    string_fields = [
        "strategy",
        "custom_strategy",
        "psychology_notes",
        "lesson_learned",
    ]

    for field in string_fields:
        values[field] = (
            values[field]
            .strip()
        )

    return values


def normalize_trade_update_values(
    values: dict,
) -> dict:
    if (
        "symbol" in values
        and values["symbol"] is not None
    ):
        values["symbol"] = (
            values["symbol"]
            .strip()
            .upper()
        )

    if (
        "direction" in values
        and values["direction"] is not None
    ):
        values["direction"] = (
            values["direction"]
            .strip()
            .capitalize()
        )

    string_fields = [
        "strategy",
        "custom_strategy",
        "psychology_notes",
        "lesson_learned",
    ]

    for field in string_fields:
        if (
            field in values
            and values[field] is not None
        ):
            values[field] = (
                values[field]
                .strip()
            )

    return values