from __future__ import annotations

import numpy as np
import pandas as pd

from .v9 import V9_REGIME_FEATURE_COLUMNS


def build_daily_performance_frame(
    predictions: pd.DataFrame,
    regime_features: pd.DataFrame,
    horizon: int = 5,
) -> pd.DataFrame:
    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    rows = []

    for date, day in predictions.groupby(
        level=0,
        sort=True,
    ):
        day = day.dropna(
            subset=[
                "prediction",
                return_column,
            ]
        ).copy()

        if len(day) < 10:
            continue

        if date not in regime_features.index:
            continue

        day = day.sort_values(
            "prediction",
            ascending=False,
        )

        predicted_rank = (
            day["prediction"]
            .rank(
                method="average",
                pct=True,
            )
        )

        actual_rank = (
            day[return_column]
            .rank(
                method="average",
                pct=True,
            )
        )

        spearman = predicted_rank.corr(
            actual_rank,
            method="spearman",
        )

        top1 = day.head(1)
        top2 = day.head(2)
        top5 = day.head(5)

        bottom1 = day.tail(1)
        bottom2 = day.tail(2)
        bottom5 = day.tail(5)

        row = {
            "date": date,
            "stocks": len(day),

            "spearman": float(
                spearman
            ),

            "top1_spread": float(
                top1[return_column].mean()
                - bottom1[return_column].mean()
            ),

            "top2_spread": float(
                top2[return_column].mean()
                - bottom2[return_column].mean()
            ),

            "top5_spread": float(
                top5[return_column].mean()
                - bottom5[return_column].mean()
            ),
        }

        regime_row = regime_features.loc[
            date
        ]

        for column in V9_REGIME_FEATURE_COLUMNS:
            row[column] = float(
                regime_row[column]
            )

        rows.append(row)

    return (
        pd.DataFrame(rows)
        .set_index("date")
        .sort_index()
    )


def summarize_regime_buckets(
    daily: pd.DataFrame,
    regime_column: str,
    buckets: int = 5,
) -> pd.DataFrame:
    data = daily.dropna(
        subset=[
            regime_column,
            "spearman",
            "top1_spread",
            "top2_spread",
            "top5_spread",
        ]
    ).copy()

    data["regime_bucket"] = pd.qcut(
        data[regime_column],
        q=buckets,
        labels=False,
        duplicates="drop",
    )

    data["regime_bucket"] = (
        data["regime_bucket"]
        + 1
    )

    return (
        data.groupby("regime_bucket")
        .agg(
            days=(
                regime_column,
                "size",
            ),

            regime_mean=(
                regime_column,
                "mean",
            ),

            spearman=(
                "spearman",
                "mean",
            ),

            positive_spearman_rate=(
                "spearman",
                lambda values: float(
                    (values > 0).mean()
                ),
            ),

            top1_spread=(
                "top1_spread",
                "mean",
            ),

            top2_spread=(
                "top2_spread",
                "mean",
            ),

            top5_spread=(
                "top5_spread",
                "mean",
            ),

            top1_beat_rate=(
                "top1_spread",
                lambda values: float(
                    (values > 0).mean()
                ),
            ),

            top5_beat_rate=(
                "top5_spread",
                lambda values: float(
                    (values > 0).mean()
                ),
            ),
        )
    )


def add_simple_regime_labels(
    daily: pd.DataFrame,
) -> pd.DataFrame:
    result = daily.copy()

    result["trend_regime"] = np.where(
        result[
            "spy_trend_strength_20_200"
        ] >= 0,
        "SPY trend positive",
        "SPY trend negative",
    )

    result["tech_leadership"] = np.where(
        result[
            "qqq_spy_relative_20"
        ] >= 0,
        "QQQ leading",
        "QQQ lagging",
    )

    result["volatility_regime"] = np.where(
        result[
            "spy_volatility_ratio_20_60"
        ] >= 1,
        "Volatility rising",
        "Volatility falling",
    )

    result["momentum_regime"] = np.where(
        result[
            "spy_momentum_acceleration"
        ] >= 0,
        "Momentum accelerating",
        "Momentum decelerating",
    )

    return result


def summarize_simple_regimes(
    daily: pd.DataFrame,
) -> pd.DataFrame:
    labelled = add_simple_regime_labels(
        daily
    )

    group_columns = [
        "trend_regime",
        "tech_leadership",
        "volatility_regime",
        "momentum_regime",
    ]

    return (
        labelled.groupby(
            group_columns,
            dropna=False,
        )
        .agg(
            days=(
                "spearman",
                "size",
            ),

            spearman=(
                "spearman",
                "mean",
            ),

            top1_spread=(
                "top1_spread",
                "mean",
            ),

            top2_spread=(
                "top2_spread",
                "mean",
            ),

            top5_spread=(
                "top5_spread",
                "mean",
            ),

            top1_beat_rate=(
                "top1_spread",
                lambda values: float(
                    (values > 0).mean()
                ),
            ),

            top5_beat_rate=(
                "top5_spread",
                lambda values: float(
                    (values > 0).mean()
                ),
            ),
        )
        .reset_index()
        .sort_values(
            [
                "spearman",
                "top5_spread",
            ],
            ascending=False,
        )
    )
