from __future__ import annotations

import numpy as np
import pandas as pd

from scipy.stats import spearmanr

from .v3_train import purge_training_boundary
from .v5_train import V5_FEATURE_COLUMNS
from .v7_train import create_v7_models
from .v10 import V10_SYMBOL_TO_PEER_GROUP


def build_v7_prediction_frame(
    frame: pd.DataFrame,
    validation_year: int,
    horizon: int = 5,
    feature_columns: list[str] | None = None,
) -> pd.DataFrame:

    if feature_columns is None:
        feature_columns = (
            V5_FEATURE_COLUMNS
        )

    target_column = (
        f"cross_section_rank_{horizon}d"
    )

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    required = (
        feature_columns
        + [
            target_column,
            return_column,
            "symbol",
        ]
    )

    usable = (
        frame
        .dropna(
            subset=required,
        )
        .copy()
    )

    start = pd.Timestamp(
        year=validation_year,
        month=1,
        day=1,
    )

    end = pd.Timestamp(
        year=validation_year,
        month=12,
        day=31,
    )

    raw_train = usable[
        usable.index < start
    ].copy()

    validation = usable[
        (
            usable.index >= start
        )
        & (
            usable.index <= end
        )
    ].copy()

    train = purge_training_boundary(
        train=raw_train,
        horizon=horizon,
    )

    model = create_v7_models()[
        "random_forest"
    ]

    model.fit(
        train[
            feature_columns
        ],
        train[
            target_column
        ].astype(float),
    )

    result = validation[
        [
            "symbol",
            target_column,
            return_column,
        ]
    ].copy()

    result[
        "prediction"
    ] = model.predict(
        validation[
            feature_columns
        ]
    )

    result[
        "peer_group"
    ] = (
        result[
            "symbol"
        ]
        .map(
            V10_SYMBOL_TO_PEER_GROUP
        )
    )

    return result


def build_daily_diagnostic(
    predictions: pd.DataFrame,
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

        day = day.sort_values(
            "prediction",
            ascending=False,
        )

        day[
            "actual_rank"
        ] = (
            day[
                return_column
            ]
            .rank(
                method="average",
                pct=True,
            )
        )

        spearman = spearmanr(
            day[
                "prediction"
            ],
            day[
                return_column
            ],
        ).statistic

        top = day.iloc[
            0
        ]

        bottom = day.iloc[
            -1
        ]

        top5 = day.head(
            5
        )

        bottom5 = day.tail(
            5
        )

        rows.append(
            {
                "date": date,

                "stocks": len(
                    day
                ),

                "spearman": float(
                    spearman
                ),

                "top_symbol": top[
                    "symbol"
                ],

                "top_peer_group": top[
                    "peer_group"
                ],

                "top_prediction": float(
                    top[
                        "prediction"
                    ]
                ),

                "top_actual_rank": float(
                    top[
                        "actual_rank"
                    ]
                ),

                "top_return": float(
                    top[
                        return_column
                    ]
                ),

                "bottom_symbol": bottom[
                    "symbol"
                ],

                "bottom_return": float(
                    bottom[
                        return_column
                    ]
                ),

                "top1_spread": float(
                    top[
                        return_column
                    ]
                    - bottom[
                        return_column
                    ]
                ),

                "top5_return": float(
                    top5[
                        return_column
                    ].mean()
                ),

                "bottom5_return": float(
                    bottom5[
                        return_column
                    ].mean()
                ),

                "top5_spread": float(
                    top5[
                        return_column
                    ].mean()
                    - bottom5[
                        return_column
                    ].mean()
                ),
            }
        )

    return (
        pd.DataFrame(
            rows
        )
        .set_index(
            "date"
        )
        .sort_index()
    )


def summarize_months(
    daily: pd.DataFrame,
) -> pd.DataFrame:

    data = daily.copy()

    data[
        "month"
    ] = (
        data.index
        .to_period(
            "M"
        )
        .astype(str)
    )

    return (
        data.groupby(
            "month"
        )
        .agg(
            dates=(
                "spearman",
                "size",
            ),

            mean_spearman=(
                "spearman",
                "mean",
            ),

            positive_spearman_rate=(
                "spearman",
                lambda values:
                    float(
                        (
                            values > 0
                        ).mean()
                    ),
            ),

            top1_return=(
                "top_return",
                "mean",
            ),

            top1_spread=(
                "top1_spread",
                "mean",
            ),

            top5_spread=(
                "top5_spread",
                "mean",
            ),
        )
    )


def summarize_top_symbols(
    daily: pd.DataFrame,
) -> pd.DataFrame:

    return (
        daily.groupby(
            "top_symbol"
        )
        .agg(
            selections=(
                "top_symbol",
                "size",
            ),

            average_return=(
                "top_return",
                "mean",
            ),

            average_actual_rank=(
                "top_actual_rank",
                "mean",
            ),

            average_spread=(
                "top1_spread",
                "mean",
            ),
        )
        .sort_values(
            [
                "selections",
                "average_spread",
            ],
            ascending=[
                False,
                False,
            ],
        )
    )


def summarize_peer_groups(
    daily: pd.DataFrame,
) -> pd.DataFrame:

    return (
        daily.groupby(
            "top_peer_group"
        )
        .agg(
            selections=(
                "top_peer_group",
                "size",
            ),

            average_return=(
                "top_return",
                "mean",
            ),

            average_actual_rank=(
                "top_actual_rank",
                "mean",
            ),

            average_spread=(
                "top1_spread",
                "mean",
            ),
        )
        .sort_values(
            "average_spread",
            ascending=False,
        )
    )
