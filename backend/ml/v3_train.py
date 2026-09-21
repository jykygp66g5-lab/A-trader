from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)

from .features import (
    V2_FEATURE_COLUMNS,
)


@dataclass
class RegressionMetrics:
    model: str
    horizon: int
    validation_year: int

    train_samples: int
    validation_samples: int

    mae: float
    rmse: float

    pearson_correlation: float
    spearman_correlation: float

    top_decile_return: float
    middle_return: float
    bottom_decile_return: float

    top_bottom_spread: float


def create_regression_models():
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


def purge_training_boundary(
    train: pd.DataFrame,
    horizon: int,
) -> pd.DataFrame:
    pieces = []

    for _, symbol_frame in train.groupby(
        "symbol",
        sort=False,
    ):
        symbol_frame = (
            symbol_frame
            .sort_index()
        )

        if len(
            symbol_frame
        ) <= horizon:
            continue

        pieces.append(
            symbol_frame.iloc[
                :-horizon
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


def safe_correlation(
    actual: pd.Series,
    predicted: np.ndarray,
    method: str,
) -> float:
    prediction_series = pd.Series(
        predicted,
        index=actual.index,
    )

    value = actual.corr(
        prediction_series,
        method=method,
    )

    if pd.isna(
        value
    ):
        return 0.0

    return float(
        value
    )


def calculate_rank_metrics(
    actual: pd.Series,
    predicted: np.ndarray,
) -> tuple[
    float,
    float,
    float,
    float,
]:
    evaluation = pd.DataFrame(
        {
            "actual": actual.to_numpy(),
            "predicted": predicted,
        }
    )

    evaluation[
        "percentile"
    ] = evaluation[
        "predicted"
    ].rank(
        pct=True,
        method="average",
    )

    top = evaluation.loc[
        evaluation[
            "percentile"
        ]
        >= 0.90,
        "actual",
    ]

    bottom = evaluation.loc[
        evaluation[
            "percentile"
        ]
        <= 0.10,
        "actual",
    ]

    middle = evaluation.loc[
        (
            evaluation[
                "percentile"
            ]
            >= 0.40
        )
        & (
            evaluation[
                "percentile"
            ]
            <= 0.60
        ),
        "actual",
    ]

    top_return = float(
        top.mean()
    )

    middle_return = float(
        middle.mean()
    )

    bottom_return = float(
        bottom.mean()
    )

    spread = (
        top_return
        - bottom_return
    )

    return (
        top_return,
        middle_return,
        bottom_return,
        spread,
    )


def run_v3_walk_forward(
    frame: pd.DataFrame,
    horizon: int,
    validation_years: list[int],
) -> pd.DataFrame:
    target_column = (
        f"relative_return_{horizon}d_percent"
    )

    required_columns = (
        V2_FEATURE_COLUMNS
        + [
            target_column,
            "symbol",
        ]
    )

    usable = (
        frame
        .dropna(
            subset=required_columns,
        )
        .copy()
    )

    index = pd.to_datetime(
        usable.index,
    )

    results: list[
        RegressionMetrics
    ] = []

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

        raw_train = usable.loc[
            index
            < validation_start
        ].copy()

        validation = usable.loc[
            (
                index
                >= validation_start
            )
            & (
                index
                <= validation_end
            )
        ].copy()

        train = purge_training_boundary(
            train=raw_train,
            horizon=horizon,
        )

        if (
            train.empty
            or validation.empty
        ):
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

        models = (
            create_regression_models()
        )

        for model_name, model in models.items():
            model.fit(
                x_train,
                y_train,
            )

            predictions = model.predict(
                x_validation
            )

            mae = mean_absolute_error(
                y_validation,
                predictions,
            )

            rmse = np.sqrt(
                mean_squared_error(
                    y_validation,
                    predictions,
                )
            )

            pearson = safe_correlation(
                actual=y_validation,
                predicted=predictions,
                method="pearson",
            )

            spearman = safe_correlation(
                actual=y_validation,
                predicted=predictions,
                method="spearman",
            )

            (
                top_return,
                middle_return,
                bottom_return,
                spread,
            ) = calculate_rank_metrics(
                actual=y_validation,
                predicted=predictions,
            )

            results.append(
                RegressionMetrics(
                    model=model_name,
                    horizon=horizon,
                    validation_year=validation_year,
                    train_samples=len(
                        train
                    ),
                    validation_samples=len(
                        validation
                    ),
                    mae=float(
                        mae
                    ),
                    rmse=float(
                        rmse
                    ),
                    pearson_correlation=pearson,
                    spearman_correlation=spearman,
                    top_decile_return=top_return,
                    middle_return=middle_return,
                    bottom_decile_return=bottom_return,
                    top_bottom_spread=spread,
                )
            )

    return pd.DataFrame(
        [
            result.__dict__
            for result in results
        ]
    )
