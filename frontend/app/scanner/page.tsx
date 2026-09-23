"use client";

import {
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import SetupTrackingButton from "@/components/alerts/SetupTrackingButton";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";
import PageSectionNav from "@/components/ui/PageSectionNav";

import useAlerts from "@/hooks/alerts/useAlerts";

import { api } from "@/lib/api";


/* =========================================================
   TYPES
========================================================= */

type ScannerMode =
  | "balanced"
  | "aggressive";


type ActionFilter =
  | "all"
  | "potential-entry"
  | "watch"
  | "wait";


type ScannerIndicators = {
  rsi: number | null;

  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;

  distance_sma_20_percent:
    number | null;

  distance_sma_50_percent:
    number | null;

  distance_sma_200_percent:
    number | null;

  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;

  volume_ratio:
    number | null;

  volatility_percent:
    number | null;

  performance_5d_percent:
    number | null;

  performance_20d_percent:
    number | null;

  performance_60d_percent:
    number | null;

  distance_from_52w_high_percent:
    number | null;

  distance_from_52w_low_percent:
    number | null;

  atr_14: number | null;

  intraday_vwap: number | null;
  intraday_ema_9: number | null;
  intraday_ema_20: number | null;

  intraday_change_percent:
    number | null;

  intraday_recent_momentum_percent:
    number | null;

  intraday_session_position:
    number | null;

  intraday_volume_ratio:
    number | null;

  intraday_distance_vwap_percent:
    number | null;

  intraday_distance_ema_9_percent:
    number | null;

  intraday_ema_spread_percent:
    number | null;
};


type ScannerCandidate = {
  symbol: string;

  price: number | null;
  previous_close: number | null;
  change_percent: number | null;

  score: number;
  score_max: number;

  rating: string;

  trend: string;
  momentum: string;

  volume_state: string;
  volatility_state: string;

  trend_score: number;
  intraday_score: number;
  opportunity_score: number;
  aggressive_score: number;

  rank_score: number;

  ml_rank: number | null;
  ml_percentile: number | null;
  ml_raw_score: number | null;
  ml_universe_size: number | null;

  intraday_trend: string;

  action_state: string;

  intraday_fit_score: number;
  short_term_fit_score: number;
  swing_fit_score: number;
  long_term_fit_score: number;

  trade_horizon: string;
  secondary_horizon: string;
  trade_duration: string;

  potential_upside_percent:
    number;

  potential_downside_percent:
    number;

  reward_risk_ratio:
    number;

  target_price:
    number | null;

  invalidation_price:
    number | null;

  target_source:
    string | null;

  invalidation_source:
    string | null;

  risk_level: string;

  indicators:
    ScannerIndicators;

  reasons: string[];

  warnings: string[];
};


type ScannerFailure = {
  symbol: string;
  reason: string;
};


type ScannerScanResponse = {
  generated_at: string;

  mode:
    ScannerMode;

  universe_size: number;

  scanned: number;

  matched: number;

  minimum_score: number;

  ml_status: string;

  ml_model:
    string | null;

  ml_model_version:
    string | null;

  ml_universe_size:
    number | null;

  ml_error:
    string | null;

  candidates:
    ScannerCandidate[];

  failed:
    ScannerFailure[];

  disclaimer: string;
};


type ScannerUniverseResponse = {
  symbols: string[];
  count: number;
};


type ScannerJobStatus = {
  status:
    | "idle"
    | "running"
    | "completed"
    | "failed";

  running: boolean;

  progress_percent: number;

  completed: number;

  total: number;

  current_symbol:
    string | null;

  minimum_score: number;

  limit: number;

  mode:
    ScannerMode;

  started_at:
    string | null;

  finished_at:
    string | null;

  error:
    string | null;
};


type ScannerJobStartResponse = {
  message: string;

  status:
    ScannerJobStatus;
};


/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeIndicators(
  indicators?:
    Partial<
      ScannerIndicators
    >,
): ScannerIndicators {
  return {
    rsi:
      indicators?.rsi
      ?? null,

    sma_20:
      indicators?.sma_20
      ?? null,

    sma_50:
      indicators?.sma_50
      ?? null,

    sma_200:
      indicators?.sma_200
      ?? null,

    distance_sma_20_percent:
      indicators
        ?.distance_sma_20_percent
      ?? null,

    distance_sma_50_percent:
      indicators
        ?.distance_sma_50_percent
      ?? null,

    distance_sma_200_percent:
      indicators
        ?.distance_sma_200_percent
      ?? null,

    macd:
      indicators?.macd
      ?? null,

    macd_signal:
      indicators
        ?.macd_signal
      ?? null,

    macd_histogram:
      indicators
        ?.macd_histogram
      ?? null,

    volume_ratio:
      indicators
        ?.volume_ratio
      ?? null,

    volatility_percent:
      indicators
        ?.volatility_percent
      ?? null,

    performance_5d_percent:
      indicators
        ?.performance_5d_percent
      ?? null,

    performance_20d_percent:
      indicators
        ?.performance_20d_percent
      ?? null,

    performance_60d_percent:
      indicators
        ?.performance_60d_percent
      ?? null,

    distance_from_52w_high_percent:
      indicators
        ?.distance_from_52w_high_percent
      ?? null,

    distance_from_52w_low_percent:
      indicators
        ?.distance_from_52w_low_percent
      ?? null,

    atr_14:
      indicators?.atr_14
      ?? null,

    intraday_vwap:
      indicators
        ?.intraday_vwap
      ?? null,

    intraday_ema_9:
      indicators
        ?.intraday_ema_9
      ?? null,

    intraday_ema_20:
      indicators
        ?.intraday_ema_20
      ?? null,

    intraday_change_percent:
      indicators
        ?.intraday_change_percent
      ?? null,

    intraday_recent_momentum_percent:
      indicators
        ?.intraday_recent_momentum_percent
      ?? null,

    intraday_session_position:
      indicators
        ?.intraday_session_position
      ?? null,

    intraday_volume_ratio:
      indicators
        ?.intraday_volume_ratio
      ?? null,

    intraday_distance_vwap_percent:
      indicators
        ?.intraday_distance_vwap_percent
      ?? null,

    intraday_distance_ema_9_percent:
      indicators
        ?.intraday_distance_ema_9_percent
      ?? null,

    intraday_ema_spread_percent:
      indicators
        ?.intraday_ema_spread_percent
      ?? null,
  };
}


function normalizeCandidate(
  candidate:
    Partial<
      ScannerCandidate
    >,
): ScannerCandidate {
  return {
    symbol:
      candidate.symbol
      ?? "",

    price:
      candidate.price
      ?? null,

    previous_close:
      candidate.previous_close
      ?? null,

    change_percent:
      candidate.change_percent
      ?? null,

    score:
      candidate.score
      ?? 0,

    score_max:
      candidate.score_max
      ?? 18,

    rating:
      candidate.rating
      ?? "Neutral",

    trend:
      candidate.trend
      ?? "Unknown",

    momentum:
      candidate.momentum
      ?? "Unknown",

    volume_state:
      candidate.volume_state
      ?? "Unknown",

    volatility_state:
      candidate.volatility_state
      ?? "Unknown",

    trend_score:
      candidate.trend_score
      ?? 50,

    intraday_score:
      candidate.intraday_score
      ?? 50,

    opportunity_score:
      candidate.opportunity_score
      ?? 50,

    aggressive_score:
      candidate.aggressive_score
      ?? 50,

    rank_score:
      candidate.rank_score
      ?? candidate.opportunity_score
      ?? 50,

    ml_rank:
      candidate.ml_rank
      ?? null,

    ml_percentile:
      candidate.ml_percentile
      ?? null,

    ml_raw_score:
      candidate.ml_raw_score
      ?? null,

    ml_universe_size:
      candidate.ml_universe_size
      ?? null,

    intraday_trend:
      candidate.intraday_trend
      ?? "Unknown",

    action_state:
      candidate.action_state
      ?? "Watch",

    intraday_fit_score:
      candidate.intraday_fit_score
      ?? 50,

    short_term_fit_score:
      candidate.short_term_fit_score
      ?? 50,

    swing_fit_score:
      candidate.swing_fit_score
      ?? 50,

    long_term_fit_score:
      candidate.long_term_fit_score
      ?? 50,

    trade_horizon:
      candidate.trade_horizon
      ?? "Unknown",

    secondary_horizon:
      candidate.secondary_horizon
      ?? "Unknown",

    trade_duration:
      candidate.trade_duration
      ?? "Unknown duration",

    potential_upside_percent:
      candidate
        .potential_upside_percent
      ?? 0,

    potential_downside_percent:
      candidate
        .potential_downside_percent
      ?? 0,

    reward_risk_ratio:
      candidate
        .reward_risk_ratio
      ?? 0,

    target_price:
      candidate.target_price
      ?? null,

    invalidation_price:
      candidate
        .invalidation_price
      ?? null,

    target_source:
      candidate.target_source
      ?? null,

    invalidation_source:
      candidate
        .invalidation_source
      ?? null,

    risk_level:
      candidate.risk_level
      ?? candidate.volatility_state
      ?? "Unknown",

    indicators:
      normalizeIndicators(
        candidate.indicators,
      ),

    reasons:
      candidate.reasons
      ?? [],

    warnings:
      candidate.warnings
      ?? [],
  };
}


/* =========================================================
   FORMAT HELPERS
========================================================= */

function formatMoney(
  value:
    number | null,
) {
  if (
    value === null
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-CA",
    {
      style:
        "currency",

      currency:
        "USD",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


function formatPercent(
  value:
    number | null,
) {
  if (
    value === null
  ) {
    return "—";
  }

  return `${
    value > 0
      ? "+"
      : ""
  }${value.toFixed(
    2,
  )}%`;
}


function getScoreClass(
  value: number,
) {
  if (
    value >= 75
  ) {
    return "text-emerald-400";
  }

  if (
    value >= 60
  ) {
    return "text-blue-400";
  }

  if (
    value >= 45
  ) {
    return "text-amber-400";
  }

  return "text-red-400";
}


function getRiskClass(
  value: string,
) {
  const normalized =
    value.toLowerCase();


  if (
    normalized.includes(
      "very high",
    )
  ) {
    return "text-red-400";
  }


  if (
    normalized.includes(
      "high",
    )
  ) {
    return "text-orange-400";
  }


  if (
    normalized.includes(
      "moderate",
    )
  ) {
    return "text-amber-400";
  }


  if (
    normalized.includes(
      "low",
    )
  ) {
    return "text-emerald-400";
  }


  return "text-zinc-300";
}


function getTrendClass(
  value: string,
) {
  const normalized =
    value.toLowerCase();


  if (
    normalized.includes(
      "bullish",
    )
    || normalized.includes(
      "positive",
    )
    || normalized.includes(
      "uptrend",
    )
  ) {
    return "text-emerald-400";
  }


  if (
    normalized.includes(
      "bearish",
    )
    || normalized.includes(
      "weak",
    )
    || normalized.includes(
      "downtrend",
    )
  ) {
    return "text-red-400";
  }


  return "text-zinc-400";
}


function getHorizonClass(
  value: string,
) {
  const normalized =
    value.toLowerCase();


  if (
    normalized.includes(
      "intraday",
    )
  ) {
    return "border-cyan-900/70 bg-cyan-950/30 text-cyan-400";
  }


  if (
    normalized.includes(
      "short",
    )
  ) {
    return "border-blue-900/70 bg-blue-950/30 text-blue-400";
  }


  if (
    normalized.includes(
      "swing",
    )
  ) {
    return "border-violet-900/70 bg-violet-950/30 text-violet-400";
  }


  if (
    normalized.includes(
      "long",
    )
  ) {
    return "border-emerald-900/70 bg-emerald-950/30 text-emerald-400";
  }


  return "border-zinc-800 bg-zinc-900/70 text-zinc-400";
}


function getRatioClass(
  value: number,
) {
  if (
    value >= 3
  ) {
    return "text-emerald-400";
  }

  if (
    value >= 2
  ) {
    return "text-cyan-400";
  }

  if (
    value >= 1.5
  ) {
    return "text-blue-400";
  }

  if (
    value >= 1
  ) {
    return "text-amber-400";
  }

  return "text-red-400";
}


function getActionTone(
  value: string,
):
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info" {
  const normalized =
    value.toLowerCase();


  if (
    normalized.includes(
      "potential entry",
    )
  ) {
    return "positive";
  }


  if (
    normalized.includes(
      "watch",
    )
  ) {
    return "info";
  }


  if (
    normalized.includes(
      "avoid",
    )
  ) {
    return "negative";
  }


  if (
    normalized.includes(
      "extended",
    )
    || normalized.includes(
      "wait",
    )
  ) {
    return "warning";
  }


  return "neutral";
}


function getActionFilterLabel(
  filter:
    ActionFilter,
) {
  if (
    filter
    === "potential-entry"
  ) {
    return "Potential entries";
  }

  if (
    filter
    === "watch"
  ) {
    return "Watch";
  }

  if (
    filter
    === "wait"
  ) {
    return "Wait";
  }

  return "All results";
}


/* =========================================================
   PAGE
========================================================= */

const SCANNER_SECTIONS = [
  {
    id: "scanner-controls",
    label: "Controls",
  },
  {
    id: "scanner-overview",
    label: "Overview",
  },
  {
    id: "scanner-rankings",
    label: "Rankings",
  },
  {
    id: "scanner-shortlist",
    label: "Shortlist",
  },
];


export default function ScannerPage() {
  const {
    alerts,
    saving: alertSaving,
    createAlert,
    deleteAlert,
  } = useAlerts();


  const [
    mode,
    setMode,
  ] = useState<
    ScannerMode
  >(
    "balanced",
  );


  const [
    universeSymbols,
    setUniverseSymbols,
  ] = useState<
    string[]
  >(
    [],
  );


  const [
    universeCount,
    setUniverseCount,
  ] = useState(
    0,
  );


  const [
    customInput,
    setCustomInput,
  ] = useState(
    "",
  );


  const [
    results,
    setResults,
  ] = useState<
    ScannerCandidate[]
  >(
    [],
  );


  const [
    scanInfo,
    setScanInfo,
  ] = useState<
    ScannerScanResponse
    | null
  >(
    null,
  );


  const [
    scanJob,
    setScanJob,
  ] = useState<
    ScannerJobStatus
    | null
  >(
    null,
  );


  const [
    startingScan,
    setStartingScan,
  ] = useState(
    false,
  );


  const [
    customLoading,
    setCustomLoading,
  ] = useState(
    false,
  );


  const [
    loadingResult,
    setLoadingResult,
  ] = useState(
    false,
  );


  const [
    loadingUniverses,
    setLoadingUniverses,
  ] = useState(
    false,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  const [
    search,
    setSearch,
  ] = useState(
    "",
  );


  const [
    actionFilter,
    setActionFilter,
  ] = useState<
    ActionFilter
  >(
    "all",
  );


  const [
    expandedSymbol,
    setExpandedSymbol,
  ] = useState<
    string | null
  >(
    null,
  );


  const loadedFinishedAtRef =
    useRef<
      string | null
    >(
      null,
    );


  const resultRequestActiveRef =
    useRef(
      false,
    );


  /* =======================================================
     APPLY SCAN RESPONSE
  ======================================================= */

  const applyScanResponse =
    useCallback(
      (
        data:
          ScannerScanResponse,
      ) => {
        const normalized =
          (
            data.candidates
            ?? []
          )
            .map(
              normalizeCandidate,
            )
            .sort(
              (
                a,
                b,
              ) =>
                b.rank_score
                - a.rank_score,
            );


        setScanInfo(
          data,
        );


        setMode(
          data.mode
          ?? "balanced",
        );


        setResults(
          normalized,
        );


        setExpandedSymbol(
          null,
        );


        setActionFilter(
          "all",
        );
      },
      [],
    );


  /* =======================================================
     LOAD UNIVERSE
  ======================================================= */

  const loadUniverses =
    useCallback(
      async () => {
        try {
          setLoadingUniverses(
            true,
          );


          const response =
            await api(
              "/scanner/universe",
            );


          if (
            !response.ok
          ) {
            return;
          }


          const data:
            ScannerUniverseResponse =
            await response.json();


          setUniverseSymbols(
            data.symbols
            ?? [],
          );


          setUniverseCount(
            data.count
            ?? data.symbols
              ?.length
            ?? 0,
          );

        } finally {
          setLoadingUniverses(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     LOAD COMPLETED RESULT
  ======================================================= */

  const loadBackgroundScanResult =
    useCallback(
      async (
        finishedAt:
          string | null,
      ) => {
        if (
          resultRequestActiveRef
            .current
        ) {
          return;
        }


        resultRequestActiveRef.current =
          true;


        try {
          setLoadingResult(
            true,
          );


          const response =
            await api(
              "/scanner/result",
            );


          if (
            !response.ok
          ) {
            const details =
              await response
                .json()
                .catch(
                  () => null,
                );


            throw new Error(
              details?.detail
              ?? "Could not load scanner results.",
            );
          }


          const data:
            ScannerScanResponse =
            await response.json();


          applyScanResponse(
            data,
          );


          loadedFinishedAtRef.current =
            finishedAt
            ?? data.generated_at;

        } catch (
          err
        ) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load scanner results.",
          );

        } finally {
          resultRequestActiveRef.current =
            false;


          setLoadingResult(
            false,
          );
        }
      },
      [
        applyScanResponse,
      ],
    );


  /* =======================================================
     STATUS POLLING
  ======================================================= */

  const refreshBackgroundScanStatus =
    useCallback(
      async () => {
        try {
          const response =
            await api(
              "/scanner/status",
            );


          if (
            !response.ok
          ) {
            return;
          }


          const data:
            ScannerJobStatus =
            await response.json();


          setScanJob(
            data,
          );


          if (
            data.status
            === "running"
          ) {
            setMode(
              data.mode
              ?? "balanced",
            );
          }


          if (
            data.status
            === "failed"
          ) {
            if (
              data.error
            ) {
              setError(
                data.error,
              );
            }

            return;
          }


          if (
            data.status
            === "completed"
            && data.finished_at
            && loadedFinishedAtRef
              .current
              !== data.finished_at
          ) {
            await loadBackgroundScanResult(
              data.finished_at,
            );
          }

        } catch {
          // Keep existing UI state if
          // a temporary polling request fails.
        }
      },
      [
        loadBackgroundScanResult,
      ],
    );


  /* =======================================================
     INITIAL LOAD + POLLING
  ======================================================= */

  useEffect(
    () => {
      void loadUniverses();

      void (
        refreshBackgroundScanStatus()
      );


      const timer =
        window.setInterval(
          () => {
            void (
              refreshBackgroundScanStatus()
            );
          },
          1500,
        );


      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      loadUniverses,
      refreshBackgroundScanStatus,
    ],
  );


  /* =======================================================
     RESULT FILTERS
  ======================================================= */

  const filteredResults =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();


        return results.filter(
          (
            result,
          ) => {
            const action =
              result.action_state
                .toLowerCase();


            const matchesAction =
              actionFilter
                === "all"
              || (
                actionFilter
                  === "potential-entry"
                && action.includes(
                  "potential entry",
                )
              )
              || (
                actionFilter
                  === "watch"
                && action.includes(
                  "watch",
                )
              )
              || (
                actionFilter
                  === "wait"
                && action.includes(
                  "wait",
                )
              );


            if (
              !matchesAction
            ) {
              return false;
            }


            if (
              !query
            ) {
              return true;
            }


            return [
              result.symbol,
              result.rating,
              result.trend,
              result.intraday_trend,
              result.action_state,
              result.risk_level,
              result.trade_horizon,
              result.secondary_horizon,
              result.trade_duration,
              result.target_source
                ?? "",
              result.invalidation_source
                ?? "",
              ...result.reasons,
              ...result.warnings,
            ]
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                query,
              );
          },
        );
      },
      [
        results,
        search,
        actionFilter,
      ],
    );


  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    useMemo(
      () => {
        const entries =
          results.filter(
            (
              item,
            ) =>
              item.action_state
                .toLowerCase()
                .includes(
                  "potential entry",
                ),
          ).length;


        const watches =
          results.filter(
            (
              item,
            ) =>
              item.action_state
                .toLowerCase()
                .includes(
                  "watch",
                ),
          ).length;


        const waits =
          results.filter(
            (
              item,
            ) =>
              item.action_state
                .toLowerCase()
                .includes(
                  "wait",
                ),
          ).length;


        const averageOpportunity =
          results.length
          > 0
            ? Math.round(
                results.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total
                    + item.opportunity_score,
                  0,
                )
                / results.length,
              )
            : 0;


        return {
          entries,
          watches,
          waits,
          averageOpportunity,
        };
      },
      [
        results,
      ],
    );


  /* =======================================================
     FILTER HANDLER
  ======================================================= */

  function toggleActionFilter(
    filter:
      ActionFilter,
  ) {
    setActionFilter(
      (
        current,
      ) =>
        current
        === filter
          ? "all"
          : filter,
    );


    setExpandedSymbol(
      null,
    );
  }


  /* =======================================================
     START BACKGROUND SCAN
  ======================================================= */

  async function scanUniverse() {
    try {
      setStartingScan(
        true,
      );

      setError(
        "",
      );


      loadedFinishedAtRef.current =
        null;


      const response =
        await api(
          `/scanner/start?mode=${encodeURIComponent(
            mode,
          )}`,
          {
            method:
              "POST",
          },
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          details?.detail
          ?? "Could not start scanner.",
        );
      }


      const data:
        ScannerJobStartResponse =
        await response.json();


      setScanJob(
        data.status,
      );


      void (
        refreshBackgroundScanStatus()
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setStartingScan(
        false,
      );
    }
  }


  /* =======================================================
     CUSTOM SCAN
  ======================================================= */

  async function scanCustom(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    try {
      setCustomLoading(
        true,
      );

      setError(
        "",
      );


      const symbols =
        customInput
          .split(
            /[\s,]+/,
          )
          .map(
            (
              value,
            ) =>
              value
                .trim()
                .toUpperCase(),
          )
          .filter(
            Boolean,
          );


      if (
        symbols.length
        === 0
      ) {
        throw new Error(
          "Enter at least one ticker symbol.",
        );
      }


      const response =
        await api(
          `/scanner/custom?symbols=${encodeURIComponent(
            symbols.join(
              ",",
            ),
          )}&mode=${encodeURIComponent(
            mode,
          )}`,
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          details?.detail
          ?? "Could not scan custom symbols.",
        );
      }


      const data:
        ScannerScanResponse =
        await response.json();


      applyScanResponse(
        data,
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setCustomLoading(
        false,
      );
    }
  }


  const backgroundRunning =
    scanJob?.status
    === "running";


  const initialResultsLoading =
    (
      backgroundRunning
      || customLoading
      || loadingResult
    )
    && results.length
    === 0;


  const activeMode =
    scanInfo?.mode
    ?? mode;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Scanner"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Discovery"

            title="Market Scanner"

            description="Scan the market for technical opportunities, compare long-term structure with intraday price action, estimate reward-to-risk and identify the trading horizon that best fits each setup."

            actions={
              <div className="flex rounded-xl border border-zinc-900 bg-zinc-950 p-1">

                <button
                  type="button"

                  disabled={
                    backgroundRunning
                  }

                  onClick={() =>
                    setMode(
                      "balanced",
                    )
                  }

                  className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode
                    === "balanced"
                      ? "bg-white text-black"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  Balanced
                </button>


                <button
                  type="button"

                  disabled={
                    backgroundRunning
                  }

                  onClick={() =>
                    setMode(
                      "aggressive",
                    )
                  }

                  className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode
                    === "aggressive"
                      ? "bg-orange-500 text-black"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  Aggressive
                </button>

              </div>
            }

            status={
              <>
                <StatusBadge
                  tone={
                    backgroundRunning
                      ? "info"
                      : "positive"
                  }

                  dot
                >
                  {
                    backgroundRunning
                      ? "Scanner running"
                      : "Scanner ready"
                  }
                </StatusBadge>


                {results.length
                > 0
                && (
                  <StatusBadge
                    tone="neutral"
                  >
                    {results.length} results
                  </StatusBadge>
                )}
              </>
            }
          />


          <PageSectionNav
            sections={SCANNER_SECTIONS}
          />


          <div className="space-y-8">

            {/* ===========================================
                AGGRESSIVE WARNING
            =========================================== */}

            {mode
            === "aggressive"
            && (
              <div className="rounded-2xl border border-orange-900/50 bg-orange-950/20 px-5 py-4">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-900/60 bg-orange-950/40 text-sm text-orange-400">
                    !
                  </div>


                  <div>

                    <p className="text-sm font-semibold text-orange-300">
                      Aggressive Opportunity Mode
                    </p>


                    <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-500">
                      Aggressive mode gives more weight to potential upside,
                      current momentum, volatility and market participation.
                      Stronger scores can also carry substantially larger
                      downside risk.
                    </p>

                  </div>

                </div>

              </div>
            )}


            {/* ===========================================
                ERROR
            =========================================== */}

            {error
            && (
              <div className="rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
                {
                  error
                }
              </div>
            )}


            {/* ===========================================
                RUNNING JOB
            =========================================== */}

            {scanJob
            && scanJob.status
            !== "idle"
            && (
              <Card>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <StatusBadge
                        tone={
                          backgroundRunning
                            ? "info"
                            : scanJob.status
                              === "completed"
                              ? "positive"
                              : "negative"
                        }

                        dot
                      >
                        {
                          backgroundRunning
                            ? "Background scan"
                            : scanJob.status
                              === "completed"
                              ? "Completed"
                              : "Failed"
                        }
                      </StatusBadge>


                      <StatusBadge
                        tone={
                          scanJob.mode
                          === "aggressive"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {
                          scanJob.mode
                          === "aggressive"
                            ? "Aggressive"
                            : "Balanced"
                        }
                      </StatusBadge>

                    </div>


                    <h2 className="mt-4 text-lg font-semibold text-white">
                      {
                        backgroundRunning
                          ? `Scanning ${scanJob.completed} of ${scanJob.total}`
                          : scanJob.status
                            === "completed"
                            ? "Market scan complete"
                            : "Market scan failed"
                      }
                    </h2>


                    <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
                      {
                        backgroundRunning
                          ? scanJob.current_symbol
                            ? `Latest completed symbol: ${scanJob.current_symbol}. The backend continues scanning even if you leave this page.`
                            : "The scanner is running on the backend. You can safely navigate elsewhere and return later."

                          : scanJob.status
                            === "completed"
                            ? "The finished scan has been loaded and the strongest opportunities are ranked below."

                            : scanJob.error
                              ?? "The scanner stopped unexpectedly."
                      }
                    </p>

                  </div>


                  <div className="shrink-0 sm:text-right">

                    <p className="text-3xl font-semibold tracking-tight text-white">
                      {
                        scanJob.progress_percent
                      }%
                    </p>


                    <p className="mt-1 text-xs text-zinc-600">
                      {
                        scanJob.completed
                      }
                      {" / "}
                      {
                        scanJob.total
                      }
                      {" symbols"}
                    </p>

                  </div>

                </div>


                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-zinc-900">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"

                    style={{
                      width:
                        `${Math.min(
                          100,
                          Math.max(
                            0,
                            scanJob.progress_percent,
                          ),
                        )}%`,
                    }}
                  />

                </div>

              </Card>
            )}


            {/* ===========================================
                SCAN CONTROLS
            =========================================== */}

            <section
              id="scanner-controls"
              className="scroll-mt-24"
            >

              <SectionHeading
                eyebrow="Scan controls"
                title="Find opportunities"
                description="Scan the full A-Trader universe or analyze a custom group of symbols."
              />


              <div className="mt-4 grid gap-4 xl:grid-cols-2">

                <Card
                  title="Core market universe"

                  description="Analyze daily structure, current 5-minute price action, technical targets and the most suitable trading horizon."
                >

                  <div className="rounded-xl border border-zinc-900 bg-black px-4 py-4">

                    <div className="flex items-center justify-between gap-5">

                      <div>

                        <p className="text-sm font-medium text-zinc-300">
                          A-Trader universe
                        </p>


                        <p className="mt-1 max-w-md text-xs leading-5 text-zinc-600">
                          Technology, growth, financials, industrials,
                          energy, healthcare and major market ETFs.
                        </p>

                      </div>


                      <div className="shrink-0 text-right">

                        <p className="text-2xl font-semibold tracking-tight text-white">
                          {
                            loadingUniverses
                              ? "..."
                              : universeCount
                                || universeSymbols.length
                                || "—"
                          }
                        </p>


                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                          Symbols
                        </p>

                      </div>

                    </div>

                  </div>


                  <button
                    type="button"

                    onClick={() =>
                      void scanUniverse()
                    }

                    disabled={
                      backgroundRunning
                      || startingScan
                    }

                    className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      mode
                      === "aggressive"
                        ? "bg-orange-500 text-black hover:bg-orange-400"
                        : "bg-white text-black hover:bg-zinc-200"
                    }`}
                  >
                    {
                      backgroundRunning
                        ? `${scanJob?.progress_percent ?? 0}% scanning...`
                        : startingScan
                          ? "Starting..."
                          : mode
                            === "aggressive"
                            ? "Run aggressive scan"
                            : "Run balanced scan"
                    }
                  </button>

                </Card>


                <Card
                  title="Custom symbols"

                  description="Run the same technical, opportunity and horizon analysis on a specific watchlist."
                >

                  <form
                    onSubmit={
                      scanCustom
                    }

                    className="space-y-4"
                  >

                    <div>

                      <label
                        htmlFor="custom-symbols"
                        className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-700"
                      >
                        Ticker symbols
                      </label>


                      <input
                        id="custom-symbols"

                        value={
                          customInput
                        }

                        onChange={(
                          event,
                        ) =>
                          setCustomInput(
                            event.target.value,
                          )
                        }

                        placeholder="NVDA, AMD, META, TSLA"

                        className="mt-2 w-full rounded-xl border border-zinc-900 bg-black px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700"
                      />

                    </div>


                    <div className="flex items-center justify-between gap-4">

                      <p className="text-xs leading-5 text-zinc-600">
                        Separate symbols with commas or spaces.
                      </p>


                      <StatusBadge
                        tone={
                          mode
                          === "aggressive"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {
                          mode
                          === "aggressive"
                            ? "Aggressive"
                            : "Balanced"
                        }
                      </StatusBadge>

                    </div>


                    <button
                      type="submit"

                      disabled={
                        customLoading
                      }

                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {
                        customLoading
                          ? "Scanning..."
                          : "Scan custom symbols"
                      }
                    </button>

                  </form>

                </Card>

              </div>

            </section>


            {/* ===========================================
                SUMMARY METRICS
            =========================================== */}

            <section
              id="scanner-overview"
              className="scroll-mt-24"
            >

              <SectionHeading
                eyebrow="Snapshot"
                title="Scanner overview"
                description="Select Potential entries, Watch or Wait to instantly filter the current scanner results."
              />


              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

                <MetricCard
                  label="Universe"

                  value={
                    (
                      scanInfo
                        ?.universe_size
                      ?? universeCount
                      ?? universeSymbols
                        .length
                    )
                      .toString()
                  }

                  detail="Symbols considered"
                />


                <MetricCard
                  label="Scanned"

                  value={
                    scanInfo
                      ? scanInfo
                          .scanned
                          .toString()
                      : backgroundRunning
                        ? scanJob
                            ?.completed
                            .toString()
                          ?? "—"
                        : "—"
                  }

                  detail="Successfully analyzed"
                />


                <button
                  type="button"

                  onClick={() =>
                    toggleActionFilter(
                      "potential-entry",
                    )
                  }

                  aria-pressed={
                    actionFilter
                    === "potential-entry"
                  }

                  className={`rounded-2xl text-left transition-all ${
                    actionFilter
                    === "potential-entry"
                      ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-black"
                      : "hover:-translate-y-0.5"
                  }`}
                >
                  <MetricCard
                    label="Potential entries"

                    value={
                      <span className="text-emerald-400">
                        {
                          summary.entries
                        }
                      </span>
                    }

                    detail={
                      actionFilter
                      === "potential-entry"
                        ? "Showing potential entries"
                        : "Click to filter"
                    }
                  />
                </button>


                <button
                  type="button"

                  onClick={() =>
                    toggleActionFilter(
                      "watch",
                    )
                  }

                  aria-pressed={
                    actionFilter
                    === "watch"
                  }

                  className={`rounded-2xl text-left transition-all ${
                    actionFilter
                    === "watch"
                      ? "ring-2 ring-blue-500/70 ring-offset-2 ring-offset-black"
                      : "hover:-translate-y-0.5"
                  }`}
                >
                  <MetricCard
                    label="Watch"

                    value={
                      <span className="text-blue-400">
                        {
                          summary.watches
                        }
                      </span>
                    }

                    detail={
                      actionFilter
                      === "watch"
                        ? "Showing watch setups"
                        : "Click to filter"
                    }
                  />
                </button>


                <button
                  type="button"

                  onClick={() =>
                    toggleActionFilter(
                      "wait",
                    )
                  }

                  aria-pressed={
                    actionFilter
                    === "wait"
                  }

                  className={`rounded-2xl text-left transition-all ${
                    actionFilter
                    === "wait"
                      ? "ring-2 ring-amber-500/70 ring-offset-2 ring-offset-black"
                      : "hover:-translate-y-0.5"
                  }`}
                >
                  <MetricCard
                    label="Wait"

                    value={
                      <span className="text-amber-400">
                        {
                          summary.waits
                        }
                      </span>
                    }

                    detail={
                      actionFilter
                      === "wait"
                        ? "Showing wait setups"
                        : "Click to filter"
                    }
                  />
                </button>


                <MetricCard
                  label="Avg opportunity"

                  value={
                    results.length
                    > 0
                      ? (
                          <span
                            className={
                              getScoreClass(
                                summary.averageOpportunity,
                              )
                            }
                          >
                            {
                              summary.averageOpportunity
                            }
                            /100
                          </span>
                        )
                      : "—"
                  }

                  detail="Across current results"
                />

              </div>

            </section>


            {/* ===========================================
                RANKED TABLE
            =========================================== */}

            <section
              id="scanner-rankings"
              className="scroll-mt-24"
            >

              <SectionHeading
                eyebrow="Rankings"
                title="Opportunity scanner"
                description="Compare opportunity, trend, intraday strength, trade horizon and technical reward-to-risk across the current results."
              />


              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950/70">

                <div className="flex flex-col gap-4 border-b border-zinc-900 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex flex-wrap items-center gap-2">

                    <StatusBadge
                      tone={
                        activeMode
                        === "aggressive"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {
                        activeMode
                        === "aggressive"
                          ? "Aggressive ranking"
                          : "Balanced ranking"
                      }
                    </StatusBadge>


                    {scanInfo
                    && (
                      <StatusBadge
                        tone="neutral"
                      >
                        {scanInfo.matched} matched
                      </StatusBadge>
                    )}


                    {actionFilter
                    !== "all"
                    && (
                      <>
                        <StatusBadge
                          tone={
                            actionFilter
                            === "potential-entry"
                              ? "positive"
                              : actionFilter
                                === "watch"
                                ? "info"
                                : "warning"
                          }
                        >
                          {
                            getActionFilterLabel(
                              actionFilter,
                            )
                          }
                          {" · "}
                          {
                            filteredResults.length
                          }
                        </StatusBadge>


                        <button
                          type="button"

                          onClick={() =>
                            setActionFilter(
                              "all",
                            )
                          }

                          className="rounded-lg border border-zinc-800 bg-black px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                        >
                          Clear filter ×
                        </button>
                      </>
                    )}

                  </div>


                  <div className="relative w-full lg:max-w-sm">

                    <input
                      value={
                        search
                      }

                      onChange={(
                        event,
                      ) =>
                        setSearch(
                          event.target.value,
                        )
                      }

                      placeholder="Search symbol, horizon, risk or action..."

                      className="w-full rounded-xl border border-zinc-900 bg-black px-4 py-3 pl-10 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700"
                    />


                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700">
                      ⌕
                    </span>

                  </div>

                </div>


                {initialResultsLoading ? (
                  <ScannerLoading />

                ) : filteredResults.length
                  === 0 ? (
                    <div className="px-6 py-16 text-center">

                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
                        ⌕
                      </div>


                      <p className="mt-4 font-medium text-zinc-300">
                        {
                          search.trim()
                          || actionFilter
                            !== "all"
                            ? "No matching results"
                            : "No scanner results yet"
                        }
                      </p>


                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                        {
                          actionFilter
                          !== "all"
                            ? `There are no ${getActionFilterLabel(
                                actionFilter,
                              ).toLowerCase()} matching the current search. Clear the filter or select another category.`

                            : search.trim()
                              ? "Try another symbol, horizon, action state or risk level."

                              : backgroundRunning
                                ? "The scanner is analyzing daily and intraday market data."

                                : "Run a balanced or aggressive market scan to rank opportunities."
                        }
                      </p>


                      {actionFilter
                      !== "all"
                      && (
                        <button
                          type="button"

                          onClick={() => {
                            setActionFilter(
                              "all",
                            );

                            setSearch(
                              "",
                            );
                          }}

                          className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:border-zinc-700 hover:bg-zinc-800"
                        >
                          Show all results
                        </button>
                      )}

                    </div>

                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[1900px] text-left">

                        <thead className="border-b border-zinc-900 bg-black/40 text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">

                          <tr>

                            <th className="px-5 py-4">
                              Symbol
                            </th>

                            <th className="px-5 py-4">
                              Price
                            </th>

                            <th className="px-5 py-4">
                              Today
                            </th>

                            <th className="px-5 py-4">
                              Opportunity
                            </th>

                            <th className="px-5 py-4">
                              ML Rank
                            </th>

                            <th className="px-5 py-4">
                              Best Fit
                            </th>

                            <th className="px-5 py-4">
                              Trend
                            </th>

                            <th className="px-5 py-4">
                              Intraday
                            </th>

                            <th className="px-5 py-4">
                              Aggressive
                            </th>

                            <th className="px-5 py-4">
                              R/R
                            </th>

                            <th className="px-5 py-4">
                              Reward / Risk
                            </th>

                            <th className="px-5 py-4">
                              Risk
                            </th>

                            <th className="px-5 py-4">
                              Action
                            </th>

                            <th className="px-5 py-4">
                              Track
                            </th>

                            <th className="px-5 py-4 text-right">
                              Details
                            </th>

                          </tr>

                        </thead>


                        <tbody className="divide-y divide-zinc-900">

                          {filteredResults.map(
                            (
                              result,
                            ) => {
                              const expanded =
                                expandedSymbol
                                === result.symbol;


                              return (
                                <Fragment
                                  key={
                                    result.symbol
                                  }
                                >

                                  <tr className="transition hover:bg-zinc-900/30">

                                    <td className="px-5 py-4">

                                      <Link
                                        href={{
                                          pathname:
                                            "/market",

                                          query: {
                                            symbol:
                                              result.symbol,
                                          },
                                        }}

                                        className="text-sm font-semibold text-white transition hover:text-blue-400"
                                      >
                                        {
                                          result.symbol
                                        }
                                      </Link>


                                      <p className="mt-1 text-[11px] text-zinc-700">
                                        {
                                          result.rating
                                        }
                                      </p>

                                    </td>


                                    <td className="px-5 py-4 text-sm font-medium text-zinc-300">
                                      {
                                        formatMoney(
                                          result.price,
                                        )
                                      }
                                    </td>


                                    <td
                                      className={`px-5 py-4 text-sm font-medium ${
                                        (
                                          result.change_percent
                                          ?? 0
                                        ) >= 0
                                          ? "text-emerald-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      {
                                        formatPercent(
                                          result.change_percent,
                                        )
                                      }
                                    </td>


                                    <td className="px-5 py-4">

                                      <ScoreDisplay
                                        value={
                                          result.opportunity_score
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4">

                                      {result.ml_rank !== null
                                      && result.ml_universe_size !== null
                                      ? (
                                        <div className="min-w-[92px]">

                                          <p className="text-sm font-semibold text-blue-400">
                                            #{result.ml_rank}
                                            <span className="ml-1 text-xs font-normal text-zinc-700">
                                              / {result.ml_universe_size}
                                            </span>
                                          </p>

                                          <p className="mt-1 text-[11px] text-zinc-600">
                                            {
                                              result.ml_percentile !== null
                                                ? `${result.ml_percentile.toFixed(1)} percentile`
                                                : "V7 ranked"
                                            }
                                          </p>

                                        </div>
                                      ) : (
                                        <div className="min-w-[92px]">

                                          <p className="text-sm text-zinc-700">
                                            —
                                          </p>

                                          <p className="mt-1 text-[11px] text-zinc-800">
                                            Not in V7
                                          </p>

                                        </div>
                                      )}

                                    </td>


                                    <td className="px-5 py-4">

                                      <div className="flex flex-col items-start">

                                        <span
                                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getHorizonClass(
                                            result.trade_horizon,
                                          )}`}
                                        >
                                          {
                                            result.trade_horizon
                                          }
                                        </span>


                                        <p className="mt-1.5 max-w-[150px] text-[11px] leading-4 text-zinc-700">
                                          {
                                            result.trade_duration
                                          }
                                        </p>

                                      </div>

                                    </td>


                                    <td className="px-5 py-4">

                                      <ScoreDisplay
                                        value={
                                          result.trend_score
                                        }

                                        detail={
                                          result.trend
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4">

                                      <ScoreDisplay
                                        value={
                                          result.intraday_score
                                        }

                                        detail={
                                          result.intraday_trend
                                        }

                                        detailClass={
                                          getTrendClass(
                                            result.intraday_trend,
                                          )
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4">

                                      <ScoreDisplay
                                        value={
                                          result.aggressive_score
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4">

                                      <p
                                        className={`text-sm font-semibold ${getRatioClass(
                                          result.reward_risk_ratio,
                                        )}`}
                                      >
                                        {
                                          result.reward_risk_ratio
                                            .toFixed(
                                              2,
                                            )
                                        }
                                        :1
                                      </p>

                                    </td>


                                    <td className="px-5 py-4">

                                      <p className="text-sm font-medium text-emerald-400">
                                        {
                                          formatPercent(
                                            result.potential_upside_percent,
                                          )
                                        }
                                      </p>


                                      <p className="mt-1 text-xs text-red-400">
                                        -
                                        {
                                          result.potential_downside_percent
                                            .toFixed(
                                              2,
                                            )
                                        }
                                        %
                                      </p>

                                    </td>


                                    <td
                                      className={`px-5 py-4 text-sm font-medium ${getRiskClass(
                                        result.risk_level,
                                      )}`}
                                    >
                                      {
                                        result.risk_level
                                      }
                                    </td>


                                    <td className="px-5 py-4">

                                      <StatusBadge
                                        tone={
                                          getActionTone(
                                            result.action_state,
                                          )
                                        }
                                      >
                                        {
                                          result.action_state
                                        }
                                      </StatusBadge>

                                    </td>


                                    <td className="px-5 py-4">

                                      <SetupTrackingButton
                                        symbol={
                                          result.symbol
                                        }
                                        alerts={
                                          alerts
                                        }
                                        saving={
                                          alertSaving
                                        }
                                        onCreate={
                                          createAlert
                                        }
                                        onDelete={
                                          deleteAlert
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4">

                                      <div className="flex justify-end gap-2">

                                        <button
                                          type="button"

                                          onClick={() =>
                                            setExpandedSymbol(
                                              expanded
                                                ? null
                                                : result.symbol,
                                            )
                                          }

                                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                                        >
                                          {
                                            expanded
                                              ? "Close"
                                              : "Details"
                                          }
                                        </button>


                                        <Link
                                          href={{
                                            pathname:
                                              "/market",

                                            query: {
                                              symbol:
                                                result.symbol,
                                            },
                                          }}

                                          className="rounded-lg border border-blue-900/60 bg-blue-950/20 px-3 py-2 text-xs font-medium text-blue-300 transition hover:border-blue-800 hover:bg-blue-950/40"
                                        >
                                          Analyze
                                        </Link>

                                      </div>

                                    </td>

                                  </tr>


                                  {expanded
                                  && (
                                    <tr className="bg-black/35">

                                      <td
                                        colSpan={
                                          15
                                        }

                                        className="px-5 py-6"
                                      >

                                        <ExpandedTradeDetails
                                          result={
                                            result
                                          }
                                        />

                                      </td>

                                    </tr>
                                  )}

                                </Fragment>
                              );
                            },
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

              </div>

            </section>


            {/* ===========================================
                TOP OPPORTUNITIES
            =========================================== */}

            {filteredResults.length
            > 0
            && (
              <section
                id="scanner-shortlist"
                className="scroll-mt-24"
              >

                <SectionHeading
                  eyebrow="Shortlist"
                  title={
                    actionFilter
                    === "all"
                      ? "Highest-ranked setups"
                      : `${getActionFilterLabel(
                          actionFilter,
                        )} shortlist`
                  }
                  description={
                    actionFilter
                    === "all"
                      ? "A faster view of the strongest opportunities based on your current scanner mode."
                      : "The highest-ranked setups within your currently selected scanner filter."
                  }
                />


                <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">

                  {filteredResults
                    .slice(
                      0,
                      6,
                    )
                    .map(
                      (
                        result,
                      ) => (
                        <ScannerResultCard
                          key={
                            result.symbol
                          }

                          result={
                            result
                          }

                          mode={
                            activeMode
                          }
                        />
                      ),
                    )}

                </div>

              </section>
            )}


            {/* ===========================================
                FAILURES
            =========================================== */}

            {scanInfo
            && scanInfo.failed.length
            > 0
            && (
              <Card>

                <div className="flex items-center gap-2">

                  <StatusBadge
                    tone="warning"
                  >
                    Partial scan
                  </StatusBadge>


                  <p className="text-sm font-medium text-zinc-300">
                    Some symbols could not be analyzed
                  </p>

                </div>


                <div className="mt-4 divide-y divide-zinc-900">

                  {scanInfo.failed.map(
                    (
                      failure,
                    ) => (
                      <div
                        key={
                          `${failure.symbol}-${failure.reason}`
                        }

                        className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-3"
                      >

                        <span className="w-16 shrink-0 text-sm font-semibold text-zinc-300">
                          {
                            failure.symbol
                          }
                        </span>


                        <span className="text-sm text-zinc-600">
                          {
                            failure.reason
                          }
                        </span>

                      </div>
                    ),
                  )}

                </div>

              </Card>
            )}


            {/* ===========================================
                DISCLAIMER
            =========================================== */}

            {scanInfo?.disclaimer
            && (
              <div className="border-t border-zinc-900 pt-5">

                <p className="max-w-5xl text-xs leading-6 text-zinc-700">
                  {
                    scanInfo.disclaimer
                  }
                </p>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
        {
          eyebrow
        }
      </p>


      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        {
          title
        }
      </h2>


      {description
      && (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
          {
            description
          }
        </p>
      )}

    </div>
  );
}


/* =========================================================
   EXPANDED TRADE DETAILS
========================================================= */

function ExpandedTradeDetails({
  result,
}: {
  result:
    ScannerCandidate;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">

      {/* HORIZON */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
          Trade horizon
        </p>


        <div className="mt-3 flex flex-wrap items-center gap-2">

          <span
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${getHorizonClass(
              result.trade_horizon,
            )}`}
          >
            {
              result.trade_horizon
            }
          </span>


          <span className="text-sm text-zinc-600">
            {
              result.trade_duration
            }
          </span>

        </div>


        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
          Horizon fit scores
        </p>


        <div className="mt-3 grid grid-cols-2 gap-3">

          <HorizonScore
            label="Intraday"

            score={
              result.intraday_fit_score
            }
          />


          <HorizonScore
            label="Short term"

            score={
              result.short_term_fit_score
            }
          />


          <HorizonScore
            label="Swing"

            score={
              result.swing_fit_score
            }
          />


          <HorizonScore
            label="Long term"

            score={
              result.long_term_fit_score
            }
          />

        </div>


        <div className="mt-4 rounded-xl border border-zinc-900 bg-zinc-950 p-4">

          <p className="text-xs text-zinc-700">
            Secondary fit
          </p>


          <p className="mt-1 text-sm font-medium text-zinc-300">
            {
              result.secondary_horizon
            }
          </p>

        </div>

      </div>


      {/* TRADE PLAN */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
          Technical trade plan
        </p>


        <div className="mt-3 space-y-3">

          <div className="rounded-xl border border-emerald-950 bg-emerald-950/10 p-4">

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-xs text-zinc-600">
                  Target
                </p>


                <p className="mt-1 text-xl font-semibold text-emerald-400">
                  {
                    formatMoney(
                      result.target_price,
                    )
                  }
                </p>

              </div>


              <p className="text-sm font-semibold text-emerald-400">
                {
                  formatPercent(
                    result.potential_upside_percent,
                  )
                }
              </p>

            </div>


            <p className="mt-3 text-xs leading-5 text-zinc-600">
              {
                result.target_source
                ?? "Technical target estimate"
              }
            </p>

          </div>


          <div className="rounded-xl border border-red-950 bg-red-950/10 p-4">

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-xs text-zinc-600">
                  Invalidation
                </p>


                <p className="mt-1 text-xl font-semibold text-red-400">
                  {
                    formatMoney(
                      result.invalidation_price,
                    )
                  }
                </p>

              </div>


              <p className="text-sm font-semibold text-red-400">
                -
                {
                  result.potential_downside_percent
                    .toFixed(
                      2,
                    )
                }
                %
              </p>

            </div>


            <p className="mt-3 text-xs leading-5 text-zinc-600">
              {
                result.invalidation_source
                ?? "Technical invalidation estimate"
              }
            </p>

          </div>


          <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4">

            <div className="flex items-center justify-between gap-3">

              <p className="text-sm text-zinc-600">
                Reward / Risk
              </p>


              <p
                className={`text-xl font-semibold ${getRatioClass(
                  result.reward_risk_ratio,
                )}`}
              >
                {
                  result.reward_risk_ratio
                    .toFixed(
                      2,
                    )
                }
                :1
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* CURRENT SETUP */}

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
          Current setup
        </p>


        <div className="mt-3 grid grid-cols-2 gap-3">

          <SmallMetric
            label="Technical"

            value={`${result.opportunity_score}/100`}

            valueClass={
              getScoreClass(
                result.opportunity_score,
              )
            }
          />


          <SmallMetric
            label="ML Opportunity"

            value={
              result.ml_rank !== null
              && result.ml_universe_size !== null
                ? `#${result.ml_rank} / ${result.ml_universe_size}`
                : "—"
            }

            valueClass={
              result.ml_percentile !== null
                ? getScoreClass(
                    result.ml_percentile,
                  )
                : "text-zinc-500"
            }
          />


          <SmallMetric
            label="Trend"

            value={`${result.trend_score}/100`}

            valueClass={
              getScoreClass(
                result.trend_score,
              )
            }
          />


          <SmallMetric
            label="Intraday"

            value={`${result.intraday_score}/100`}

            valueClass={
              getScoreClass(
                result.intraday_score,
              )
            }
          />


          <SmallMetric
            label="Aggressive"

            value={`${result.aggressive_score}/100`}

            valueClass={
              getScoreClass(
                result.aggressive_score,
              )
            }
          />

        </div>


        <div className="mt-3 rounded-xl border border-zinc-900 bg-zinc-950 p-4">

          <div className="flex items-center justify-between gap-3">

            <p className="text-xs text-zinc-600">
              Action
            </p>


            <StatusBadge
              tone={
                getActionTone(
                  result.action_state,
                )
              }
            >
              {
                result.action_state
              }
            </StatusBadge>

          </div>


          <div className="mt-4 flex items-center justify-between gap-3">

            <p className="text-xs text-zinc-600">
              Risk level
            </p>


            <p
              className={`text-sm font-medium ${getRiskClass(
                result.risk_level,
              )}`}
            >
              {
                result.risk_level
              }
            </p>

          </div>

        </div>


        {result.reasons.length
        > 0
        && (
          <div className="mt-3 rounded-xl border border-emerald-950 bg-emerald-950/10 p-4">

            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
              Positive factor
            </p>


            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {
                result.reasons[
                  0
                ]
              }
            </p>

          </div>
        )}


        {result.warnings.length
        > 0
        && (
          <div className="mt-3 rounded-xl border border-amber-950 bg-amber-950/10 p-4">

            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600">
              Main caution
            </p>


            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {
                result.warnings[
                  0
                ]
              }
            </p>

          </div>
        )}


        <Link
          href={{
            pathname:
              "/market",

            query: {
              symbol:
                result.symbol,
            },
          }}

          className="mt-4 block rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Open {result.symbol} analysis
        </Link>

      </div>

    </div>
  );
}


