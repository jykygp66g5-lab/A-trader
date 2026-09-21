from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)

from .v3_train import purge_training_boundary
from .v5_train import V5_FEATURE_COLUMNS


@dataclass
class V7Metrics:
    model: str
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


def create_v7_models():
    return {
        "random_forest": (
            RandomForestRegressor(
                n_estimators=500,
                max_depth=10,
                min_samples_leaf=20,
                max_features="sqrt",
                random_state=42,
                n_jobs=-1,
            )
        ),

        "hist_gradient_boosting": (
            HistGradientBoostingRegressor(
                learning_rate=0.05,
                max_iter=300,
                max_leaf_nodes=31,
                min_samples_leaf=30,
                l2_regularization=1.0,
                random_state=42,
            )
        ),
    }


def evaluate_v7_cross_section(
    validation: pd.DataFrame,
    predictions: np.ndarray,
    horizon: int,
) -> dict | None:
    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    evaluation = validation[
        [
            "symbol",
            return_column,
        ]
    ].copy()

    evaluation[
        "prediction"
    ] = np.asarray(
        predictions,
        dtype=float,
    )

    rows = []

    for date, day in evaluation.groupby(
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

        spearman = (
            day[
                "prediction"
            ]
            .corr(
                day[
                    return_column
                ],
                method="spearman",
            )
        )

        if pd.isna(spearman):
            continue

        ranked = day.sort_values(
            "prediction",
            ascending=False,
        )

        top1 = ranked.head(1)
        bottom1 = ranked.tail(1)

        top2 = ranked.head(2)
        bottom2 = ranked.tail(2)

        top5 = ranked.head(5)
        bottom5 = ranked.tail(5)

        top1_return = float(
            top1[
                return_column
            ].mean()
        )

        bottom1_return = float(
            bottom1[
                return_column
            ].mean()
        )

        top2_return = float(
            top2[
                return_column
            ].mean()
        )

        bottom2_return = float(
            bottom2[
                return_column
            ].mean()
        )

        top5_return = float(
            top5[
                return_column
            ].mean()
        )

        bottom5_return = float(
            bottom5[
                return_column
            ].mean()
        )

        rows.append(
            {
                "date": date,

                "spearman":
                    float(
                        spearman
                    ),

                "top1_return":
                    top1_return,

                "bottom1_return":
                    bottom1_return,

                "top1_spread":
                    top1_return
                    - bottom1_return,

                "top2_return":
                    top2_return,

                "bottom2_return":
                    bottom2_return,

                "top2_spread":
                    top2_return
                    - bottom2_return,

                "top5_return":
                    top5_return,

                "bottom5_return":
                    bottom5_return,

                "top5_spread":
                    top5_return
                    - bottom5_return,

                "top1_beats":
                    float(
                        top1_return
                        > bottom1_return
                    ),

                "top2_beats":
                    float(
                        top2_return
                        > bottom2_return
                    ),

                "top5_beats":
                    float(
                        top5_return
                        > bottom5_return
                    ),
            }
        )

    daily = pd.DataFrame(
        rows
    )

    if daily.empty:
        return None

    return {
        "dates":
            len(daily),

        "mean_daily_spearman":
            float(
                daily[
                    "spearman"
                ].mean()
            ),

        "median_daily_spearman":
            float(
                daily[
                    "spearman"
                ].median()
            ),

        "positive_spearman_rate":
            float(
                (
                    daily[
                        "spearman"
                    ] > 0
                ).mean()
            ),

        "top1_return":
            float(
                daily[
                    "top1_return"
                ].mean()
            ),

        "bottom1_return":
            float(
                daily[
                    "bottom1_return"
                ].mean()
            ),

        "top1_bottom1_spread":
            float(
                daily[
                    "top1_spread"
                ].mean()
            ),

        "top2_return":
            float(
                daily[
                    "top2_return"
                ].mean()
            ),

        "bottom2_return":
            float(
                daily[
                    "bottom2_return"
                ].mean()
            ),

        "top2_bottom2_spread":
            float(
                daily[
                    "top2_spread"
                ].mean()
            ),

        "top5_return":
            float(
                daily[
                    "top5_return"
                ].mean()
            ),

        "bottom5_return":
            float(
                daily[
                    "bottom5_return"
                ].mean()
            ),

        "top5_bottom5_spread":
            float(
                daily[
                    "top5_spread"
                ].mean()
            ),

        "top1_beats_bottom1_rate":
            float(
                daily[
                    "top1_beats"
                ].mean()
            ),

        "top2_beats_bottom2_rate":
            float(
                daily[
                    "top2_beats"
                ].mean()
            ),

        "top5_beats_bottom5_rate":
            float(
                daily[
                    "top5_beats"
                ].mean()
            ),
    }


def run_v7_walk_forward(
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

        y_train = train[
            target_column
        ].astype(float)

        x_validation = validation[
            feature_columns
        ]

        for model_name, model in (
            create_v7_models().items()
        ):
            model.fit(
                x_train,
                y_train,
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
                V7Metrics(
                    model=model_name,
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
