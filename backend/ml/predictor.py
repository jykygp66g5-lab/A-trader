from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from market_data import download_market_data

from .v5 import add_cross_sectional_features


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "v7_random_forest.joblib"
)


@dataclass(frozen=True)
class MLOpportunity:
    symbol: str

    # Raw Random Forest output. This is the model's
    # estimate of the supervised cross-sectional rank
    # target. It is NOT a probability or confidence.
    raw_score: float

    # Rank within the batch supplied to the predictor.
    # 1 = highest-ranked opportunity.
    rank: int

    # 0-100 relative standing within the current batch.
    # This is a ranking percentile, not probability.
    percentile: float

    universe_size: int


class V7Predictor:
    """
    Production inference wrapper for the frozen V7 model.

    V7 is a cross-sectional opportunity-ranking model.
    Stocks must be scored together as a batch because
    part of the feature set consists of same-day
    cross-sectional percentile ranks.
    """

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
    ) -> None:
        self.model_path = model_path

        if not self.model_path.exists():
            raise FileNotFoundError(
                "V7 production model not found: "
                f"{self.model_path}"
            )

        artifact = joblib.load(
            self.model_path
        )

        required_keys = {
            "model",
            "model_name",
            "model_version",
            "horizon",
            "feature_columns",
            "symbols",
        }

        missing_keys = (
            required_keys
            - set(
                artifact
            )
        )

        if missing_keys:
            raise ValueError(
                "Invalid V7 artifact. Missing keys: "
                + ", ".join(
                    sorted(
                        missing_keys
                    )
                )
            )

        self.model = artifact[
            "model"
        ]

        self.model_name = str(
            artifact[
                "model_name"
            ]
        )

        self.model_version = str(
            artifact[
                "model_version"
            ]
        )

        self.horizon = int(
            artifact[
                "horizon"
            ]
        )

        self.feature_columns = tuple(
            artifact[
                "feature_columns"
            ]
        )

        self.symbols = tuple(
            artifact[
                "symbols"
            ]
        )


    def _validate_base_frame(
        self,
        frame: pd.DataFrame,
    ) -> pd.DataFrame:
        if frame.empty:
            raise ValueError(
                "Cannot run V7 prediction on an empty frame."
            )

        if "symbol" not in frame.columns:
            raise ValueError(
                "Prediction frame must contain a symbol column."
            )

        result = frame.copy()

        result[
            "symbol"
        ] = (
            result[
                "symbol"
            ]
            .astype(
                str
            )
            .str
            .strip()
            .str
            .upper()
        )

        if result[
            "symbol"
        ].duplicated().any():
            duplicates = (
                result.loc[
                    result[
                        "symbol"
                    ].duplicated(
                        keep=False
                    ),
                    "symbol",
                ]
                .unique()
                .tolist()
            )

            raise ValueError(
                "Prediction batch contains duplicate symbols: "
                + ", ".join(
                    sorted(
                        duplicates
                    )
                )
            )

        return result


    def prepare_features(
        self,
        frame: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Add V5 same-day cross-sectional rank features and
        return a clean prediction frame.

        The input must already contain the 44 V2 base and
        market-context features for ONE common market date.
        """

        result = self._validate_base_frame(
            frame
        )

        result = add_cross_sectional_features(
            result
        )

        missing_features = [
            column
            for column in self.feature_columns
            if column not in result.columns
        ]

        if missing_features:
            raise ValueError(
                "Prediction frame is missing V7 features: "
                + ", ".join(
                    missing_features
                )
            )

        result = result.replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )

        invalid = result[
            list(
                self.feature_columns
            )
        ].isna()

        invalid_rows = invalid.any(
            axis=1
        )

        if invalid_rows.any():
            bad_symbols = (
                result.loc[
                    invalid_rows,
                    "symbol",
                ]
                .tolist()
            )

            raise ValueError(
                "Incomplete V7 features for: "
                + ", ".join(
                    bad_symbols
                )
            )

        return result


    def predict_batch(
        self,
        frame: pd.DataFrame,
    ) -> list[MLOpportunity]:
        """
        Rank all supplied stocks as relative ML
        opportunities.

        The returned percentile is a current-batch
        percentile only. It must never be displayed as
        probability or confidence.
        """

        prepared = self.prepare_features(
            frame
        )

        features = prepared[
            list(
                self.feature_columns
            )
        ]

        predictions = np.asarray(
            self.model.predict(
                features
            ),
            dtype=float,
        )

        if len(
            predictions
        ) != len(
            prepared
        ):
            raise RuntimeError(
                "V7 prediction count does not match input rows."
            )

        scored = prepared[
            [
                "symbol",
            ]
        ].copy()

        scored[
            "raw_score"
        ] = predictions

        scored = (
            scored
            .sort_values(
                [
                    "raw_score",
                    "symbol",
                ],
                ascending=[
                    False,
                    True,
                ],
                kind="stable",
            )
            .reset_index(
                drop=True
            )
        )

        universe_size = len(
            scored
        )

        scored[
            "rank"
        ] = np.arange(
            1,
            universe_size + 1,
        )

        if universe_size == 1:
            scored[
                "percentile"
            ] = 100.0

        else:
            scored[
                "percentile"
            ] = (
                100.0
                * (
                    1.0
                    - (
                        (
                            scored[
                                "rank"
                            ]
                            - 1
                        )
                        / (
                            universe_size
                            - 1
                        )
                    )
                )
            )

        opportunities: list[
            MLOpportunity
        ] = []

        for row in scored.itertuples(
            index=False
        ):
            opportunities.append(
                MLOpportunity(
                    symbol=str(
                        row.symbol
                    ),

                    raw_score=float(
                        row.raw_score
                    ),

                    rank=int(
                        row.rank
                    ),

                    percentile=float(
                        row.percentile
                    ),

                    universe_size=universe_size,
                )
            )

        return opportunities


    def top_opportunities(
        self,
        frame: pd.DataFrame,
        limit: int = 5,
    ) -> list[MLOpportunity]:
        if limit < 1:
            raise ValueError(
                "Opportunity limit must be at least 1."
            )

        return self.predict_batch(
            frame
        )[
            :limit
        ]


_default_predictor: V7Predictor | None = None


def get_v7_predictor() -> V7Predictor:
    """
    Lazily load and reuse the production model.
    """

    global _default_predictor

    if _default_predictor is None:
        _default_predictor = V7Predictor()

    return _default_predictor


def _normalize_downloaded_symbol_frame(
    data: pd.DataFrame,
    symbol: str,
) -> pd.DataFrame:
    """
    Extract one symbol from a multi-symbol yfinance
    download and normalize it to standard OHLCV columns.
    """

    clean_symbol = (
        symbol
        .strip()
        .upper()
    )

    if data.empty:
        raise ValueError(
            f"No live market data available for {clean_symbol}."
        )

    if not isinstance(
        data.columns,
        pd.MultiIndex,
    ):
        result = data.copy()

    else:
        level_0 = set(
            str(value)
            for value
            in data.columns.get_level_values(
                0
            )
        )

        level_1 = set(
            str(value)
            for value
            in data.columns.get_level_values(
                1
            )
        )

        if clean_symbol in level_1:
            result = data.xs(
                clean_symbol,
                axis=1,
                level=1,
            ).copy()

        elif clean_symbol in level_0:
            result = data.xs(
                clean_symbol,
                axis=1,
                level=0,
            ).copy()

        else:
            raise ValueError(
                "Could not locate "
                f"{clean_symbol} in live market download."
            )

    required_columns = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
    ]

    missing = [
        column
        for column in required_columns
        if column not in result.columns
    ]

    if missing:
        raise ValueError(
            f"{clean_symbol} live data missing columns: "
            + ", ".join(
                missing
            )
        )

    result = (
        result[
            required_columns
        ]
        .dropna(
            subset=[
                "Close",
            ]
        )
        .sort_index()
        .copy()
    )

    if result.empty:
        raise ValueError(
            f"No usable live history for {clean_symbol}."
        )

    return result


def build_live_v7_base_frame(
    predictor: V7Predictor | None = None,
    period: str = "2y",
) -> pd.DataFrame:
    """
    Build the current V2 feature cross-section for the
    complete validated V7 universe.

    SPY and QQQ are downloaded as market references but
    are not themselves ranked as V7 opportunities.
    """


    from .features import (
        build_v2_feature_frame,
    )

    if predictor is None:
        predictor = get_v7_predictor()

    opportunity_symbols = list(
        predictor.symbols
    )

    download_symbols = list(
        dict.fromkeys(
            opportunity_symbols
            + [
                "SPY",
                "QQQ",
            ]
        )
    )

    print(
        "Downloading live V7 market universe..."
    )

    downloaded = download_market_data(
        download_symbols,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=True,
        group_by="column",
    )

    if downloaded.empty:
        raise ValueError(
            "Live V7 market download returned no data."
        )

    spy_data = (
        _normalize_downloaded_symbol_frame(
            downloaded,
            "SPY",
        )
    )

    qqq_data = (
        _normalize_downloaded_symbol_frame(
            downloaded,
            "QQQ",
        )
    )

    latest_rows: list[
        pd.DataFrame
    ] = []

    failures: list[
        str
    ] = []

    for symbol in opportunity_symbols:
        try:
            stock_data = (
                _normalize_downloaded_symbol_frame(
                    downloaded,
                    symbol,
                )
            )

            features = build_v2_feature_frame(
                stock_data=stock_data,
                spy_data=spy_data,
                qqq_data=qqq_data,
            )

            complete = (
                features
                .replace(
                    [
                        np.inf,
                        -np.inf,
                    ],
                    np.nan,
                )
                .dropna()
            )

            if complete.empty:
                raise ValueError(
                    "No complete V2 feature row."
                )

            latest = (
                complete
                .iloc[
                    [
                        -1
                    ]
                ]
                .copy()
            )

            latest[
                "symbol"
            ] = symbol

            latest_rows.append(
                latest
            )

        except Exception as exc:
            failures.append(
                f"{symbol}: {exc}"
            )

    if failures:
        raise ValueError(
            "V7 live universe is incomplete. "
            "Refusing partial-universe inference. "
            + " | ".join(
                failures
            )
        )

    if len(
        latest_rows
    ) != len(
        opportunity_symbols
    ):
        raise ValueError(
            "V7 live universe coverage mismatch."
        )

    common_dates = {
        pd.Timestamp(
            frame.index[
                -1
            ]
        )
        for frame
        in latest_rows
    }

    if len(
        common_dates
    ) != 1:
        details = ", ".join(
            sorted(
                str(
                    value
                )
                for value
                in common_dates
            )
        )

        raise ValueError(
            "V7 symbols do not share one latest "
            f"market date: {details}"
        )

    combined = pd.concat(
        latest_rows,
        axis=0,
    )

    return combined


def predict_live_v7_universe(
    predictor: V7Predictor | None = None,
) -> list[MLOpportunity]:
    """
    Download current daily market history and rank the
    complete validated V7 universe.

    Fail closed if the validated universe cannot be
    reconstructed completely.
    """

    if predictor is None:
        predictor = get_v7_predictor()

    frame = build_live_v7_base_frame(
        predictor=predictor,
    )

    return predictor.predict_batch(
        frame
    )
