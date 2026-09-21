from __future__ import annotations

import numpy as np
import pandas as pd


V4_THRESHOLDS = {
    5: 1.0,
    10: 1.5,
    20: 2.0,
}


def build_threshold_target(
    relative_return: pd.Series,
    threshold: float,
) -> pd.Series:
    target = pd.Series(
        pd.NA,
        index=relative_return.index,
        dtype="Int64",
    )

    target.loc[
        relative_return > threshold
    ] = 1

    target.loc[
        relative_return < -threshold
    ] = 0

    return target


def add_v4_targets(
    frame: pd.DataFrame,
) -> pd.DataFrame:
    result = frame.copy()

    for horizon, threshold in V4_THRESHOLDS.items():
        return_column = (
            f"relative_return_{horizon}d_percent"
        )

        if return_column not in result.columns:
            raise ValueError(
                f"Missing V3 return column: {return_column}"
            )

        target_column = (
            f"v4_target_{horizon}d"
        )

        result[
            target_column
        ] = build_threshold_target(
            relative_return=result[
                return_column
            ],
            threshold=threshold,
        )

    return result
