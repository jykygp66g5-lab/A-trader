from __future__ import annotations


V10_PEER_GROUPS = {
    # --------------------------------------------------
    # SEMICONDUCTORS
    # --------------------------------------------------
    "semiconductors": [
        "NVDA",
        "AMD",
        "AVGO",
        "ARM",
        "MU",
        "QCOM",
        "INTC",
        "TSM",
        "ASML",
        "SMCI",
    ],

    # --------------------------------------------------
    # SOFTWARE / CLOUD / CYBERSECURITY
    # --------------------------------------------------
    "software_cloud": [
        "MSFT",
        "PLTR",
        "CRM",
        "ORCL",
        "NOW",
        "SNOW",
        "CRWD",
        "PANW",
        "NET",
    ],

    # --------------------------------------------------
    # INTERNET / CONSUMER TECHNOLOGY
    # --------------------------------------------------
    "internet_consumer_tech": [
        "AAPL",
        "AMZN",
        "GOOGL",
        "META",
        "NFLX",
        "UBER",
        "ABNB",
        "SHOP",
        "MELI",
    ],

    # --------------------------------------------------
    # FINANCIALS / FINTECH
    # --------------------------------------------------
    "financials": [
        "JPM",
        "BAC",
        "GS",
        "MS",
        "V",
        "MA",
        "COIN",
        "HOOD",
    ],

    # --------------------------------------------------
    # INDUSTRIAL / AEROSPACE / DEFENSE
    # --------------------------------------------------
    "industrials_defense": [
        "CAT",
        "GE",
        "BA",
        "LMT",
        "RTX",
    ],

    # --------------------------------------------------
    # ENERGY
    # --------------------------------------------------
    "energy": [
        "XOM",
        "CVX",
        "COP",
        "SLB",
    ],

    # --------------------------------------------------
    # HEALTHCARE
    # --------------------------------------------------
    "healthcare": [
        "LLY",
        "UNH",
        "ABBV",
        "MRK",
    ],
}


V10_SYMBOL_TO_PEER_GROUP = {
    symbol: group
    for group, symbols
    in V10_PEER_GROUPS.items()
    for symbol in symbols
}


def get_peer_group(
    symbol: str,
) -> str:
    normalized = (
        symbol
        .strip()
        .upper()
    )

    try:
        return V10_SYMBOL_TO_PEER_GROUP[
            normalized
        ]

    except KeyError as exc:
        raise ValueError(
            f"No V10 peer group configured "
            f"for {normalized}."
        ) from exc


# ============================================================
# V10 PEER-RELATIVE FEATURES
# ============================================================

V10_PEER_BASE_COLUMNS = [
    "performance_5d_percent",
    "performance_20d_percent",
    "performance_60d_percent",
    "rsi_14",
    "volatility_20_percent",
    "volume_ratio_20",
]


V10_PEER_FEATURE_COLUMNS = [
    "peer_relative_performance_5d",
    "peer_relative_performance_20d",
    "peer_relative_performance_60d",
    "peer_relative_rsi_14",
    "peer_relative_volatility_20",
    "peer_relative_volume_ratio_20",
]


V10_BASE_TO_PEER_FEATURE = {
    "performance_5d_percent":
        "peer_relative_performance_5d",

    "performance_20d_percent":
        "peer_relative_performance_20d",

    "performance_60d_percent":
        "peer_relative_performance_60d",

    "rsi_14":
        "peer_relative_rsi_14",

    "volatility_20_percent":
        "peer_relative_volatility_20",

    "volume_ratio_20":
        "peer_relative_volume_ratio_20",
}


def add_v10_peer_features(
    frame,
):
    """
    Add leave-one-out peer-relative features.

    For every stock/date, the peer benchmark is calculated
    from the OTHER stocks in the same peer group.

    The current stock is never included in its own benchmark.

    No future data is used.
    """

    result = frame.copy()

    result[
        "_v10_peer_group"
    ] = (
        result[
            "symbol"
        ]
        .map(
            V10_SYMBOL_TO_PEER_GROUP
        )
    )

    if result[
        "_v10_peer_group"
    ].isna().any():
        missing_symbols = sorted(
            result.loc[
                result[
                    "_v10_peer_group"
                ].isna(),
                "symbol",
            ]
            .unique()
            .tolist()
        )

        raise ValueError(
            "Missing V10 peer mapping for: "
            + ", ".join(
                missing_symbols
            )
        )

    group_keys = [
        result.index,
        result[
            "_v10_peer_group"
        ],
    ]

    for base_column in (
        V10_PEER_BASE_COLUMNS
    ):
        if base_column not in (
            result.columns
        ):
            raise ValueError(
                f"Missing required V10 base feature: "
                f"{base_column}"
            )

        values = result[
            base_column
        ]

        group_sum = (
            values
            .groupby(
                group_keys
            )
            .transform(
                "sum"
            )
        )

        group_count = (
            values
            .groupby(
                group_keys
            )
            .transform(
                "count"
            )
        )

        own_available = (
            values
            .notna()
            .astype(
                int
            )
        )

        peer_count = (
            group_count
            - own_available
        )

        peer_sum = (
            group_sum
            - values.fillna(
                0.0
            )
        )

        peer_mean = (
            peer_sum
            / peer_count.replace(
                0,
                float(
                    "nan"
                ),
            )
        )

        output_column = (
            V10_BASE_TO_PEER_FEATURE[
                base_column
            ]
        )

        result[
            output_column
        ] = (
            values
            - peer_mean
        )

    return result.drop(
        columns=[
            "_v10_peer_group",
        ]
    )
