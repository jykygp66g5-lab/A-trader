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

from .dataset import (
    FUTURE_RETURN_COLUMN,
    SYMBOL_COLUMN,
    TARGET_COLUMN,
)

from .features import (
    FEATURE_COLUMNS,
)


# =========================================================
# CONFIGURATION
# =========================================================

DEFAULT_FORWARD_SESSIONS = 5

TRAIN_END = pd.Timestamp(
    "2023-12-31",
)

VALIDATION_START = pd.Timestamp(
    "2024-01-08",
)

VALIDATION_END = pd.Timestamp(
    "2024-12-31",
)

TEST_START = pd.Timestamp(
    "2025-01-08",
)


# =========================================================
# RESULT TYPES
# =========================================================

@dataclass
class DatasetSplits:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame


@dataclass
class ModelMetrics:
    name: str
    samples: int
    positive_rate: float
    accuracy: float
    precision: float
    recall: float
    roc_auc: float
    log_loss: float
    brier_score: float


# =========================================================
# CHRONOLOGICAL SPLIT
# =========================================================

def create_chronological_splits(
    frame: pd.DataFrame,
) -> DatasetSplits:
    """
    Split strictly by calendar time.

    Gaps between train/validation and validation/test
    act as a purge so a 5-session forward label near
    one boundary does not overlap the following period.
    """

    if frame.empty:
        raise ValueError(
            "Cannot split an empty dataset."
        )

    index = pd.to_datetime(
        frame.index,
    )

    train = frame.loc[
        index <= TRAIN_END
    ].copy()

    validation = frame.loc[
        (
            index >= VALIDATION_START
        )
        & (
            index <= VALIDATION_END
        )
    ].copy()

    test = frame.loc[
        index >= TEST_START
    ].copy()

    if train.empty:
        raise ValueError(
            "Training split is empty."
        )

    if validation.empty:
        raise ValueError(
            "Validation split is empty."
        )

    if test.empty:
        raise ValueError(
            "Test split is empty."
        )

    return DatasetSplits(
        train=train,
        validation=validation,
        test=test,
    )


# =========================================================
# MODELS
# =========================================================

def create_models() -> dict[
    str,
    object,
]:
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


# =========================================================
# METRICS
# =========================================================

def calculate_metrics(
    name: str,
    y_true: pd.Series,
    probabilities: np.ndarray,
) -> ModelMetrics:
    predictions = (
        probabilities
        >= 0.50
    ).astype(int)

    return ModelMetrics(
        name=name,

        samples=len(
            y_true,
        ),

        positive_rate=float(
            y_true.mean()
        ),

        accuracy=float(
            accuracy_score(
                y_true,
                predictions,
            )
        ),

        precision=float(
            precision_score(
                y_true,
                predictions,
                zero_division=0,
            )
        ),

        recall=float(
            recall_score(
                y_true,
                predictions,
                zero_division=0,
            )
        ),

        roc_auc=float(
            roc_auc_score(
                y_true,
                probabilities,
            )
        ),

        log_loss=float(
            log_loss(
                y_true,
                probabilities,
                labels=[
                    0,
                    1,
                ],
            )
        ),

        brier_score=float(
            brier_score_loss(
                y_true,
                probabilities,
            )
        ),
    )


def majority_baseline_metrics(
    frame: pd.DataFrame,
) -> ModelMetrics:
    y_true = frame[
        TARGET_COLUMN
    ]

    training_positive_rate = float(
        frame[
            TARGET_COLUMN
        ]
        .mean()
    )

    probabilities = np.full(
        len(frame),
        training_positive_rate,
        dtype=float,
    )

    return calculate_metrics(
        name="constant_probability_baseline",
        y_true=y_true,
        probabilities=probabilities,
    )


# =========================================================
# PROBABILITY BUCKET ANALYSIS
# =========================================================

def probability_bucket_table(
    frame: pd.DataFrame,
    probabilities: np.ndarray,
) -> pd.DataFrame:
    result = frame[
        [
            TARGET_COLUMN,
            FUTURE_RETURN_COLUMN,
        ]
    ].copy()

    result[
        "probability"
    ] = probabilities

    bins = [
        0.0,
        0.40,
        0.50,
        0.60,
        0.70,
        0.80,
        1.000001,
    ]

    labels = [
        "<40%",
        "40-50%",
        "50-60%",
        "60-70%",
        "70-80%",
        "80%+",
    ]

    result[
        "bucket"
    ] = pd.cut(
        result[
            "probability"
        ],
        bins=bins,
        labels=labels,
        include_lowest=True,
        right=False,
    )

    summary = (
        result
        .groupby(
            "bucket",
            observed=False,
        )
        .agg(
            samples=(
                TARGET_COLUMN,
                "size",
            ),

            actual_positive_rate=(
                TARGET_COLUMN,
                "mean",
            ),

            average_future_return=(
                FUTURE_RETURN_COLUMN,
                "mean",
            ),

            median_future_return=(
                FUTURE_RETURN_COLUMN,
                "median",
            ),

            average_probability=(
                "probability",
                "mean",
            ),
        )
    )

    summary[
        "actual_positive_rate"
    ] *= 100

    summary[
        "average_probability"
    ] *= 100

    return summary


# =========================================================
# TRAIN / EVALUATE
# =========================================================

def train_candidate_models(
    splits: DatasetSplits,
) -> tuple[
    dict[str, object],
    dict[str, ModelMetrics],
]:
    x_train = splits.train[
        FEATURE_COLUMNS
    ]

    y_train = splits.train[
        TARGET_COLUMN
    ]

    x_validation = splits.validation[
        FEATURE_COLUMNS
    ]

    y_validation = splits.validation[
        TARGET_COLUMN
    ]

    models = create_models()

    metrics: dict[
        str,
        ModelMetrics,
    ] = {}

    for name, model in models.items():
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

        metrics[
            name
        ] = calculate_metrics(
            name=name,
            y_true=y_validation,
            probabilities=probabilities,
        )

    return (
        models,
        metrics,
    )


def evaluate_model(
    name: str,
    model: object,
    frame: pd.DataFrame,
) -> tuple[
    ModelMetrics,
    pd.DataFrame,
]:
    x = frame[
        FEATURE_COLUMNS
    ]

    y = frame[
        TARGET_COLUMN
    ]

    probabilities = (
        model
        .predict_proba(
            x,
        )[
            :,
            1
        ]
    )

    metrics = calculate_metrics(
        name=name,
        y_true=y,
        probabilities=probabilities,
    )

    buckets = probability_bucket_table(
        frame=frame,
        probabilities=probabilities,
    )

    return (
        metrics,
        buckets,
    )


# =========================================================
# DISPLAY
# =========================================================

def metrics_to_dict(
    metrics: ModelMetrics,
) -> dict[
    str,
    float | int | str,
]:
    return {
        "model":
            metrics.name,

        "samples":
            metrics.samples,

        "positive_rate_percent":
            round(
                metrics.positive_rate
                * 100,
                2,
            ),

        "accuracy_percent":
            round(
                metrics.accuracy
                * 100,
                2,
            ),

        "precision_percent":
            round(
                metrics.precision
                * 100,
                2,
            ),

        "recall_percent":
            round(
                metrics.recall
                * 100,
                2,
            ),

        "roc_auc":
            round(
                metrics.roc_auc,
                4,
            ),

        "log_loss":
            round(
                metrics.log_loss,
                4,
            ),

        "brier_score":
            round(
                metrics.brier_score,
                4,
            ),
    }
