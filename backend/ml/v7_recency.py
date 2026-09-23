from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .v3_train import purge_training_boundary
from .v5_train import V5_FEATURE_COLUMNS
from .v7_train import (
    create_v7_models,
    evaluate_v7_cross_section,
)


@dataclass
class RecencyResult:
    window: str
    training_years: int | None
    validation_year: int

    train_samples: int
    validation_samples: int

    mean_daily_spearman: float
    positive_spearman_rate: float

    top1_bottom1_spread: float
    top2_bottom2_spread: float
    top5_bottom5_spread: float

    top1_beats_bottom1_rate: float
    top2_beats_bottom2_rate: float
    top5_beats_bottom5_rate: float


def run_v7_recency_study(
    frame: pd.DataFrame,
    horizon: int = 5,
    validation_years: list[int] | None = None,
    windows: list[int | None] | None = None,
) -> pd.DataFrame:

    if validation_years is None:
        validation_years = [
            2022,
            2023,
            2024,
            2025,
            2026,
        ]

    if windows is None:
        windows = [
            None,
            5,
            3,
            2,
            1,
        ]

    target_column = (
        f"cross_section_rank_{horizon}d"
    )

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    required = (
        V5_FEATURE_COLUMNS
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

        validation_start = pd.Timestamp(
            year=year,
            month=1,
            day=1,
        )

        validation_end = pd.Timestamp(
            year=year,
            month=12,
            day=31,
        )

        validation = usable[
            (
                usable.index
                >= validation_start
            )
            & (
                usable.index
                <= validation_end
            )
        ].copy()

        if validation.empty:
            continue

        for training_years in windows:

            raw_train = usable[
                usable.index
                < validation_start
            ].copy()

            if training_years is not None:

                training_start = (
                    validation_start
                    - pd.DateOffset(
                        years=training_years
                    )
                )

                raw_train = raw_train[
                    raw_train.index
                    >= training_start
                ].copy()

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
                    V5_FEATURE_COLUMNS
                ],
                train[
                    target_column
                ].astype(float),
            )

            predictions = model.predict(
                validation[
                    V5_FEATURE_COLUMNS
                ]
            )

            metrics = evaluate_v7_cross_section(
                validation=validation,
                predictions=predictions,
                horizon=horizon,
            )

            if metrics is None:
                continue

            window_name = (
                "expanding"
                if training_years is None
                else f"{training_years}y"
            )

            results.append(
                RecencyResult(
                    window=window_name,
                    training_years=training_years,
                    validation_year=year,

                    train_samples=len(
                        train
                    ),

                    validation_samples=len(
                        validation
                    ),

                    mean_daily_spearman=metrics[
                        "mean_daily_spearman"
                    ],

                    positive_spearman_rate=metrics[
                        "positive_spearman_rate"
                    ],

                    top1_bottom1_spread=metrics[
                        "top1_bottom1_spread"
                    ],

                    top2_bottom2_spread=metrics[
                        "top2_bottom2_spread"
                    ],

                    top5_bottom5_spread=metrics[
                        "top5_bottom5_spread"
                    ],

                    top1_beats_bottom1_rate=metrics[
                        "top1_beats_bottom1_rate"
                    ],

                    top2_beats_bottom2_rate=metrics[
                        "top2_beats_bottom2_rate"
                    ],

                    top5_beats_bottom5_rate=metrics[
                        "top5_beats_bottom5_rate"
                    ],
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
