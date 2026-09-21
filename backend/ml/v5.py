from __future__ import annotations

import pandas as pd


V5_BASE_RANK_FEATURES = [
    "performance_5d_percent",
    "performance_20d_percent",
    "performance_60d_percent",

    "relative_spy_5d_percent",
    "relative_spy_20d_percent",
    "relative_spy_60d_percent",

    "relative_qqq_5d_percent",
    "relative_qqq_20d_percent",
    "relative_qqq_60d_percent",

    "rsi_14",

    "distance_sma_20_percent",
    "distance_sma_50_percent",
    "distance_sma_200_percent",

    "macd_histogram_percent",

    "volume_ratio_20",

    "atr_14_percent",

    "volatility_20_percent",
    "volatility_60_percent",

    "distance_52w_high_percent",
    "distance_52w_low_percent",
    "range_52w_position",
]


V5_RANK_FEATURE_COLUMNS = [
    f"rank_{column}"
    for column in V5_BASE_RANK_FEATURES
]


def add_cross_sectional_features(
    frame: pd.DataFrame,
) -> pd.DataFrame:
    """
    Add same-day cross-sectional percentile ranks.

    Each feature is ranked only against other stocks
    available on the SAME trading date.

    0.0 = lowest value in the cross-section
    1.0 = highest value in the cross-section

    No future information is used.
    """

    result = frame.copy()

    missing = [
        column
        for column in V5_BASE_RANK_FEATURES
        if column not in result.columns
    ]

    if missing:
        raise ValueError(
            "Missing V5 base features: "
            + ", ".join(missing)
        )

    for column in V5_BASE_RANK_FEATURES:
        rank_column = (
            f"rank_{column}"
        )

        result[
            rank_column
        ] = (
            result
            .groupby(
                level=0,
                sort=False,
            )[
                column
            ]
            .rank(
                method="average",
                pct=True,
            )
        )

    return result


def validate_cross_sectional_features(
    frame: pd.DataFrame,
) -> dict:
    missing_columns = [
        column
        for column in V5_RANK_FEATURE_COLUMNS
        if column not in frame.columns
    ]

    if missing_columns:
        return {
            "valid": False,
            "reason":
                "Missing rank columns",
            "missing_columns":
                missing_columns,
        }

    rank_frame = frame[
        V5_RANK_FEATURE_COLUMNS
    ]

    complete_rank_frame = (
        rank_frame
        .dropna()
    )

    if complete_rank_frame.empty:
        return {
            "valid": False,
            "reason":
                "No complete V5 rank rows",
            "rank_features":
                len(
                    V5_RANK_FEATURE_COLUMNS
                ),
        }

    values_in_range = (
        complete_rank_frame
        .stack()
        .between(
            0.0,
            1.0,
            inclusive="both",
        )
        .all()
    )

    return {
        "valid":
            bool(values_in_range),

        "rank_features":
            len(
                V5_RANK_FEATURE_COLUMNS
            ),

        "complete_rows":
            len(
                complete_rank_frame
            ),

        "minimum":
            float(
                complete_rank_frame
                .min()
                .min()
            ),

        "maximum":
            float(
                complete_rank_frame
                .max()
                .max()
            ),

        "missing_values_complete_rows":
            int(
                complete_rank_frame
                .isna()
                .sum()
                .sum()
            ),

        "warmup_missing_values":
            int(
                rank_frame
                .isna()
                .sum()
                .sum()
            ),
    }
