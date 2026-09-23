from __future__ import annotations

import numpy as np
import pandas as pd

from scanner import calculate_trend_score


TECHNICAL_SCORE_COLUMN = "technical_trend_score"


def _safe_float(
    value,
) -> float | None:
    if pd.isna(value):
        return None

    value = float(value)

    if not np.isfinite(value):
        return None

    return value


def add_historical_technical_score(
    frame: pd.DataFrame,
) -> pd.DataFrame:
    """
    Reconstruct A-Trader's production daily trend score from the
    point-in-time daily features already present in the ML dataset.

    This deliberately does NOT reconstruct opportunity_score because
    historical intraday data is unavailable in the frozen snapshots.
    """

    result = frame.copy()

    required = [
        "distance_sma_20_percent",
        "distance_sma_50_percent",
        "distance_sma_200_percent",
        "rsi_14",
        "macd_percent",
        "macd_signal_percent",
        "performance_20d_percent",
        "performance_60d_percent",
    ]

    missing = [
        column
        for column in required
        if column not in result.columns
    ]

    if missing:
        raise ValueError(
            "Missing required technical features: "
            + ", ".join(missing)
        )

    scores: list[float] = []

    for _, row in result.iterrows():
        distance_20 = _safe_float(
            row["distance_sma_20_percent"]
        )

        distance_50 = _safe_float(
            row["distance_sma_50_percent"]
        )

        distance_200 = _safe_float(
            row["distance_sma_200_percent"]
        )

        rsi = _safe_float(
            row["rsi_14"]
        )

        macd_percent = _safe_float(
            row["macd_percent"]
        )

        macd_signal_percent = _safe_float(
            row["macd_signal_percent"]
        )

        performance_20d = _safe_float(
            row["performance_20d_percent"]
        )

        performance_60d = _safe_float(
            row["performance_60d_percent"]
        )

        values = [
            distance_20,
            distance_50,
            rsi,
            macd_percent,
            macd_signal_percent,
            performance_20d,
        ]

        if any(
            value is None
            for value in values
        ):
            scores.append(
                np.nan
            )
            continue

        # The production trend function only needs relative price/SMA
        # relationships. Setting price=100 lets us reconstruct those
        # relationships exactly from percentage distances.
        price = 100.0

        sma_20 = (
            price
            / (
                1.0
                + distance_20 / 100.0
            )
        )

        sma_50 = (
            price
            / (
                1.0
                + distance_50 / 100.0
            )
        )

        sma_200 = None

        if distance_200 is not None:
            denominator = (
                1.0
                + distance_200 / 100.0
            )

            if denominator > 0:
                sma_200 = (
                    price
                    / denominator
                )

        # macd_percent and macd_signal_percent are both normalized
        # against the same close price, so their ordering is preserved.
        macd = macd_percent
        macd_signal = macd_signal_percent

        score = calculate_trend_score(
            price=price,
            sma_20=sma_20,
            sma_50=sma_50,
            sma_200=sma_200,
            rsi=rsi,
            macd=macd,
            macd_signal=macd_signal,
            performance_20d=performance_20d,
            performance_60d=performance_60d,
        )

        scores.append(
            float(score)
        )

    result[
        TECHNICAL_SCORE_COLUMN
    ] = scores

    return result
