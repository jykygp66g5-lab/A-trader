from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    RandomForestClassifier,
)

from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)

from .features import V2_FEATURE_COLUMNS
from .v3_train import purge_training_boundary


@dataclass
class V4Metrics:
    model: str
    horizon: int
    validation_year: int

    train_samples: int
    validation_samples: int

    train_positive_rate: float
    validation_positive_rate: float

    accuracy: float
    precision: float
    recall: float
    roc_auc: float
    log_loss: float
    brier_score: float

    top_decile_positive_rate: float
    bottom_decile_positive_rate: float
    decile_spread: float

    top_decile_return: float
    bottom_decile_return: float
    return_spread: float


def create_v4_models():
    return {
        "random_forest":
            RandomForestClassifier(
                n_estimators=500,
                max_depth=10,
                min_samples_leaf=20,
                max_features="sqrt",
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            ),

        "hist_gradient_boosting":
            HistGradientBoostingClassifier(
                learning_rate=0.05,
                max_iter=300,
                max_leaf_nodes=31,
                min_samples_leaf=30,
                l2_regularization=1.0,
                random_state=42,
            ),
    }


def calculate_deciles(
    actual: pd.Series,
    probabilities: np.ndarray,
    relative_returns: pd.Series,
):
    evaluation = pd.DataFrame(
        {
            "actual": actual.to_numpy(),
            "probability": probabilities,
            "relative_return":
                relative_returns.to_numpy(),
        }
    )

    evaluation["percentile"] = (
        evaluation["probability"]
        .rank(
            pct=True,
            method="average",
        )
    )

    top = evaluation[
        evaluation["percentile"] >= 0.90
    ]

    bottom = evaluation[
        evaluation["percentile"] <= 0.10
    ]

    top_rate = float(
        top["actual"].mean()
    )

    bottom_rate = float(
        bottom["actual"].mean()
    )

    top_return = float(
        top["relative_return"].mean()
    )

    bottom_return = float(
        bottom["relative_return"].mean()
    )

    return (
        top_rate,
        bottom_rate,
        top_rate - bottom_rate,
        top_return,
        bottom_return,
        top_return - bottom_return,
    )


def run_v4_walk_forward(
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

    usable[target_column] = (
        usable[target_column]
        .astype(int)
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

        raw_train = usable[
            usable.index < validation_start
        ].copy()

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

        y_validation = validation[
            target_column
        ]

        validation_returns = validation[
            return_column
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

            predictions = (
                probabilities >= 0.50
            ).astype(int)

            (
                top_rate,
                bottom_rate,
                decile_spread,
                top_return,
                bottom_return,
                return_spread,
            ) = calculate_deciles(
                actual=y_validation,
                probabilities=probabilities,
                relative_returns=validation_returns,
            )

            results.append(
                V4Metrics(
                    model=model_name,
                    horizon=horizon,
                    validation_year=year,

                    train_samples=len(train),
                    validation_samples=len(
                        validation
                    ),

                    train_positive_rate=float(
                        y_train.mean()
                    ),

                    validation_positive_rate=float(
                        y_validation.mean()
                    ),

                    accuracy=float(
                        accuracy_score(
                            y_validation,
                            predictions,
                        )
                    ),

                    precision=float(
                        precision_score(
                            y_validation,
                            predictions,
                            zero_division=0,
                        )
                    ),

                    recall=float(
                        recall_score(
                            y_validation,
                            predictions,
                            zero_division=0,
                        )
                    ),

                    roc_auc=float(
                        roc_auc_score(
                            y_validation,
                            probabilities,
                        )
                    ),

                    log_loss=float(
                        log_loss(
                            y_validation,
                            probabilities,
                            labels=[0, 1],
                        )
                    ),

                    brier_score=float(
                        brier_score_loss(
                            y_validation,
                            probabilities,
                        )
                    ),

                    top_decile_positive_rate=(
                        top_rate
                    ),

                    bottom_decile_positive_rate=(
                        bottom_rate
                    ),

                    decile_spread=(
                        decile_spread
                    ),

                    top_decile_return=(
                        top_return
                    ),

                    bottom_decile_return=(
                        bottom_return
                    ),

                    return_spread=(
                        return_spread
                    ),
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
