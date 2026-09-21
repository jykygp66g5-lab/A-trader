from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from .v3 import build_v3_dataset
from .v5 import add_cross_sectional_features
from .v5_train import V5_FEATURE_COLUMNS
from .v7 import (
    V7_HORIZON,
    V7_RETURN_COLUMN,
    V7_TARGET_COLUMN,
    add_cross_sectional_rank_target,
)
from .v7_train import create_v7_models
from .v10 import V10_SYMBOL_TO_PEER_GROUP


MODEL_DIRECTORY = (
    Path(__file__).resolve().parent
    / "models"
)

MODEL_PATH = (
    MODEL_DIRECTORY
    / "v7_random_forest.joblib"
)

METADATA_PATH = (
    MODEL_DIRECTORY
    / "v7_random_forest_metadata.json"
)

PRODUCTION_MODEL_NAME = "v7_random_forest"

PRODUCTION_MODEL_VERSION = "7.0"

PRODUCTION_FEATURE_COLUMNS = tuple(
    V5_FEATURE_COLUMNS
)

PRODUCTION_SYMBOLS = tuple(
    V10_SYMBOL_TO_PEER_GROUP
)


def build_v7_training_frame() -> pd.DataFrame:
    """
    Reproduce the exact V7 feature/target pipeline used
    during research and walk-forward validation.
    """

    frame = build_v3_dataset(
        list(
            PRODUCTION_SYMBOLS
        )
    )

    frame = add_cross_sectional_features(
        frame
    )

    frame = add_cross_sectional_rank_target(
        frame,
        horizon=V7_HORIZON,
    )

    required = (
        list(
            PRODUCTION_FEATURE_COLUMNS
        )
        + [
            V7_TARGET_COLUMN,
            V7_RETURN_COLUMN,
            "symbol",
        ]
    )

    frame = (
        frame
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .dropna(
            subset=required,
        )
        .sort_index(
            kind="stable",
        )
        .copy()
    )

    if frame.empty:
        raise ValueError(
            "V7 production training frame is empty."
        )

    return frame


def train_v7_production_model() -> dict:
    """
    Train the frozen V7 Random Forest architecture on
    all currently available labelled snapshot data.

    This does NOT change model architecture or tune
    hyperparameters. It productionizes the V7 model
    already selected through walk-forward research.
    """

    frame = build_v7_training_frame()

    model = create_v7_models()[
        "random_forest"
    ]

    features = frame[
        list(
            PRODUCTION_FEATURE_COLUMNS
        )
    ]

    target = frame[
        V7_TARGET_COLUMN
    ].astype(
        float
    )

    print()
    print(
        "========== V7 PRODUCTION TRAINING =========="
    )

    print(
        "Rows:",
        len(
            frame
        ),
    )

    print(
        "Symbols:",
        frame[
            "symbol"
        ].nunique(),
    )

    print(
        "Features:",
        len(
            PRODUCTION_FEATURE_COLUMNS
        ),
    )

    print(
        "Start:",
        frame.index.min(),
    )

    print(
        "End:",
        frame.index.max(),
    )

    print()
    print(
        "Training frozen V7 Random Forest..."
    )

    model.fit(
        features,
        target,
    )

    MODEL_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact = {
        "model":
            model,

        "model_name":
            PRODUCTION_MODEL_NAME,

        "model_version":
            PRODUCTION_MODEL_VERSION,

        "horizon":
            V7_HORIZON,

        "feature_columns":
            list(
                PRODUCTION_FEATURE_COLUMNS
            ),

        "symbols":
            list(
                PRODUCTION_SYMBOLS
            ),
    }

    joblib.dump(
        artifact,
        MODEL_PATH,
    )

    metadata = {
        "model_name":
            PRODUCTION_MODEL_NAME,

        "model_version":
            PRODUCTION_MODEL_VERSION,

        "model_type":
            type(
                model
            ).__name__,

        "purpose":
            (
                "Cross-sectional opportunity ranking "
                "for A-Trader scanner candidates."
            ),

        "output_semantics":
            (
                "Relative opportunity ranking signal. "
                "Not a probability, confidence score, "
                "or expected return."
            ),

        "horizon_trading_days":
            V7_HORIZON,

        "target_column":
            V7_TARGET_COLUMN,

        "return_column":
            V7_RETURN_COLUMN,

        "training_rows":
            int(
                len(
                    frame
                )
            ),

        "training_symbols":
            int(
                frame[
                    "symbol"
                ].nunique()
            ),

        "training_start":
            str(
                frame.index.min()
            ),

        "training_end":
            str(
                frame.index.max()
            ),

        "feature_count":
            len(
                PRODUCTION_FEATURE_COLUMNS
            ),

        "feature_columns":
            list(
                PRODUCTION_FEATURE_COLUMNS
            ),

        "symbol_universe":
            list(
                PRODUCTION_SYMBOLS
            ),

        "trained_at_utc":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "research_status":
            "validated_v7_frozen",

        "research_notes": [
            (
                "Selected after expanding walk-forward "
                "out-of-sample validation."
            ),
            (
                "Non-overlapping 5-day robustness test "
                "remained positive across all five offsets "
                "for Top-1, Top-3, Top-5, and Top-10."
            ),
            (
                "Technical trend score is intentionally "
                "not blended into the ML prediction."
            ),
            (
                "Model output must not be presented as "
                "probability or calibrated confidence."
            ),
        ],
    }

    with METADATA_PATH.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metadata,
            file,
            indent=2,
        )

    print()
    print(
        "========== ARTIFACT SAVED =========="
    )

    print(
        "Model:",
        MODEL_PATH,
    )

    print(
        "Metadata:",
        METADATA_PATH,
    )

    print()
    print(
        "Model type:",
        type(
            model
        ).__name__,
    )

    print(
        "Feature count:",
        len(
            PRODUCTION_FEATURE_COLUMNS
        ),
    )

    print(
        "Target:",
        V7_TARGET_COLUMN,
    )

    return metadata


if __name__ == "__main__":
    train_v7_production_model()
