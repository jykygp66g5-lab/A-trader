from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .features import V2_FEATURE_COLUMNS
from .v3_train import purge_training_boundary
from .v4_train import create_v4_models


@dataclass
class CrossSectionMetrics:
    model: str
    horizon: int
    validation_year: int

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

    top1_winner_rate: float
    bottom1_winner_rate: float

    top2_winner_rate: float
    bottom2_winner_rate: float

    top1_beats_bottom1_rate: float
    top2_beats_bottom2_rate: float


def evaluate_cross_section(
    validation: pd.DataFrame,
    probabilities: np.ndarray,
    horizon: int,
):
    target_column = (
        f"v4_target_{horizon}d"
    )

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    evaluation = validation[
        [
            "symbol",
            target_column,
            return_column,
        ]
    ].copy()

    evaluation[
        "probability"
    ] = probabilities

    daily_rows = []

    for date, day in evaluation.groupby(
        level=0,
        sort=True,
    ):
        day = (
            day
            .sort_values(
                "probability",
                ascending=False,
            )
            .copy()
        )

        if len(day) < 4:
            continue

        actual_rank = day[
            return_column
        ]

        probability_rank = day[
            "probability"
        ]

        spearman = (
            actual_rank
            .corr(
                probability_rank,
                method="spearman",
            )
        )

        if pd.isna(spearman):
            spearman = 0.0

        top1 = day.head(1)
        bottom1 = day.tail(1)

        top2 = day.head(2)
        bottom2 = day.tail(2)

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

        daily_rows.append(
            {
                "date":
                    date,

                "spearman":
                    float(spearman),

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

                "top1_winner":
                    float(
                        top1[
                            target_column
                        ].mean()
                    ),

                "bottom1_winner":
                    float(
                        bottom1[
                            target_column
                        ].mean()
                    ),

                "top2_winner":
                    float(
                        top2[
                            target_column
                        ].mean()
                    ),

                "bottom2_winner":
                    float(
                        bottom2[
                            target_column
                        ].mean()
                    ),
            }
        )

    daily = pd.DataFrame(
        daily_rows
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
                    ]
                    > 0
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

        "top1_winner_rate":
            float(
                daily[
                    "top1_winner"
                ].mean()
            ),

        "bottom1_winner_rate":
            float(
                daily[
                    "bottom1_winner"
                ].mean()
            ),

        "top2_winner_rate":
            float(
                daily[
                    "top2_winner"
                ].mean()
            ),

        "bottom2_winner_rate":
            float(
                daily[
                    "bottom2_winner"
                ].mean()
            ),

        "top1_beats_bottom1_rate":
            float(
                (
                    daily[
                        "top1_spread"
                    ]
                    > 0
                ).mean()
            ),

        "top2_beats_bottom2_rate":
            float(
                (
                    daily[
                        "top2_spread"
                    ]
                    > 0
                ).mean()
            ),
    }


def run_cross_section_walk_forward(
    frame: pd.DataFrame,
    horizon: int,
    validation_years: list[int],
) -> pd.DataFrame:
    target_column = (
        f"v4_target_{horizon}d"
    )

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    required = (
        V2_FEATURE_COLUMNS
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

    usable[
        target_column
    ] = (
        usable[
            target_column
        ]
        .astype(int)
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
            V2_FEATURE_COLUMNS
        ]

        y_train = train[
            target_column
        ]

        x_validation = validation[
            V2_FEATURE_COLUMNS
        ]

        for model_name, model in (
            create_v4_models().items()
        ):
            model.fit(
                x_train,
                y_train,
            )

            probabilities = (
                model
                .predict_proba(
                    x_validation
                )[:, 1]
            )

            metrics = evaluate_cross_section(
                validation=validation,
                probabilities=probabilities,
                horizon=horizon,
            )

            if metrics is None:
                continue

            results.append(
                CrossSectionMetrics(
                    model=model_name,
                    horizon=horizon,
                    validation_year=year,
                    **metrics,
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
