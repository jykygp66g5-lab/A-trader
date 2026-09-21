from __future__ import annotations

import pandas as pd


V7_HORIZON = 5

V7_RETURN_COLUMN = (
    f"relative_return_{V7_HORIZON}d_percent"
)

V7_TARGET_COLUMN = (
    f"cross_section_rank_{V7_HORIZON}d"
)


def add_cross_sectional_rank_target(
    frame: pd.DataFrame,
    horizon: int = V7_HORIZON,
) -> pd.DataFrame:
    """
    Add a same-day cross-sectional percentile target.

    For each trading date, stocks are ranked according
    to their future excess return versus SPY.

    Lowest future excess return -> near 0.
    Highest future excess return -> 1.0.

    This target is intentionally future-looking and is
    used ONLY as the supervised-learning target.
    """

    return_column = (
        f"relative_return_{horizon}d_percent"
    )

    target_column = (
        f"cross_section_rank_{horizon}d"
    )

    if return_column not in frame.columns:
        raise ValueError(
            f"Missing required column: "
            f"{return_column}"
        )

    result = frame.copy()

    known_return = (
        result[
            return_column
        ]
        .notna()
    )

    result[
        target_column
    ] = pd.NA

    ranked = (
        result.loc[
            known_return,
            return_column,
        ]
        .groupby(
            level=0,
        )
        .rank(
            method="average",
            pct=True,
        )
    )

    result.loc[
        known_return,
        target_column,
    ] = ranked

    result[
        target_column
    ] = pd.to_numeric(
        result[
            target_column
        ],
        errors="coerce",
    )

    return result
