"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";
import PageSectionNav from "@/components/ui/PageSectionNav";
import { api } from "@/lib/api";

import {
  getWatchlist,
} from "@/lib/watchlist/api";

import type {
  WatchlistItem,
} from "@/lib/watchlist/types";


type Trade = {
  id: number;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  risk_percent: number;
  strategy: string;
  custom_strategy?: string;
  tags?: string[];
  confidence: number;
  psychology_notes: string;
  lesson_learned: string;
  created_at: string;
};


type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};


type TradeResult = {
  trade: Trade;
  pnl: number;
};


type DashboardMarket = {
  symbol: string;

  price: number;
  previous_close: number;
  change_percent: number;

  signal: string;
  risk: string;

  trend_score: number;
  opportunity_score: number;

  action_state: string;
  trade_horizon: string;

  performance_5d_percent: number;
  performance_20d_percent: number;

  rsi: number;
};


type ScannerCandidate = {
  symbol: string;
  price: number;
  previous_close: number;
  change_percent: number;

  opportunity_score: number;
  rank_score: number;

  action_state: string;

  trade_horizon: string;
  trade_duration: string;

  reward_risk_ratio: number;
  risk_level: string;

  potential_upside_percent: number;
  potential_downside_percent: number;

  ml_rank: number | null;
  ml_percentile: number | null;

  reasons: string[];
  warnings: string[];
};


type ScannerScanResponse = {
  generated_at: string;

  mode:
    | "conservative"
    | "balanced"
    | "aggressive";

  universe_size: number;
  scanned: number;
  matched: number;
  minimum_score: number;

  ml_status: string;
  ml_model: string | null;
  ml_model_version: string | null;
  ml_universe_size: number | null;
  ml_error: string | null;

  candidates:
    ScannerCandidate[];

  failed: {
    symbol: string;
    reason: string;
  }[];

  disclaimer: string;
};


const DASHBOARD_MARKETS = [
  "SPY",
  "QQQ",
  "DIA",
] as const;


const DASHBOARD_SECTIONS = [
  {
    id: "today",
    label: "Today",
  },
  {
    id: "markets",
    label: "Markets",
  },
  {
    id: "opportunities",
    label: "Opportunities",
  },
  {
    id: "trading",
    label: "Your Trading",
  },
] as const;


/* =========================================================
   HELPERS
========================================================= */

function calculatePnl(
  trade: Trade,
) {
  const difference =
    trade.direction
      .toLowerCase()
    === "short"
      ? trade.entry_price
        - trade.exit_price
      : trade.exit_price
        - trade.entry_price;

  return (
    difference
    * trade.position_size
  );
}


function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-CA",
    {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    },
  ).format(value);
}


