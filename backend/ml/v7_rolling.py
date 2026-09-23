from __future__ import annotations

import numpy as np
import pandas as pd

from .v3_train import purge_training_boundary
from .v5_train import V5_FEATURE_COLUMNS
from .v7_train import (
    create_v7_models,
    evaluate_v7_cross_section,
)


def build_monthly_rolling_predictions(
    frame: pd.DataFrame,
    validation_year: int,
    horizon: int = 5,
    feature_columns: list[str] | None = None,
) -> pd.DataFrame:

    if feature_columns is None:
        feature_columns = V5_FEATURE_COLUMNS

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

    pieces = []

    for month in range(
        1,
        13,
    ):

        month_start = pd.Timestamp(
            year=validation_year,
            month=month,
            day=1,
        )

        if month == 12:
            month_end = pd.Timestamp(
                year=validation_year + 1,
                month=1,
                day=1,
            )
        else:
            month_end = pd.Timestamp(
                year=validation_year,
                month=month + 1,
                day=1,
            )

        raw_train = usable[
            usable.index < month_start
        ].copy()

        validation = usable[
            (
                usable.index >= month_start
            )
            & (
                usable.index < month_end
            )
        ].copy()

        if (
            raw_train.empty
            or validation.empty
        ):
            continue

        train = purge_training_boundary(
            train=raw_train,
            horizon=horizon,
        )

        if train.empty:
            continue

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
            "retrain_month"
        ] = month

        result[
            "train_samples"
        ] = len(
            train
        )

        result[
            "last_training_date"
        ] = train.index.max()

        pieces.append(
            result
        )

    if not pieces:
        return pd.DataFrame()

    return (
        pd.concat(
            pieces,
            axis=0,
        )
        .sort_index(
            kind="stable"
        )
    )


def evaluate_monthly_rolling(
    predictions: pd.DataFrame,
    horizon: int = 5,
) -> tuple[
    dict,
    pd.DataFrame,
]:

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    all_predictions = []

    monthly_rows = []

    for month, month_frame in (
        predictions.groupby(
            "retrain_month",
            sort=True,
        )
    ):

        metrics = (
            evaluate_v7_cross_section(
                validation=month_frame,
                predictions=month_frame[
                    "prediction"
                ].to_numpy(),
                horizon=horizon,
            )
        )

        if metrics is None:
            continue

        monthly_rows.append(
            {
                "month": int(
                    month
                ),

                "train_samples": int(
                    month_frame[
                        "train_samples"
                    ].iloc[0]
                ),

                "last_training_date":
                    month_frame[
                        "last_training_date"
                    ].iloc[0],

                **metrics,
            }
        )

        all_predictions.append(
            month_frame
        )

    if not all_predictions:
        raise ValueError(
            "No rolling predictions available."
        )

    combined = pd.concat(
        all_predictions,
        axis=0,
    ).sort_index(
        kind="stable"
    )

    overall = evaluate_v7_cross_section(
        validation=combined,
        predictions=combined[
            "prediction"
        ].to_numpy(),
        horizon=horizon,
    )

    if overall is None:
        raise ValueError(
            "Could not evaluate rolling predictions."
        )

    return (
        overall,
        pd.DataFrame(
            monthly_rows
        ),
    )
