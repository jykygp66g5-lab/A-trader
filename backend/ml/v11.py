from __future__ import annotations

import numpy as np
import pandas as pd

from .v9 import V9_REGIME_FEATURE_COLUMNS


V11_INTERACTION_FEATURE_COLUMNS = [
    # Stock momentum x broad-market trend
    "interaction_rank_perf20_spy_trend50_200",
    "interaction_rank_perf60_spy_trend50_200",

    # Relative momentum x QQQ leadership
    "interaction_rank_rel_spy20_qqq_leadership20",
    "interaction_rank_rel_spy60_qqq_leadership60",

    # Stock momentum x QQQ-vs-SPY momentum regime
    "interaction_rank_perf20_qqq_spy_momentum",
    "interaction_rank_perf60_qqq_spy_momentum",

    # Volatility x market volatility regime
    "interaction_rank_vol20_spy_vol_ratio",
    "interaction_rank_atr_spy_vol_ratio",

    # Trend positioning x broad-market trend
    "interaction_rank_sma50_spy_trend50_200",
    "interaction_rank_sma200_spy_trend50_200",

    # Momentum oscillator x market acceleration
    "interaction_rank_rsi_spy_momentum_acceleration",
    "interaction_rank_macd_spy_momentum_acceleration",
]


def _standardize_regime(
    values: pd.Series,
    window: int = 252,
    minimum_periods: int = 60,
) -> pd.Series:
    """
    Convert a market-regime series into a trailing
    z-score using only information available on or
    before each date.

    This avoids using future observations when scaling
    regime values.
    """

    rolling_mean = (
        values
        .rolling(
            window=window,
            min_periods=minimum_periods,
        )
        .mean()
    )

    rolling_std = (
        values
        .rolling(
            window=window,
            min_periods=minimum_periods,
        )
        .std()
        .replace(
            0,
            np.nan,
        )
    )

    return (
        values
        - rolling_mean
    ) / rolling_std