function getGreeting() {
  const hour =
    new Date()
      .getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [
    trades,
    setTrades,
  ] = useState<Trade[]>([]);

  const [
    user,
    setUser,
  ] = useState<User | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const [
    scannerResult,
    setScannerResult,
  ] = useState<
    ScannerScanResponse
    | null
  >(
    null,
  );


  const [
    scannerLoading,
    setScannerLoading,
  ] = useState(true);


  const [
    marketOverview,
    setMarketOverview,
  ] = useState<
    DashboardMarket[]
  >(
    [],
  );


  const [
    marketLoading,
    setMarketLoading,
  ] = useState(
    true,
  );


  const [
    watchlist,
    setWatchlist,
  ] = useState<
    WatchlistItem[]
  >(
    [],
  );


  const [
    radarMarkets,
    setRadarMarkets,
  ] = useState<
    DashboardMarket[]
  >(
    [],
  );


  const [
    radarLoading,
    setRadarLoading,
  ] = useState(
    true,
  );


  useEffect(
    () => {
      async function loadDashboard() {
        try {
          setLoading(true);
          setError("");

          const [
            tradesResponse,
            userResponse,
          ] =
            await Promise.all([
              api("/trades"),
              api("/auth/me"),
            ]);

          if (!tradesResponse.ok) {
            throw new Error(
              "Could not load your trading data.",
            );
          }

          const tradeData:
            Trade[] =
            await tradesResponse.json();

          setTrades(tradeData);

          if (userResponse.ok) {
            const userData:
              User =
              await userResponse.json();

            setUser(userData);
          }

        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong.",
          );

        } finally {
          setLoading(false);
        }
      }

      void loadDashboard();
    },
    [],
  );


  useEffect(
    () => {
      async function loadScannerResult() {
        try {
          setScannerLoading(
            true,
          );

          const response =
            await api(
              "/scanner/result",
            );


          if (
            response.status
            === 404
            || response.status
            === 409
          ) {
            return;
          }


          if (!response.ok) {
            return;
          }


          const data:
            ScannerScanResponse =
            await response.json();


          setScannerResult(
            data,
          );

        } catch {
          // Scanner information is supplementary.
          // Dashboard remains usable without it.

        } finally {
          setScannerLoading(
            false,
          );
        }
      }


      void loadScannerResult();
    },
    [],
  );


  useEffect(
    () => {
      let cancelled =
        false;


      async function loadMarketOverview() {
        try {
          setMarketLoading(
            true,
          );


          const responses =
            await Promise.allSettled(
              DASHBOARD_MARKETS.map(
                async (
                  symbol,
                ) => {
                  const response =
                    await api(
                      `/market/analyze/${encodeURIComponent(
                        symbol,
                      )}`,
                    );


                  if (!response.ok) {
                    throw new Error(
                      `Could not analyze ${symbol}.`,
                    );
                  }


                  return (
                    await response.json()
                  ) as DashboardMarket;
                },
              ),
            );


          if (cancelled) {
            return;
          }


          const successful =
            responses.flatMap(
              (
                result,
              ) =>
                result.status
                === "fulfilled"
                  ? [
                      result.value,
                    ]
                  : [],
            );


          setMarketOverview(
            successful,
          );

        } catch {
          // Broad-market context is supplementary.
          // The rest of the dashboard remains usable.

        } finally {
          if (!cancelled) {
            setMarketLoading(
              false,
            );
          }
        }
      }


      void loadMarketOverview();


      return () => {
        cancelled =
          true;
      };
    },
    [],
  );


  /* =======================================================
     PERSONAL WATCHLIST / RADAR
  ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;


      async function loadRadar() {
        try {
          setRadarLoading(
            true,
          );


          const items =
            await getWatchlist();


          if (cancelled) {
            return;
          }


          setWatchlist(
            items,
          );


          if (
            items.length === 0
          ) {
            setRadarMarkets(
              [],
            );

            return;
          }


          const responses =
            await Promise.allSettled(
              items.map(
                async (
                  item,
                ) => {
                  const response =
                    await api(
                      `/market/analyze/${encodeURIComponent(
                        item.symbol,
                      )}`,
                    );


                  if (!response.ok) {
                    throw new Error(
                      `Could not analyze ${item.symbol}.`,
                    );
                  }


                  return (
                    await response.json()
                  ) as DashboardMarket;
                },
              ),
            );


          if (cancelled) {
            return;
          }


          const successful =
            responses.flatMap(
              (
                result,
              ) =>
                result.status
                === "fulfilled"
                  ? [
                      result.value,
                    ]
                  : [],
            );


          setRadarMarkets(
            successful,
          );

        } catch {
          if (!cancelled) {
            setWatchlist(
              [],
            );

            setRadarMarkets(
              [],
            );
          }

        } finally {
          if (!cancelled) {
            setRadarLoading(
              false,
            );
          }
        }
      }


      void loadRadar();


      return () => {
        cancelled =
          true;
      };
    },
    [],
  );


  const results =
    useMemo<TradeResult[]>(
      () =>
        trades.map(
          (trade) => ({
            trade,
            pnl:
              calculatePnl(
                trade,
              ),
          }),
        ),
      [
        trades,
      ],
    );


  const tradingSummary =
    useMemo(
      () => {
        const netPnl =
          results.reduce(
            (
              total,
              result,
            ) =>
              total
              + result.pnl,
            0,
          );

        const winners =
          results.filter(
            (result) =>
              result.pnl > 0,
          );

        const winRate =
          results.length > 0
            ? (
                winners.length
                / results.length
              )
              * 100
            : 0;

        return {
          netPnl,
          winRate,
          trades:
            results.length,
        };
      },
      [
        results,
      ],
    );


  const recentTrades =
    useMemo(
      () =>
        [
          ...results,
        ]
          .sort(
            (a, b) =>
              new Date(
                b.trade.created_at,
              ).getTime()
              - new Date(
                a.trade.created_at,
              ).getTime(),
          )
          .slice(
            0,
            3,
          ),
      [
        results,
      ],
    );


  const topOpportunities =
    useMemo(
      () =>
        [
          ...(
            scannerResult
              ?.candidates
            ?? []
          ),
        ]
          .sort(
            (
              a,
              b,
            ) =>
              b.rank_score
              - a.rank_score,
          )
          .slice(
            0,
            3,
          ),
      [
        scannerResult,
      ],
    );


  const strongestOpportunity =
    topOpportunities[
      0
    ]
    ?? null;


  const marketPulse =
    useMemo(
      () => {
        if (
          marketOverview.length
          === 0
        ) {
          return null;
        }


        const positive =
          marketOverview.filter(
            (
              market,
            ) =>
              market.change_percent
              > 0,
          ).length;


        const negative =
          marketOverview.filter(
            (
              market,
            ) =>
              market.change_percent
              < 0,
          ).length;


        const averageChange =
          marketOverview.reduce(
            (
              total,
              market,
            ) =>
              total
              + market.change_percent,
            0,
          )
          / marketOverview.length;


        const averageTrend =
          marketOverview.reduce(
            (
              total,
              market,
            ) =>
              total
              + market.trend_score,
            0,
          )
          / marketOverview.length;


        let title =
          "Major indexes are mixed.";

        let description =
          "Broad-market benchmarks are moving in different directions. Select an index below for deeper technical context.";


        if (
          positive
          === marketOverview.length
        ) {
          title =
            "Major indexes are moving higher.";

          description =
            "SPY, QQQ and DIA are all positive in the latest available market data. The broad tape is showing coordinated strength.";
        } else if (
          negative
          === marketOverview.length
        ) {
          title =
            "Major indexes are moving lower.";

          description =
            "SPY, QQQ and DIA are all negative in the latest available market data. Broad-market pressure is visible across the benchmarks.";
        } else if (
          averageChange
          > 0.25
        ) {
          title =
            "The broad market has a positive lean.";

          description =
            "The major benchmarks are mixed, but their average move is positive. Open Market Analysis for the underlying technical structure.";
        } else if (
          averageChange
          < -0.25
        ) {
          title =
            "The broad market has a negative lean.";

          description =
            "The major benchmarks are mixed, but their average move is negative. Open Market Analysis for the underlying technical structure.";
        }


        return {
          title,
          description,
          positive,
          negative,
          averageChange,
          averageTrend,
        };
      },
      [
        marketOverview,
      ],
    );


  const firstName =
    user
      ?.name
      ?.split(" ")[0]
    || "Trader";


  return (
    <div className="flex min-h-screen text-white">

      <Sidebar
        active="Dashboard"
      />


      <main className="min-w-0 flex-1">

        <PageSectionNav
          sections={
            DASHBOARD_SECTIONS
          }
        />


        <div className="mx-auto w-full max-w-[1540px] px-5 pb-16 pt-9 sm:px-7 lg:px-10 lg:pb-24 lg:pt-12">

          {/* ===============================================
              GREETING
          =============================================== */}

          <section
            id="today"
            className="scroll-mt-28"
          >

            <div className="flex flex-col gap-6 border-b border-white/5 pb-9 xl:flex-row xl:items-end xl:justify-between">

              <div className="max-w-3xl">

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Your market workspace
                </p>


                <h1 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                  {getGreeting()},{" "}
                  {firstName}.
                </h1>


                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-zinc-500">
                  Start with what matters.
                  A-Trader keeps the deeper
                  data available when you
                  want it.
                </p>

              </div>


              <div className="flex flex-wrap items-center gap-2">

                <Link
                  href="/scanner"
                  className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                >
                  Open scanner
                </Link>


                <Link
                  href="/market"
                  className="at-marble rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-95"
                >
                  Analyze market
                </Link>

              </div>

            </div>


            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}


            {/* =============================================
                PRIMARY ATTENTION AREA
            ============================================= */}

            <div className="mt-8">

              <div className="at-surface-raised overflow-hidden rounded-[28px]">

                <div className="grid items-start lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">

                  {/* =======================================
                      MARKET INTELLIGENCE
                  ======================================= */}

                  <div className="flex flex-col p-7 sm:p-8 lg:p-9">

                    <div className="flex flex-wrap items-center gap-3">

                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                        Market pulse
                      </span>


                      <span className="flex items-center gap-2 text-xs text-zinc-600">

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            marketLoading
                              ? "bg-zinc-500"
                              : "bg-emerald-400"
                          }`}
                        />

                        {
                          marketLoading
                            ? "Reading markets"
                            : "Live workspace"
                        }

                      </span>

                    </div>


                    <div className="mt-6">

                      <h2 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-[2.45rem]">

                        {
                          marketLoading
                            ? "Reading the broad market…"
                            : marketPulse
                              ?.title
                              ?? "Your market workspace is ready."
                        }

                      </h2>


                      <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400">

                        {
                          marketLoading
                            ? "A-Trader is analyzing SPY, QQQ and DIA to build the current market picture."
                            : marketPulse
                              ?.description
                              ?? "Market context is temporarily unavailable, but your scanner, journal and analysis tools remain ready."
                        }

                      </p>

                    </div>


                    {/* =====================================
                        LIVE SIGNAL STRIP
                    ===================================== */}

                    <div className="mt-7">

                      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                        Live A-Trader intelligence
                      </p>

                      <div className="grid overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35 sm:grid-cols-3">

                        {/* MARKET */}

                        <div className="p-4 sm:p-5">

                          <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-zinc-700">
                            Market
                          </p>


                          <p className="mt-2 text-base font-semibold text-zinc-200">

                            {
                              marketLoading
                                ? "Analyzing"
                                : marketPulse
                                  ? `${marketPulse.positive}/${marketOverview.length} higher`
                                  : "Unavailable"
                            }

                          </p>


                          <p
                            className={`mt-1 text-xs font-medium ${
                              marketPulse
                              && marketPulse.averageChange > 0
                                ? "text-emerald-400"
                                : marketPulse
                                && marketPulse.averageChange < 0
                                  ? "text-red-400"
                                  : "text-zinc-600"
                            }`}
                          >

                            {
                              marketPulse
                                ? `${marketPulse.averageChange >= 0 ? "+" : ""}${marketPulse.averageChange.toFixed(
                                    2,
                                  )}% benchmark average`
                                : "Broad market context"
                            }

                          </p>

                        </div>


                        {/* SCANNER */}

                        <div className="border-t border-white/[0.07] p-4 sm:border-l sm:border-t-0 sm:p-5">

                          <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-zinc-700">
                            Scanner
                          </p>


                          <p className="mt-2 text-base font-semibold text-zinc-200">
                            {
                              scannerLoading
                                ? "Checking"
                                : scannerResult
                                  ? `${scannerResult.scanned} analyzed`
                                  : "Ready"
                            }
                          </p>


                          <p className="mt-1 text-xs text-zinc-700">
                            {
                              scannerLoading
                                ? "Reading latest scan"
                                : scannerResult
                                  ? `${scannerResult.matched} matched current criteria`
                                  : "Run a scan to surface setups"
                            }
                          </p>

                        </div>


                        {/* PERSONAL */}

                        <div className="border-t border-white/[0.07] p-4 sm:border-l sm:border-t-0 sm:p-5">

                          <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-zinc-700">
                            Your trading
                          </p>


                          <p
                            className={`mt-2 text-base font-semibold ${
                              tradingSummary.netPnl > 0
                                ? "text-emerald-400"
                                : tradingSummary.netPnl < 0
                                  ? "text-red-400"
                                  : "text-zinc-200"
                            }`}
                          >
                            {formatMoney(
                              tradingSummary.netPnl,
                            )}
                          </p>


                          <p className="mt-1 text-xs text-zinc-700">
                            {tradingSummary.trades} logged{" "}
                            {tradingSummary.trades === 1
                              ? "trade"
                              : "trades"}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* =====================================
                        TODAY'S FOCUS
                    ===================================== */}

                    {
                      strongestOpportunity
                      && (
                        <div className="mt-7 border-t border-white/[0.06] pt-6">

                          <div className="flex items-center justify-between gap-4">

                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                              Today&apos;s focus
                            </p>


                            <span className="flex items-center gap-2 text-[10px] font-medium text-emerald-400">

                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                              {
                                strongestOpportunity.action_state
                              }

                            </span>

                          </div>


                          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">

                                <p className="text-2xl font-semibold tracking-[-0.03em] text-white">
                                  {
                                    strongestOpportunity.symbol
                                  }
                                </p>


                                <p className="text-sm text-zinc-500">
                                  {
                                    strongestOpportunity.trade_horizon
                                  }
                                  {" · "}
                                  {
                                    strongestOpportunity.reward_risk_ratio.toFixed(
                                      2,
                                    )
                                  }
                                  :1 R/R
                                </p>

                              </div>


                              <div className="mt-2 flex flex-wrap items-center gap-3">

                                <p className="text-sm font-semibold text-emerald-400">
                                  {
                                    strongestOpportunity.opportunity_score
                                  }
                                  /100 opportunity
                                </p>

                                <span className="h-1 w-1 rounded-full bg-zinc-700" />

                                <p className="text-xs text-zinc-600">
                                  Highest-ranked current setup
                                </p>

                              </div>


                              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">

                                {
                                  strongestOpportunity.reasons[
                                    0
                                  ]
                                  ?? `A-Trader ranked ${strongestOpportunity.symbol} as the strongest current setup in the latest scan.`
                                }

                              </p>

                            </div>


                            <Link
                              href={`/market?symbol=${encodeURIComponent(
                                strongestOpportunity.symbol,
                              )}`}
                              className="shrink-0 text-sm font-semibold text-zinc-300 transition hover:text-white"
                            >
                              View setup →
                            </Link>

                          </div>

                        </div>
                      )
                    }

                  </div>


                  {/* =======================================
                      A-TRADER TODAY
                  ======================================= */}

                  <div className="border-t border-white/5 bg-white/[0.018] p-7 lg:self-stretch lg:border-l lg:border-t-0 lg:p-8">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-zinc-600">
                        A-Trader today
                      </p>


                      <h3 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-white">
                        Your workspace is active.
                      </h3>


                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        Start with what deserves attention, then go deeper only when you need to.
                      </p>

                    </div>


                    <div className="mt-5 space-y-2.5">

                      {/* TOP SETUP */}

                      <Link
                        href={
                          strongestOpportunity
                            ? `/market?symbol=${encodeURIComponent(
                                strongestOpportunity.symbol,
                              )}`
                            : "/scanner"
                        }
                        className="group block rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3.5 transition hover:border-white/[0.13] hover:bg-white/[0.025]"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                              Scanner
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-200">

                              {
                                scannerLoading
                                  ? "Checking latest results"
                                  : scannerResult
                                    ? `${scannerResult.scanned} symbols analyzed`
                                    : "Discover opportunities"
                              }

                            </p>

                          </div>


                          <span className="text-sm text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400">
                            →
                          </span>

                        </div>


                        <p className="mt-2 text-xs leading-5 text-zinc-600">

                          {
                            strongestOpportunity
                              ? `${strongestOpportunity.trade_horizon} · ${strongestOpportunity.action_state} · ${strongestOpportunity.reward_risk_ratio.toFixed(
                                  2,
                                )}:1 reward/risk`
                              : "Scan the market and surface the strongest technical setups."
                          }

                        </p>

                      </Link>


                      {/* MARKET */}

                      <Link
                        href="/market"
                        className="group block rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3.5 transition hover:border-white/[0.13] hover:bg-white/[0.025]"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                              Market analysis
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-200">
                              Understand the move
                            </p>

                          </div>


                          <span className="text-sm text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400">
                            →
                          </span>

                        </div>


                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          Open charts, setup quality, technical levels and market structure.
                        </p>

                      </Link>


                      {/* JOURNAL */}

                      <Link
                        href="/journal"
                        className="group block rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3.5 transition hover:border-white/[0.13] hover:bg-white/[0.025]"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                              Journal
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-200">

                              {
                                recentTrades.length > 0
                                  ? "Review your latest trade"
                                  : "Start building your history"
                              }

                            </p>

                          </div>


                          <span className="text-sm text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400">
                            →
                          </span>

                        </div>


                        <p className="mt-2 text-xs leading-5 text-zinc-600">

                          {
                            recentTrades.length > 0
                              ? `${recentTrades[0].trade.symbol} is your most recent journal entry.`
                              : "Log trades so A-Trader can turn activity into useful personal context."
                          }

                        </p>

                      </Link>

                    </div>




                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ===============================================
              MARKETS
          =============================================== */}

          <section
            id="markets"
            className="scroll-mt-28 pt-10"
          >

            <SectionHeader
              eyebrow="Markets"
              title="Know what is happening."
              description="A clean market view first. Deeper analysis stays one click away."
              action={
                <Link
                  href="/market"
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Market analysis →
                </Link>
              }
            />


            <div className="mt-6 grid gap-4 lg:grid-cols-3">

              {marketLoading ? (
                <>
                  <MarketLoadingCard />
                  <MarketLoadingCard />
                  <MarketLoadingCard />
                </>
              ) : marketOverview.length === 0 ? (
                <div className="at-surface rounded-[22px] p-6 lg:col-span-3">

                  <p className="text-sm text-zinc-500">
                    Broad-market data is temporarily unavailable.
                  </p>

                </div>
              ) : (
                marketOverview.map(
                  (
                    market,
                  ) => (
                    <MarketCard
                      key={
                        market.symbol
                      }

                      market={
                        market
                      }
                    />
                  ),
                )
              )}

            </div>


            <div className="mt-8">

              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Your radar
                  </p>


                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">
                    Markets you are watching
                  </h3>

                </div>


                <Link
                  href="/market"
                  className="text-xs font-medium text-zinc-500 transition hover:text-white"
                >
                  Add from Market →
                </Link>

              </div>


              {
                radarLoading
                  ? (
                      <div className="at-surface rounded-[22px] p-6">

                        <p className="text-sm text-zinc-600">
                          Loading your watchlist…
                        </p>

                      </div>
                    )

                  : watchlist.length === 0
                    ? (
                        <div className="at-surface rounded-[22px] p-6">

                          <p className="text-sm font-medium text-zinc-300">
                            Your radar is empty.
                          </p>


                          <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Analyze a symbol and press Watch to keep it here.
                          </p>

                        </div>
                      )

                    : radarMarkets.length === 0
                      ? (
                          <div className="at-surface rounded-[22px] p-6">

                            <p className="text-sm text-zinc-500">
                              Your watchlist is saved, but live analysis is temporarily unavailable.
                            </p>

                          </div>
                        )

                      : (
                          <div className="grid gap-4 lg:grid-cols-3">

                            {
                              radarMarkets.map(
                                (
                                  market,
                                ) => (
                                  <RadarCard
                                    key={
                                      market.symbol
                                    }

                                    market={
                                      market
                                    }
                                  />
                                ),
                              )
                            }

                          </div>
                        )
              }

            </div>

          </section>


          {/* ===============================================
              OPPORTUNITIES
          =============================================== */}

          <section
            id="opportunities"
            className="scroll-mt-28 pt-14"
          >

            <SectionHeader
              eyebrow="Discovery"
              title="Opportunities, not a data dump."
              description="The scanner does the heavy work. The dashboard only surfaces candidates worth looking at."
              action={
                <Link
                  href="/scanner"
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Open scanner →
                </Link>
              }
            />


            <div className="at-surface mt-6 overflow-hidden rounded-[24px]">

              {scannerLoading ? (

                <div className="flex min-h-[190px] items-center p-7 sm:p-8">

                  <p className="text-sm text-zinc-600">
                    Checking your latest scanner results…
                  </p>

                </div>

              ) : topOpportunities.length === 0 ? (

                <div className="flex min-h-[190px] flex-col justify-center p-7 sm:p-8">

                  <p className="text-lg font-medium text-white">
                    Your discovery engine is ready.
                  </p>


                  <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                    Run the scanner and your strongest candidates will surface here automatically.
                  </p>


                  <Link
                    href="/scanner"
                    className="mt-6 w-fit text-sm font-semibold text-white transition hover:text-zinc-300"
                  >
                    Run scanner →
                  </Link>

                </div>

              ) : (

                <div className="divide-y divide-white/5">

                  {topOpportunities.map(
                    (
                      candidate,
                      index,
                    ) => (

                      <Link
                        key={
                          candidate.symbol
                        }

                        href={`/market?symbol=${encodeURIComponent(
                          candidate.symbol,
                        )}`}

                        className="group grid gap-5 p-6 transition hover:bg-white/[0.018] sm:grid-cols-[50px_minmax(0,1fr)_auto] sm:items-center sm:px-8"
                      >

                        <div className="text-sm font-semibold text-zinc-700">
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </div>


                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <p className="text-lg font-semibold text-white">
                              {candidate.symbol}
                            </p>


                            <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                              {candidate.action_state}
                            </span>

                          </div>


                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600">

                            <span>
                              {candidate.trade_horizon}
                            </span>


                            <span>
                              {candidate.risk_level} risk
                            </span>


                            <span>
                              R:R {candidate.reward_risk_ratio.toFixed(
                                2,
                              )}
                            </span>

                          </div>

                        </div>


                        <div className="sm:text-right">

                          <p className="text-2xl font-semibold tracking-[-0.03em] text-white">
                            {candidate.opportunity_score}
                          </p>


                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                            Opportunity
                          </p>


                          <p
                            className={`mt-2 text-xs font-medium ${
                              candidate.change_percent > 0
                                ? "text-emerald-400"
                                : candidate.change_percent < 0
                                  ? "text-red-400"
                                  : "text-zinc-500"
                            }`}
                          >
                            {candidate.change_percent > 0
                              ? "+"
                              : ""}

                            {candidate.change_percent.toFixed(
                              2,
                            )}
                            %
                          </p>

                        </div>

                      </Link>

                    ),
                  )}

                </div>

              )}

            </div>

          </section>


          {/* ===============================================
              PERSONAL TRADING
          =============================================== */}

          <section
            id="trading"
            className="scroll-mt-28 pt-14"
          >

            <SectionHeader
              eyebrow="Your trading"
              title="Personal insight, when useful."
              description="Deep statistics belong in Analytics. Your dashboard keeps the personal picture concise."
              action={
                <Link
                  href="/analytics"
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Full analytics →
                </Link>
              }
            />


            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">

              <div className="at-surface rounded-[24px] p-7 sm:p-8">

                {loading ? (
                  <TradingLoading />
                ) : tradingSummary.trades === 0 ? (
                  <div className="flex min-h-[190px] flex-col justify-center">

                    <p className="text-lg font-medium text-white">
                      Your journal is ready.
                    </p>


                    <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                      Log trades consistently
                      and A-Trader will surface
                      useful personal patterns
                      here when they become
                      meaningful.
                    </p>


                    <Link
                      href="/journal"
                      className="mt-6 w-fit text-sm font-semibold text-white transition hover:text-zinc-300"
                    >
                      Log your first trade →
                    </Link>

                  </div>
                ) : (
                  <>

                    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">

                      <div>

                        <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-zinc-600">
                          Journal snapshot
                        </p>


                        <p
                          className={`mt-3 text-4xl font-semibold tracking-[-0.04em] ${
                            tradingSummary.netPnl > 0
                              ? "text-emerald-400"
                              : tradingSummary.netPnl < 0
                                ? "text-red-400"
                                : "text-white"
                          }`}
                        >
                          {tradingSummary.netPnl > 0
                            ? "+"
                            : ""}

                          {formatMoney(
                            tradingSummary.netPnl,
                          )}
                        </p>


                        <p className="mt-2 text-sm text-zinc-500">
                          Across{" "}
                          {tradingSummary.trades}{" "}
                          logged trade
                          {tradingSummary.trades === 1
                            ? ""
                            : "s"}
                        </p>

                      </div>


                      <div className="grid grid-cols-2 gap-8 sm:text-right">

                        <div>

                          <p className="text-2xl font-semibold text-white">
                            {tradingSummary.winRate.toFixed(
                              1,
                            )}
                            %
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            Win rate
                          </p>

                        </div>


                        <div>

                          <p className="text-2xl font-semibold text-white">
                            {tradingSummary.trades}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            Trades
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="mt-8 border-t border-white/5 pt-6">

                      <p className="max-w-2xl text-sm leading-7 text-zinc-400">
                        A-Trader will eventually
                        use this space for the
                        single personal pattern
                        most worth your attention,
                        rather than repeating your
                        entire Analytics page.
                      </p>

                    </div>

                  </>
                )}

              </div>


              <div className="at-surface rounded-[24px] p-7 sm:p-8">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-zinc-600">
                      Recent
                    </p>


                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Latest activity
                    </h3>

                  </div>


                  <Link
                    href="/journal"
                    className="text-xs font-medium text-zinc-500 transition hover:text-white"
                  >
                    Journal →
                  </Link>

                </div>


                <div className="mt-6">

                  {loading ? (
                    <div className="space-y-3">
                      <LoadingLine />
                      <LoadingLine />
                      <LoadingLine />
                    </div>
                  ) : recentTrades.length === 0 ? (
                    <p className="text-sm leading-7 text-zinc-600">
                      No trades logged yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-white/5">

                      {recentTrades.map(
                        ({
                          trade,
                          pnl,
                        }) => (
                          <div
                            key={
                              trade.id
                            }
                            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                          >

                            <div>

                              <p className="text-sm font-semibold text-zinc-200">
                                {trade.symbol}
                              </p>


                              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-zinc-600">
                                {trade.direction}
                              </p>

                            </div>


                            <p
                              className={`text-sm font-semibold ${
                                pnl > 0
                                  ? "text-emerald-400"
                                  : pnl < 0
                                    ? "text-red-400"
                                    : "text-zinc-300"
                              }`}
                            >
                              {pnl > 0
                                ? "+"
                                : ""}

                              {formatMoney(
                                pnl,
                              )}
                            </p>

                          </div>
                        ),
                      )}

                    </div>
                  )}

                </div>

              </div>

            </div>

          </section>


          {/* ===============================================
              FOOTER ACTION
          =============================================== */}

          <div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-t border-white/5 pt-7">

            <p className="text-xs text-zinc-700">
              A-Trader surfaces what matters.
              The details stay available when
              you need them.
            </p>


            <Link
              href="/journal"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              + Log trade
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

      <div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          {eyebrow}
        </p>


        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">
          {title}
        </h2>


        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {description}
        </p>

      </div>


      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}

    </div>
  );
}


/* =========================================================
   SIGNAL ROW
========================================================= */

function SignalRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-700">
        {label}
      </p>


      <p className="mt-1.5 text-sm font-medium text-zinc-300">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   RADAR CARD
========================================================= */

function RadarCard({
  market,
}: {
  market: DashboardMarket;
}) {
  const positive =
    market.change_percent > 0;

  const negative =
    market.change_percent < 0;


  return (
    <Link
      href={`/market?symbol=${encodeURIComponent(
        market.symbol,
      )}`}

      className="at-surface group rounded-[22px] p-6 transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.025]"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Watching
          </p>


          <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
            {market.symbol}
          </h3>

        </div>


        <p
          className={`text-sm font-semibold ${
            positive
              ? "text-emerald-400"
              : negative
                ? "text-red-400"
                : "text-zinc-400"
          }`}
        >
          {positive ? "+" : ""}

          {market.change_percent.toFixed(
            2,
          )}
          %
        </p>

      </div>


      <div className="mt-5 flex items-end justify-between gap-4">

        <p className="text-2xl font-semibold tracking-[-0.03em] text-zinc-100">
          $
          {market.price.toLocaleString(
            "en-CA",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </p>


        <p className="text-xs font-medium text-zinc-500">
          {market.opportunity_score}/100
        </p>

      </div>


      <div className="mt-5 flex flex-wrap gap-2">

        <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-400">
          {market.signal}
        </span>


        <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
          {market.trade_horizon}
        </span>


        <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
          RSI {market.rsi.toFixed(0)}
        </span>

      </div>


      <div className="mt-6 border-t border-white/5 pt-4">

        <p className="text-xs font-medium text-zinc-600 transition group-hover:text-zinc-400">
          Open analysis →
        </p>

      </div>

    </Link>
  );
}


/* =========================================================
   MARKET CARD
========================================================= */

function MarketCard({
  market,
}: {
  market: DashboardMarket;
}) {
  const positive =
    market.change_percent > 0;

  const negative =
    market.change_percent < 0;


  return (
    <Link
      href={`/market?symbol=${encodeURIComponent(
        market.symbol,
      )}`}

      className="at-surface group flex min-h-[210px] flex-col rounded-[22px] p-6 transition duration-300 hover:border-white/[0.12] hover:bg-white/[0.025]"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Benchmark
          </p>


          <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
            {market.symbol}
          </h3>

        </div>


        <p
          className={`text-sm font-semibold ${
            positive
              ? "text-emerald-400"
              : negative
                ? "text-red-400"
                : "text-zinc-400"
          }`}
        >
          {
            positive
              ? "+"
              : ""
          }

          {market.change_percent.toFixed(
            2,
          )}
          %
        </p>

      </div>


      <p className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-zinc-100">
        $
        {market.price.toLocaleString(
          "en-CA",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}
      </p>


      <div className="mt-4 flex flex-wrap gap-2">

        <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-400">
          {market.signal}
        </span>


        <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-zinc-500">
          RSI{" "}
          {market.rsi.toFixed(
            0,
          )}
        </span>

      </div>


      <div className="mt-auto flex items-end justify-between gap-4 pt-7">

        <div>

          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-700">
            5 day
          </p>


          <p className="mt-1 text-xs font-medium text-zinc-400">
            {
              market.performance_5d_percent
              > 0
                ? "+"
                : ""
            }

            {market.performance_5d_percent.toFixed(
              2,
            )}
            %
          </p>

        </div>


        <span className="text-xs font-medium text-zinc-600 transition group-hover:text-zinc-300">
          Analyze →
        </span>

      </div>

    </Link>
  );
}


function MarketLoadingCard() {
  return (
    <div className="at-surface min-h-[210px] animate-pulse rounded-[22px] p-6">

      <div className="h-2.5 w-20 rounded-full bg-white/[0.05]" />

      <div className="mt-5 h-6 w-16 rounded-lg bg-white/[0.055]" />

      <div className="mt-5 h-8 w-28 rounded-lg bg-white/[0.05]" />

      <div className="mt-8 h-3 w-36 rounded-full bg-white/[0.035]" />

    </div>
  );
}


/* =========================================================
   WORKSPACE CARD
========================================================= */

function WorkspaceCard({
  label,
  title,
  description,
  footer,
}: {
  label: string;
  title: string;
  description: string;
  footer: string;
}) {
  return (
    <div className="at-surface group flex min-h-[210px] flex-col rounded-[22px] p-6 transition duration-300 hover:border-white/[0.12]">

      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>


      <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-zinc-100">
        {title}
      </h3>


      <p className="mt-3 text-sm leading-6 text-zinc-500">
        {description}
      </p>


      <p className="mt-auto pt-7 text-[11px] text-zinc-700">
        {footer}
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function TradingLoading() {
  return (
    <div className="flex min-h-[190px] animate-pulse flex-col justify-center">

      <div className="h-3 w-28 rounded-full bg-white/[0.05]" />

      <div className="mt-5 h-10 w-44 rounded-xl bg-white/[0.055]" />

      <div className="mt-4 h-3 w-64 max-w-full rounded-full bg-white/[0.04]" />

    </div>
  );
}


function LoadingLine() {
  return (
    <div className="h-14 animate-pulse rounded-xl bg-white/[0.025]" />
  );
}
