from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .dataset import (
    SYMBOL_COLUMN,
    TARGET_COLUMN,
)

from .train import (
    calculate_metrics,
    create_models,
)


@dataclass
class WalkForwardResult:
    feature_version: str
    model: str
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


def purge_training_boundary(
    train: pd.DataFrame,
    forward_sessions: int,
) -> pd.DataFrame:
    if forward_sessions <= 0:
        return train.copy()

    pieces: list[
        pd.DataFrame
    ] = []

    for _, symbol_frame in train.groupby(
        SYMBOL_COLUMN,
        sort=False,
    ):
        symbol_frame = (
            symbol_frame
            .sort_index()
        )

        if len(
            symbol_frame
        ) <= forward_sessions:
            continue

        pieces.append(
            symbol_frame.iloc[
                :-forward_sessions
            ]
        )

    if not pieces:
        return train.iloc[
            0:0
        ].copy()

    return (
        pd.concat(
            pieces,
            axis=0,
        )
        .sort_index(
            kind="stable",
        )
        .copy()
    )


def run_walk_forward(
    frame: pd.DataFrame,
    feature_columns: list[str],
    validation_years: list[int],
    feature_version: str,
    forward_sessions: int = 5,
    target_column: str = TARGET_COLUMN,
) -> pd.DataFrame:
    results: list[
        WalkForwardResult
    ] = []

    if target_column not in frame.columns:
        raise ValueError(
            f"Target column not found: {target_column}"
        )

    index = pd.to_datetime(
        frame.index,
    )

    for validation_year in validation_years:
        validation_start = pd.Timestamp(
            year=validation_year,
            month=1,
            day=1,
        )

        validation_end = pd.Timestamp(
            year=validation_year,
            month=12,
            day=31,
        )

        raw_train = frame.loc[
            index < validation_start
        ].copy()

        validation = frame.loc[
            (
                index >= validation_start
            )
            & (
                index <= validation_end
            )
        ].copy()

        train = purge_training_boundary(
            train=raw_train,
            forward_sessions=forward_sessions,
        )

        if (
            train.empty
            or validation.empty
        ):
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

        y_validation = validation[
            target_column
        ]

        models = create_models()

        for model_name, model in models.items():
            model.fit(
                x_train,
                y_train,
            )

            probabilities = (
                model
                .predict_proba(
                    x_validation,
                )[
                    :,
                    1
                ]
            )

            metrics = calculate_metrics(
                name=model_name,
                y_true=y_validation,
                probabilities=probabilities,
            )

            results.append(
                WalkForwardResult(
                    feature_version=feature_version,
                    model=model_name,
                    validation_year=validation_year,
                    train_samples=len(
                        train,
                    ),
                    validation_samples=len(
                        validation,
                    ),
                    train_positive_rate=float(
                        y_train.mean()
                    ),
                    validation_positive_rate=float(
                        y_validation.mean()
                    ),
                    accuracy=metrics.accuracy,
                    precision=metrics.precision,
                    recall=metrics.recall,
                    roc_auc=metrics.roc_auc,
                    log_loss=metrics.log_loss,
                    brier_score=metrics.brier_score,
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