/* =========================================================
   RESULT CARD
========================================================= */

function ScannerResultCard({
  result,
  mode,
}: {
  result:
    ScannerCandidate;

  mode:
    ScannerMode;
}) {
  const primaryScore =
    mode
    === "aggressive"
      ? result.aggressive_score
      : result.opportunity_score;


  return (
    <Card
      className="transition-all hover:-translate-y-0.5 hover:border-zinc-700"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <Link
            href={{
              pathname:
                "/market",

              query: {
                symbol:
                  result.symbol,
              },
            }}

            className="text-2xl font-semibold tracking-tight text-white transition hover:text-blue-400"
          >
            {
              result.symbol
            }
          </Link>


          <p className="mt-1.5 text-sm text-zinc-600">
            {
              result.trend
            }
          </p>

        </div>


        <div className="text-right">

          <p
            className={`text-3xl font-semibold tracking-tight ${getScoreClass(
              primaryScore,
            )}`}
          >
            {
              primaryScore
            }

            <span className="ml-0.5 text-sm text-zinc-700">
              /100
            </span>
          </p>


          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            {
              mode
              === "aggressive"
                ? "Aggressive"
                : "Opportunity"
            }
          </p>

        </div>

      </div>


      <div className="mt-5 flex flex-wrap items-center gap-2">

        <span
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getHorizonClass(
            result.trade_horizon,
          )}`}
        >
          {
            result.trade_horizon
          }
        </span>


        <StatusBadge
          tone={
            getActionTone(
              result.action_state,
            )
          }
        >
          {
            result.action_state
          }
        </StatusBadge>

      </div>


      <p className="mt-2 text-xs text-zinc-700">
        {
          result.trade_duration
        }
      </p>


      {result.ml_rank !== null
      && result.ml_universe_size !== null
      && (
        <div className="mt-4 rounded-xl border border-blue-950/80 bg-blue-950/15 px-4 py-3">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-500">
                ML Opportunity
              </p>


              <p className="mt-1 text-sm font-semibold text-zinc-200">
                #{result.ml_rank} of {result.ml_universe_size}
              </p>

            </div>


            <div className="text-right">

              <p
                className={`text-lg font-semibold ${
                  result.ml_percentile !== null
                    ? getScoreClass(
                        result.ml_percentile,
                      )
                    : "text-zinc-500"
                }`}
              >
                {
                  result.ml_percentile !== null
                    ? `${result.ml_percentile.toFixed(1)}%`
                    : "—"
                }
              </p>


              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                Percentile
              </p>

            </div>

          </div>


          <p className="mt-2 text-[11px] leading-5 text-zinc-600">
            Relative 5-day opportunity rank across the validated ML universe.
          </p>

        </div>
      )}


      <div className="mt-6 flex items-end justify-between gap-4">

        <div>

          <p className="text-xl font-semibold text-white">
            {
              formatMoney(
                result.price,
              )
            }
          </p>


          <p
            className={`mt-1 text-sm font-medium ${
              (
                result.change_percent
                ?? 0
              ) >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {
              formatPercent(
                result.change_percent,
              )
            }
          </p>

        </div>


        <div className="text-right">

          <p
            className={`text-lg font-semibold ${getRatioClass(
              result.reward_risk_ratio,
            )}`}
          >
            {
              result.reward_risk_ratio
                .toFixed(
                  2,
                )
            }
            :1
          </p>


          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Reward / Risk
          </p>

        </div>

      </div>


      <div className="mt-5 grid grid-cols-3 gap-2">

        <SmallMetric
          label="Trend"

          value={`${result.trend_score}/100`}

          valueClass={
            getScoreClass(
              result.trend_score,
            )
          }
        />


        <SmallMetric
          label="Intraday"

          value={`${result.intraday_score}/100`}

          valueClass={
            getScoreClass(
              result.intraday_score,
            )
          }
        />


        <SmallMetric
          label="Risk"

          value={
            result.risk_level
          }

          valueClass={
            getRiskClass(
              result.risk_level,
            )
          }
        />

      </div>


      <div className="mt-3 grid grid-cols-2 gap-2">

        <div className="rounded-xl border border-emerald-950 bg-emerald-950/10 p-3">

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Target
          </p>


          <div className="mt-2 flex items-baseline justify-between gap-2">

            <p className="font-semibold text-emerald-400">
              {
                formatMoney(
                  result.target_price,
                )
              }
            </p>


            <p className="text-xs text-emerald-500">
              {
                formatPercent(
                  result.potential_upside_percent,
                )
              }
            </p>

          </div>

        </div>


        <div className="rounded-xl border border-red-950 bg-red-950/10 p-3">

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Invalidation
          </p>


          <div className="mt-2 flex items-baseline justify-between gap-2">

            <p className="font-semibold text-red-400">
              {
                formatMoney(
                  result.invalidation_price,
                )
              }
            </p>


            <p className="text-xs text-red-500">
              -
              {
                result.potential_downside_percent
                  .toFixed(
                    2,
                  )
              }
              %
            </p>

          </div>

        </div>

      </div>


      <div className="mt-3 rounded-xl border border-zinc-900 bg-black p-4">

        <div className="flex items-center justify-between gap-3">

          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
            Horizon fit
          </p>


          <p className="text-xs text-zinc-600">
            Secondary:{" "}
            <span className="text-zinc-400">
              {
                result.secondary_horizon
              }
            </span>
          </p>

        </div>


        <div className="mt-4 grid grid-cols-4 gap-2">

          <CompactHorizonScore
            label="Day"

            score={
              result.intraday_fit_score
            }
          />


          <CompactHorizonScore
            label="Short"

            score={
              result.short_term_fit_score
            }
          />


          <CompactHorizonScore
            label="Swing"

            score={
              result.swing_fit_score
            }
          />


          <CompactHorizonScore
            label="Long"

            score={
              result.long_term_fit_score
            }
          />

        </div>

      </div>


      {result.reasons.length
      > 0
      && (
        <div className="mt-3 rounded-xl border border-emerald-950 bg-emerald-950/10 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
            Positive factor
          </p>


          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {
              result.reasons[
                0
              ]
            }
          </p>

        </div>
      )}


      {result.warnings.length
      > 0
      && (
        <div className="mt-3 rounded-xl border border-amber-950 bg-amber-950/10 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600">
            Main caution
          </p>


          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {
              result.warnings[
                0
              ]
            }
          </p>

        </div>
      )}


      <Link
        href={{
          pathname:
            "/market",

          query: {
            symbol:
              result.symbol,
          },
        }}

        className="mt-5 block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-zinc-700 hover:bg-white hover:text-black"
      >
        Open {result.symbol} analysis
      </Link>

    </Card>
  );
}


