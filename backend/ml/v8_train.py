from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor

from .v3_train import purge_training_boundary
from .v5_train import V5_FEATURE_COLUMNS
from .v7_train import evaluate_v7_cross_section


@dataclass
class V8Metrics:
    weighting: str
    max_weight: float

    horizon: int
    validation_year: int

    train_samples: int
    validation_samples: int
    dates: int

    mean_daily_spearman: float
    median_daily_spearman: float
    positive_spearman_rate: float

    top1_return: float
    bottom1_return: float
    top1_bottom1_spread: float

    top2_return: float
    bottom2_return: float
    top2_bottom2_spread: float

    top5_return: float
    bottom5_return: float
    top5_bottom5_spread: float

    top1_beats_bottom1_rate: float
    top2_beats_bottom2_rate: float
    top5_beats_bottom5_rate: float


def calculate_extreme_weights(
    target: pd.Series,
    max_weight: float,
) -> np.ndarray:
    """
    Weight observations according to distance from
    the middle of the cross-sectional rank.

    rank ~= 0.50 -> weight ~= 1
    rank near 0/1 -> weight approaches max_weight

    Only the training target is used.
    """

    values = (
        target
        .astype(float)
        .to_numpy()
    )

    extremeness = (
        np.abs(
            values - 0.5
        )
        / 0.5
    )

    weights = (
        1.0
        + (
            max_weight - 1.0
        )
        * np.square(
            extremeness
        )
    )

    return weights


def create_v8_model():
    return RandomForestRegressor(
        n_estimators=500,
        max_depth=10,
        min_samples_leaf=20,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )


def run_v8_walk_forward(
    frame: pd.DataFrame,
    horizon: int = 5,
    validation_years: list[int] | None = None,
    feature_columns: list[str] | None = None,
) -> pd.DataFrame:
    if validation_years is None:
        validation_years = [
            2022,
            2023,
            2024,
            2025,
            2026,
        ]

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

    configurations = [
        (
            "baseline",
            1.0,
        ),
        (
            "moderate",
            3.0,
        ),
        (
            "strong",
            5.0,
        ),
    ]

    results = []

    for year in validation_years:
        start = pd.Timestamp(
            year=year,
            month=1,
            day=1,
        )

        end = pd.Timestamp(
            year=year,
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

        if train.empty or validation.empty:
            continue

        x_train = train[
            feature_columns
        ]

        y_train = (
            train[
                target_column
            ]
            .astype(float)
        )

        x_validation = validation[
            feature_columns
        ]

        for (
            weighting,
            max_weight,
        ) in configurations:
            model = create_v8_model()

            if weighting == "baseline":
                # IMPORTANT:
                # Reproduce V7 exactly.
                #
                # Passing an all-ones sample_weight array
                # is not numerically identical to omitting
                # sample_weight for RandomForestRegressor.
                model.fit(
                    x_train,
                    y_train,
                )

            else:
                sample_weight = (
                    calculate_extreme_weights(
                        target=y_train,
                        max_weight=max_weight,
                    )
                )

                model.fit(
                    x_train,
                    y_train,
                    sample_weight=sample_weight,
                )

            predictions = model.predict(
                x_validation
            )

            metrics = (
                evaluate_v7_cross_section(
                    validation=validation,
                    predictions=predictions,
                    horizon=horizon,
                )
            )

            if metrics is None:
                continue

            results.append(
                V8Metrics(
                    weighting=weighting,
                    max_weight=max_weight,

                    horizon=horizon,
                    validation_year=year,

                    train_samples=len(
                        train
                    ),

                    validation_samples=len(
                        validation
                    ),

                    **metrics,
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
