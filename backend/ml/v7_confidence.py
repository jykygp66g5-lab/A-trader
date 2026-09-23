from __future__ import annotations

import numpy as np
import pandas as pd


def build_daily_confidence_frame(
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

        prediction_values = (
            day[
                "prediction"
            ]
            .to_numpy(
                dtype=float
            )
        )

        top1 = day.iloc[
            0
        ]

        top2 = day.head(
            2
        )

        top5 = day.head(
            5
        )

        bottom1 = day.iloc[
            -1
        ]

        bottom2 = day.tail(
            2
        )

        bottom5 = day.tail(
            5
        )

        median_prediction = float(
            np.median(
                prediction_values
            )
        )

        top5_prediction = float(
            top5[
                "prediction"
            ].mean()
        )

        rest_prediction = float(
            day.iloc[
                5:
            ][
                "prediction"
            ].mean()
        )

        rows.append(
            {
                "date": date,

                "stocks": len(
                    day
                ),

                "top_symbol": top1[
                    "symbol"
                ],

                "top_prediction": float(
                    top1[
                        "prediction"
                    ]
                ),

                "top1_top2_gap": float(
                    prediction_values[
                        0
                    ]
                    - prediction_values[
                        1
                    ]
                ),

                "top1_median_gap": float(
                    prediction_values[
                        0
                    ]
                    - median_prediction
                ),

                "top5_rest_gap": float(
                    top5_prediction
                    - rest_prediction
                ),

                "prediction_std": float(
                    np.std(
                        prediction_values
                    )
                ),

                "prediction_range": float(
                    prediction_values[
                        0
                    ]
                    - prediction_values[
                        -1
                    ]
                ),

                "top1_return": float(
                    top1[
                        return_column
                    ]
                ),

                "bottom1_return": float(
                    bottom1[
                        return_column
                    ]
                ),

                "top1_spread": float(
                    top1[
                        return_column
                    ]
                    - bottom1[
                        return_column
                    ]
                ),

                "top2_spread": float(
                    top2[
                        return_column
                    ].mean()
                    - bottom2[
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


def summarize_confidence_buckets(
    daily: pd.DataFrame,
    confidence_column: str,
    buckets: int = 5,
) -> pd.DataFrame:

    data = daily.copy()

    data[
        "confidence_bucket"
    ] = pd.qcut(
        data[
            confidence_column
        ],
        q=buckets,
        labels=False,
        duplicates="drop",
    )

    data[
        "confidence_bucket"
    ] = (
        data[
            "confidence_bucket"
        ]
        + 1
    )

    summary = (
        data.groupby(
            "confidence_bucket"
        )
        .agg(
            days=(
                confidence_column,
                "size",
            ),

            confidence_mean=(
                confidence_column,
                "mean",
            ),

            top1_return=(
                "top1_return",
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
                lambda values:
                    float(
                        (
                            values > 0
                        ).mean()
                    ),
            ),

            top5_beat_rate=(
                "top5_spread",
                lambda values:
                    float(
                        (
                            values > 0
                        ).mean()
                    ),
            ),
        )
    )

    return summary
