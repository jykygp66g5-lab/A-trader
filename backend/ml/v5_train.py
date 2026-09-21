from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .features import V2_FEATURE_COLUMNS
from .v3_train import purge_training_boundary
from .v4 import V4_THRESHOLDS
from .v4_train import create_v4_models
from .v5 import V5_RANK_FEATURE_COLUMNS


V5_FEATURE_COLUMNS = (
    V2_FEATURE_COLUMNS
    + V5_RANK_FEATURE_COLUMNS
)


@dataclass
class V5CrossSectionMetrics:
    feature_version: str
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

    top1_winner_rate: float
    bottom1_winner_rate: float

    top2_winner_rate: float
    bottom2_winner_rate: float

    top1_beats_bottom1_rate: float
    top2_beats_bottom2_rate: float


def evaluate_daily_cross_section(
    validation: pd.DataFrame,
    probabilities: np.ndarray,
    horizon: int,
) -> dict | None:
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

    threshold = (
        V4_THRESHOLDS[
            horizon
        ]
    )

    evaluation[
        "strong_winner"
    ] = (
        evaluation[
            return_column
        ]
        > threshold
    ).astype(float)

    rows = []

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

        spearman = (
            day[
                "probability"
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

        rows.append(
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
                            "strong_winner"
                        ].mean()
                    ),

                "bottom1_winner":
                    float(
                        bottom1[
                            "strong_winner"
                        ].mean()
                    ),

                "top2_winner":
                    float(
                        top2[
                            "strong_winner"
                        ].mean()
                    ),

                "bottom2_winner":
                    float(
                        bottom2[
                            "strong_winner"
                        ].mean()
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


def run_v5_walk_forward(
    frame: pd.DataFrame,
    horizon: int,
    validation_years: list[int],
    feature_columns: list[str] | None = None,
    feature_version: str = "V5",
) -> pd.DataFrame:
    if feature_columns is None:
        feature_columns = (
            V5_FEATURE_COLUMNS
        )

    target_column = (
        f"v4_target_{horizon}d"
    )

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    # -----------------------------------------------------
    # TRAINING DATA
    #
    # Training intentionally uses only strong V4 outcomes:
    #
    # winner = sufficiently positive excess return
    # loser  = sufficiently negative excess return
    #
    # The noisy middle remains excluded from training.
    # -----------------------------------------------------

    training_required = (
        feature_columns
        + [
            target_column,
            return_column,
            "symbol",
        ]
    )

    training_usable = (
        frame
        .dropna(
            subset=training_required,
        )
        .copy()
    )

    training_usable[
        target_column
    ] = (
        training_usable[
            target_column
        ]
        .astype(int)
    )

    # -----------------------------------------------------
    # VALIDATION DATA
    #
    # Validation MUST NOT require the V4 target.
    #
    # A live scanner does not know in advance whether a
    # stock will become a strong winner, strong loser, or
    # land in the ignored middle.
    #
    # Therefore every feature-complete stock with a known
    # future continuous return must be ranked.
    # -----------------------------------------------------

    validation_required = (
        feature_columns
        + [
            return_column,
            "symbol",
        ]
    )

    validation_usable = (
        frame
        .dropna(
            subset=validation_required,
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

        raw_train = training_usable[
            training_usable.index < start
        ].copy()

        validation = validation_usable[
            (
                validation_usable.index >= start
            )
            & (
                validation_usable.index <= end
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
        ]

        x_validation = validation[
            feature_columns
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

            metrics = (
                evaluate_daily_cross_section(
                    validation=validation,
                    probabilities=probabilities,
                    horizon=horizon,
                )
            )

            if metrics is None:
                continue

            results.append(
                V5CrossSectionMetrics(
                    feature_version=(
                        feature_version
                    ),

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