def add_v11_interaction_features(
    frame: pd.DataFrame,
) -> pd.DataFrame:
    """
    Add explicit stock x market-regime interactions.

    V11 does NOT replace the V7 features.

    It adds a small controlled interaction layer so the
    model can learn that the meaning of a stock signal
    may change depending on the current market regime.

    Regime scaling uses trailing information only.
    No future market data is used.
    """

    result = frame.copy()

    required_stock_features = [
        "rank_performance_20d_percent",
        "rank_performance_60d_percent",

        "rank_relative_spy_20d_percent",
        "rank_relative_spy_60d_percent",

        "rank_volatility_20_percent",
        "rank_atr_14_percent",

        "rank_distance_sma_50_percent",
        "rank_distance_sma_200_percent",

        "rank_rsi_14",
        "rank_macd_histogram_percent",
    ]

    required_columns = (
        required_stock_features
        + V9_REGIME_FEATURE_COLUMNS
    )

    missing = [
        column
        for column in required_columns
        if column not in result.columns
    ]

    if missing:
        raise ValueError(
            "Missing V11 input columns: "
            + ", ".join(missing)
        )

    # ---------------------------------------------
    # Build one regime value per trading date.
    # ---------------------------------------------

    regime_daily = (
        result[
            V9_REGIME_FEATURE_COLUMNS
        ]
        .groupby(
            level=0,
            sort=True,
        )
        .first()
        .sort_index()
    )

    standardized = pd.DataFrame(
        index=regime_daily.index
    )

    for column in V9_REGIME_FEATURE_COLUMNS:
        standardized[
            column
        ] = _standardize_regime(
            regime_daily[
                column
            ]
        )

    # ---------------------------------------------
    # Map trailing regime z-scores back to each stock.
    # ---------------------------------------------

    regime_map = {}

    for column in V9_REGIME_FEATURE_COLUMNS:
        mapped_column = (
            f"_v11_{column}"
        )

        result[
            mapped_column
        ] = result.index.map(
            standardized[
                column
            ]
        )

        regime_map[
            column
        ] = mapped_column

    # ---------------------------------------------
    # Explicit stock x regime interactions.
    # ---------------------------------------------

    result[
        "interaction_rank_perf20_spy_trend50_200"
    ] = (
        result[
            "rank_performance_20d_percent"
        ]
        * result[
            regime_map[
                "spy_trend_strength_50_200"
            ]
        ]
    )

    result[
        "interaction_rank_perf60_spy_trend50_200"
    ] = (
        result[
            "rank_performance_60d_percent"
        ]
        * result[
            regime_map[
                "spy_trend_strength_50_200"
            ]
        ]
    )

    result[
        "interaction_rank_rel_spy20_qqq_leadership20"
    ] = (
        result[
            "rank_relative_spy_20d_percent"
        ]
        * result[
            regime_map[
                "qqq_spy_relative_20"
            ]
        ]
    )

    result[
        "interaction_rank_rel_spy60_qqq_leadership60"
    ] = (
        result[
            "rank_relative_spy_60d_percent"
        ]
        * result[
            regime_map[
                "qqq_spy_relative_60"
            ]
        ]
    )

    result[
        "interaction_rank_perf20_qqq_spy_momentum"
    ] = (
        result[
            "rank_performance_20d_percent"
        ]
        * result[
            regime_map[
                "qqq_spy_momentum_spread"
            ]
        ]
    )

    result[
        "interaction_rank_perf60_qqq_spy_momentum"
    ] = (
        result[
            "rank_performance_60d_percent"
        ]
        * result[
            regime_map[
                "qqq_spy_momentum_spread"
            ]
        ]
    )

    result[
        "interaction_rank_vol20_spy_vol_ratio"
    ] = (
        result[
            "rank_volatility_20_percent"
        ]
        * result[
            regime_map[
                "spy_volatility_ratio_20_60"
            ]
        ]
    )

    result[
        "interaction_rank_atr_spy_vol_ratio"
    ] = (
        result[
            "rank_atr_14_percent"
        ]
        * result[
            regime_map[
                "spy_volatility_ratio_20_60"
            ]
        ]
    )

    result[
        "interaction_rank_sma50_spy_trend50_200"
    ] = (
        result[
            "rank_distance_sma_50_percent"
        ]
        * result[
            regime_map[
                "spy_trend_strength_50_200"
            ]
        ]
    )

    result[
        "interaction_rank_sma200_spy_trend50_200"
    ] = (
        result[
            "rank_distance_sma_200_percent"
        ]
        * result[
            regime_map[
                "spy_trend_strength_50_200"
            ]
        ]
    )

    result[
        "interaction_rank_rsi_spy_momentum_acceleration"
    ] = (
        result[
            "rank_rsi_14"
        ]
        * result[
            regime_map[
                "spy_momentum_acceleration"
            ]
        ]
    )

    result[
        "interaction_rank_macd_spy_momentum_acceleration"
    ] = (
        result[
            "rank_macd_histogram_percent"
        ]
        * result[
            regime_map[
                "spy_momentum_acceleration"
            ]
        ]
    )

    # Internal mapped regime columns are not features.
    result = result.drop(
        columns=list(
            regime_map.values()
        )
    )

    return result


def validate_v11_features(
    frame: pd.DataFrame,
) -> dict:
    missing = [
        column
        for column in V11_INTERACTION_FEATURE_COLUMNS
        if column not in frame.columns
    ]

    if missing:
        return {
            "valid": False,
            "reason": "Missing V11 interaction features",
            "missing": missing,
        }

    interaction_frame = frame[
        V11_INTERACTION_FEATURE_COLUMNS
    ]

    complete = interaction_frame.dropna()

    if complete.empty:
        return {
            "valid": False,
            "reason": "No complete V11 rows",
        }

    values = complete.to_numpy(
        dtype=float
    )

    return {
        "valid": bool(
            np.isfinite(values).all()
        ),
        "interaction_features": len(
            V11_INTERACTION_FEATURE_COLUMNS
        ),
        "complete_rows": len(
            complete
        ),
        "missing_values_complete_rows": int(
            complete
            .isna()
            .sum()
            .sum()
        ),
        "minimum": float(
            np.min(values)
        ),
        "maximum": float(
            np.max(values)
        ),
    }