/* =========================================================
   HORIZON SCORE
========================================================= */

function HorizonScore({
  label,
  score,
}: {
  label:
    string;

  score:
    number;
}) {
  const width =
    Math.min(
      100,
      Math.max(
        0,
        score,
      ),
    );


  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-3">

      <div className="flex items-center justify-between gap-3">

        <p className="text-xs text-zinc-600">
          {
            label
          }
        </p>


        <p
          className={`text-sm font-semibold ${getScoreClass(
            score,
          )}`}
        >
          {
            score
          }
          /100
        </p>

      </div>


      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">

        <div
          className="h-full rounded-full bg-white"

          style={{
            width:
              `${width}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   COMPACT HORIZON SCORE
========================================================= */

function CompactHorizonScore({
  label,
  score,
}: {
  label:
    string;

  score:
    number;
}) {
  return (
    <div>

      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-1 text-sm font-semibold ${getScoreClass(
          score,
        )}`}
      >
        {
          score
        }
      </p>

    </div>
  );
}


/* =========================================================
   SCORE DISPLAY
========================================================= */

function ScoreDisplay({
  value,
  detail,
  detailClass,
}: {
  value:
    number;

  detail?:
    string;

  detailClass?:
    string;
}) {
  return (
    <div>

      <p
        className={`text-sm font-semibold ${getScoreClass(
          value,
        )}`}
      >
        {
          value
        }

        <span className="text-zinc-700">
          /100
        </span>
      </p>


      {detail
      && (
        <p
          className={`mt-1 max-w-[140px] text-[11px] leading-4 ${
            detailClass
            ?? "text-zinc-700"
          }`}
        >
          {
            detail
          }
        </p>
      )}

    </div>
  );
}


/* =========================================================
   SMALL METRIC
========================================================= */

function SmallMetric({
  label,
  value,
  valueClass,
}: {
  label:
    string;

  value:
    string;

  valueClass?:
    string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-3">

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-2 text-sm font-semibold ${
          valueClass
          ?? "text-white"
        }`}
      >
        {
          value
        }
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function ScannerLoading() {
  return (
    <div>

      {Array.from({
        length:
          8,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={
              index
            }

            className="h-20 animate-pulse border-b border-zinc-900 bg-black/20 last:border-b-0"
          />
        ),
      )}

    </div>
  );
}