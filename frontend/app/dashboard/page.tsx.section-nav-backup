"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";

import { api } from "@/lib/api";


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


type Tone =
  | "positive"
  | "negative"
  | "neutral";


type DateRange =
  | "7D"
  | "30D"
  | "3M"
  | "1Y"
  | "ALL";


type DashboardStat = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};


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
      style:
        "currency",

      currency:
        "CAD",

      minimumFractionDigits:
        2,
    },
  ).format(
    value,
  );
}


function getStrategyName(
  trade: Trade,
) {
  if (
    trade.strategy === "Custom"
    && trade.custom_strategy
      ?.trim()
  ) {
    return trade
      .custom_strategy
      .trim();
  }

  return (
    trade.strategy
    || "Unspecified"
  );
}


function toneFromNumber(
  value: number,
): Tone {
  if (
    value > 0
  ) {
    return "positive";
  }

  if (
    value < 0
  ) {
    return "negative";
  }

  return "neutral";
}


function getToneClass(
  tone: Tone,
) {
  if (
    tone === "positive"
  ) {
    return "text-emerald-400";
  }

  if (
    tone === "negative"
  ) {
    return "text-red-400";
  }

  return "text-white";
}


function filterByDateRange(
  trades: Trade[],
  range: DateRange,
) {
  if (
    range === "ALL"
  ) {
    return trades;
  }

  const now =
    new Date();

  const start =
    new Date(
      now,
    );


  if (
    range === "7D"
  ) {
    start.setDate(
      now.getDate()
      - 7,
    );
  }


  if (
    range === "30D"
  ) {
    start.setDate(
      now.getDate()
      - 30,
    );
  }


  if (
    range === "3M"
  ) {
    start.setMonth(
      now.getMonth()
      - 3,
    );
  }


  if (
    range === "1Y"
  ) {
    start.setFullYear(
      now.getFullYear()
      - 1,
    );
  }


  return trades.filter(
    (
      trade,
    ) =>
      new Date(
        trade.created_at,
      )
      >= start,
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function Dashboard() {
  const [
    trades,
    setTrades,
  ] = useState<
    Trade[]
  >(
    [],
  );


  const [
    user,
    setUser,
  ] = useState<
    User | null
  >(
    null,
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  const [
    dateRange,
    setDateRange,
  ] = useState<
    DateRange
  >(
    "ALL",
  );


  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(
    () => {
      async function loadDashboard() {
        try {
          setLoading(
            true,
          );

          setError(
            "",
          );


          const [
            tradesResponse,
            userResponse,
          ] =
            await Promise.all([
              api(
                "/trades",
              ),

              api(
                "/auth/me",
              ),
            ]);


          if (
            !tradesResponse.ok
          ) {
            throw new Error(
              "Could not load dashboard data.",
            );
          }


          const tradeData:
            Trade[] =
            await tradesResponse
              .json();


          setTrades(
            tradeData,
          );


          if (
            userResponse.ok
          ) {
            const userData:
              User =
              await userResponse
                .json();

            setUser(
              userData,
            );
          }

        } catch (
          err
        ) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong.",
          );

        } finally {
          setLoading(
            false,
          );
        }
      }


      void loadDashboard();
    },
    [],
  );


  /* =======================================================
     DATE FILTER
  ======================================================= */

  const filteredTrades =
    useMemo(
      () =>
        filterByDateRange(
          trades,
          dateRange,
        ),
      [
        trades,
        dateRange,
      ],
    );


  /* =======================================================
     ANALYTICS
  ======================================================= */

  const analytics =
    useMemo(
      () => {
        const orderedTrades =
          [
            ...filteredTrades,
          ]
            .sort(
              (
                a,
                b,
              ) =>
                new Date(
                  a.created_at,
                ).getTime()
                - new Date(
                  b.created_at,
                ).getTime(),
            );


        const results =
          orderedTrades.map(
            (
              trade,
            ) => ({
              trade,

              pnl:
                calculatePnl(
                  trade,
                ),
            }),
          );


        const winners =
          results.filter(
            (
              result,
            ) =>
              result.pnl
              > 0,
          );


        const losers =
          results.filter(
            (
              result,
            ) =>
              result.pnl
              < 0,
          );


        const breakeven =
          results.filter(
            (
              result,
            ) =>
              result.pnl
              === 0,
          );


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


        const grossProfit =
          winners.reduce(
            (
              total,
              result,
            ) =>
              total
              + result.pnl,
            0,
          );


        const grossLoss =
          Math.abs(
            losers.reduce(
              (
                total,
                result,
              ) =>
                total
                + result.pnl,
              0,
            ),
          );


        const winRate =
          results.length
          > 0
            ? (
                winners.length
                / results.length
              )
              * 100
            : 0;


        const lossRate =
          results.length
          > 0
            ? (
                losers.length
                / results.length
              )
              * 100
            : 0;


        const averagePnl =
          results.length
          > 0
            ? netPnl
              / results.length
            : 0;


        const averageWinner =
          winners.length
          > 0
            ? grossProfit
              / winners.length
            : 0;


        const averageLoser =
          losers.length
          > 0
            ? grossLoss
              / losers.length
            : 0;


        const expectancy =
          (
            winRate
            / 100
          )
          * averageWinner
          - (
            lossRate
            / 100
          )
          * averageLoser;


        const profitFactor =
          grossLoss
          > 0
            ? grossProfit
              / grossLoss
            : null;


        const averageConfidence =
          filteredTrades.length
          > 0
            ? filteredTrades.reduce(
                (
                  total,
                  trade,
                ) =>
                  total
                  + trade.confidence,
                0,
              )
              / filteredTrades.length
            : 0;


        const bestTrade =
          results.length
          > 0
            ? results.reduce(
                (
                  best,
                  current,
                ) =>
                  current.pnl
                  > best.pnl
                    ? current
                    : best,
              )
            : null;


        const worstTrade =
          results.length
          > 0
            ? results.reduce(
                (
                  worst,
                  current,
                ) =>
                  current.pnl
                  < worst.pnl
                    ? current
                    : worst,
              )
            : null;


        /* =================================================
           DIRECTION STATS
        ================================================= */

        function getDirectionStats(
          direction:
            | "long"
            | "short",
        ) {
          const directionResults =
            results.filter(
              (
                result,
              ) =>
                result.trade.direction
                  .toLowerCase()
                === direction,
            );


          const directionWins =
            directionResults.filter(
              (
                result,
              ) =>
                result.pnl
                > 0,
            );


          const directionPnl =
            directionResults.reduce(
              (
                total,
                result,
              ) =>
                total
                + result.pnl,
              0,
            );


          const directionAverage =
            directionResults.length
            > 0
              ? directionPnl
                / directionResults.length
              : 0;


          return {
            trades:
              directionResults.length,

            wins:
              directionWins.length,

            pnl:
              directionPnl,

            averagePnl:
              directionAverage,

            winRate:
              directionResults.length
              > 0
                ? (
                    directionWins.length
                    / directionResults.length
                  )
                  * 100
                : 0,
          };
        }


        const longStats =
          getDirectionStats(
            "long",
          );


        const shortStats =
          getDirectionStats(
            "short",
          );


        /* =================================================
           CURRENT STREAK
        ================================================= */

        let currentStreak =
          0;


        let currentStreakType:
          | "win"
          | "loss"
          | "breakeven"
          | null =
          null;


        if (
          results.length
          > 0
        ) {
          const latest =
            results[
              results.length
              - 1
            ];


          currentStreakType =
            latest.pnl
            > 0
              ? "win"
              : latest.pnl
                < 0
                ? "loss"
                : "breakeven";


          for (
            let index =
              results.length
              - 1;
            index
            >= 0;
            index -=
              1
          ) {
            const result =
              results[
                index
              ];


            const type =
              result.pnl
              > 0
                ? "win"
                : result.pnl
                  < 0
                  ? "loss"
                  : "breakeven";


            if (
              type
              !== currentStreakType
            ) {
              break;
            }


            currentStreak +=
              1;
          }
        }


        /* =================================================
           STRATEGIES
        ================================================= */

        const strategyMap =
          new Map<
            string,
            {
              trades: number;
              wins: number;
              losses: number;
              pnl: number;
              grossProfit: number;
              grossLoss: number;
            }
          >();


        results.forEach(
          ({
            trade,
            pnl,
          }) => {
            const name =
              getStrategyName(
                trade,
              );


            const current =
              strategyMap.get(
                name,
              )
              ?? {
                trades:
                  0,

                wins:
                  0,

                losses:
                  0,

                pnl:
                  0,

                grossProfit:
                  0,

                grossLoss:
                  0,
              };


            strategyMap.set(
              name,
              {
                trades:
                  current.trades
                  + 1,

                wins:
                  current.wins
                  + (
                    pnl
                    > 0
                      ? 1
                      : 0
                  ),

                losses:
                  current.losses
                  + (
                    pnl
                    < 0
                      ? 1
                      : 0
                  ),

                pnl:
                  current.pnl
                  + pnl,

                grossProfit:
                  current.grossProfit
                  + (
                    pnl
                    > 0
                      ? pnl
                      : 0
                  ),

                grossLoss:
                  current.grossLoss
                  + (
                    pnl
                    < 0
                      ? Math.abs(
                          pnl,
                        )
                      : 0
                  ),
              },
            );
          },
        );


        const strategies =
          Array.from(
            strategyMap
              .entries(),
          )
            .map(
              (
                [
                  name,
                  data,
                ],
              ) => {
                const strategyWinRate =
                  data.trades
                  > 0
                    ? (
                        data.wins
                        / data.trades
                      )
                      * 100
                    : 0;


                const strategyLossRate =
                  data.trades
                  > 0
                    ? (
                        data.losses
                        / data.trades
                      )
                      * 100
                    : 0;


                const averageWin =
                  data.wins
                  > 0
                    ? data.grossProfit
                      / data.wins
                    : 0;


                const averageLoss =
                  data.losses
                  > 0
                    ? data.grossLoss
                      / data.losses
                    : 0;


                const strategyExpectancy =
                  (
                    strategyWinRate
                    / 100
                  )
                  * averageWin
                  - (
                    strategyLossRate
                    / 100
                  )
                  * averageLoss;


                return {
                  name,

                  trades:
                    data.trades,

                  wins:
                    data.wins,

                  losses:
                    data.losses,

                  pnl:
                    data.pnl,

                  winRate:
                    strategyWinRate,

                  expectancy:
                    strategyExpectancy,
                };
              },
            )
            .sort(
              (
                a,
                b,
              ) =>
                b.expectancy
                - a.expectancy,
            );


        /* =================================================
           TAGS
        ================================================= */

        const tagMap =
          new Map<
            string,
            {
              trades: number;
              wins: number;
              pnl: number;
            }
          >();


        results.forEach(
          ({
            trade,
            pnl,
          }) => {
            const tags =
              trade.tags
              ?? [];


            tags.forEach(
              (
                tag,
              ) => {
                const current =
                  tagMap.get(
                    tag,
                  )
                  ?? {
                    trades:
                      0,

                    wins:
                      0,

                    pnl:
                      0,
                  };


                tagMap.set(
                  tag,
                  {
                    trades:
                      current.trades
                      + 1,

                    wins:
                      current.wins
                      + (
                        pnl
                        > 0
                          ? 1
                          : 0
                      ),

                    pnl:
                      current.pnl
                      + pnl,
                  },
                );
              },
            );
          },
        );


        const tags =
          Array.from(
            tagMap
              .entries(),
          )
            .map(
              (
                [
                  name,
                  data,
                ],
              ) => ({
                name,

                trades:
                  data.trades,

                pnl:
                  data.pnl,

                averagePnl:
                  data.trades
                  > 0
                    ? data.pnl
                      / data.trades
                    : 0,

                winRate:
                  data.trades
                  > 0
                    ? (
                        data.wins
                        / data.trades
                      )
                      * 100
                    : 0,
              }),
            )
            .sort(
              (
                a,
                b,
              ) =>
                b.averagePnl
                - a.averagePnl,
            );


        return {
          results,
          winners,
          losers,
          breakeven,

          netPnl,
          grossProfit,
          grossLoss,

          winRate,
          lossRate,

          averagePnl,
          averageWinner,
          averageLoser,

          expectancy,
          profitFactor,
          averageConfidence,

          bestTrade,
          worstTrade,

          longStats,
          shortStats,

          currentStreak,
          currentStreakType,

          strategies,
          tags,

          bestStrategy:
            strategies[
              0
            ]
            ?? null,

          worstStrategy:
            strategies.length
            > 1
              ? strategies[
                  strategies.length
                  - 1
                ]
              : null,

          bestTag:
            tags[
              0
            ]
            ?? null,

          worstTag:
            tags.length
            > 1
              ? tags[
                  tags.length
                  - 1
                ]
              : null,
        };
      },
      [
        filteredTrades,
      ],
    );


  /* =======================================================
     EQUITY CURVE
  ======================================================= */

  const equityCurve =
    useMemo(
      () => {
        let runningTotal =
          0;


        return analytics.results.map(
          (
            result,
            index,
          ) => {
            runningTotal +=
              result.pnl;


            return {
              trade:
                index
                + 1,

              equity:
                Number(
                  runningTotal
                    .toFixed(
                      2,
                    ),
                ),

              pnl:
                Number(
                  result.pnl
                    .toFixed(
                      2,
                    ),
                ),

              symbol:
                result.trade
                  .symbol,

              date:
                result.trade
                  .created_at,
            };
          },
        );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     RECENT TRADES
  ======================================================= */

  const recentTrades =
    useMemo(
      () =>
        [
          ...analytics.results,
        ]
          .sort(
            (
              a,
              b,
            ) =>
              new Date(
                b.trade
                  .created_at,
              ).getTime()
              - new Date(
                a.trade
                  .created_at,
              ).getTime(),
          )
          .slice(
            0,
            5,
          ),
      [
        analytics.results,
      ],
    );


  const firstName =
    user
      ?.name
      ?.split(
        " ",
      )[
        0
      ]
    || "Trader";


  /* =======================================================
     MAIN METRICS
  ======================================================= */

  const stats:
    DashboardStat[] = [
      {
        label:
          "Net P&L",

        value:
          formatMoney(
            analytics.netPnl,
          ),

        detail:
          `${analytics.results.length} trade${analytics.results.length === 1 ? "" : "s"} in range`,

        tone:
          toneFromNumber(
            analytics.netPnl,
          ),
      },

      {
        label:
          "Win rate",

        value:
          `${analytics.winRate.toFixed(
            1,
          )}%`,

        detail:
          `${analytics.winners.length} wins · ${analytics.losers.length} losses`,

        tone:
          analytics.results.length
          === 0
            ? "neutral"
            : analytics.winRate
              >= 50
              ? "positive"
              : "negative",
      },

      {
        label:
          "Expectancy",

        value:
          formatMoney(
            analytics.expectancy,
          ),

        detail:
          "Expected result per trade",

        tone:
          toneFromNumber(
            analytics.expectancy,
          ),
      },

      {
        label:
          "Profit factor",

        value:
          analytics.profitFactor
          === null
            ? analytics.grossProfit
              > 0
              ? "∞"
              : "—"
            : analytics.profitFactor
                .toFixed(
                  2,
                ),

        detail:
          "Gross profit ÷ gross loss",

        tone:
          analytics.profitFactor
          === null
            ? "neutral"
            : analytics.profitFactor
              >= 1
              ? "positive"
              : "negative",
      },
    ];


  const secondaryStats:
    DashboardStat[] = [
      {
        label:
          "Average winner",

        value:
          formatMoney(
            analytics.averageWinner,
          ),

        detail:
          "Average profitable trade",

        tone:
          analytics.averageWinner
          > 0
            ? "positive"
            : "neutral",
      },

      {
        label:
          "Average loser",

        value:
          analytics.averageLoser
          > 0
            ? `-${formatMoney(
                analytics.averageLoser,
              )}`
            : formatMoney(
                0,
              ),

        detail:
          "Average losing trade",

        tone:
          analytics.averageLoser
          > 0
            ? "negative"
            : "neutral",
      },

      {
        label:
          "Average trade",

        value:
          formatMoney(
            analytics.averagePnl,
          ),

        detail:
          "Average P&L per trade",

        tone:
          toneFromNumber(
            analytics.averagePnl,
          ),
      },

      {
        label:
          "Current streak",

        value:
          analytics.currentStreak
          > 0
            ? `${analytics.currentStreak} ${
                analytics.currentStreakType
                === "win"
                  ? "W"
                  : analytics.currentStreakType
                    === "loss"
                    ? "L"
                    : "BE"
              }`
            : "—",

        detail:
          analytics.currentStreakType
          === "win"
            ? "Winning streak"
            : analytics.currentStreakType
              === "loss"
              ? "Losing streak"
              : analytics.currentStreakType
                === "breakeven"
                ? "Breakeven streak"
                : "No streak yet",

        tone:
          analytics.currentStreakType
          === "win"
            ? "positive"
            : analytics.currentStreakType
              === "loss"
              ? "negative"
              : "neutral",
      },
    ];


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Dashboard"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1600px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Trading overview"

            title={`${firstName}'s dashboard`}

            description="Track your trading performance, monitor execution quality, identify your strongest setups and find the areas that need the most attention."

            actions={
              <>
                <Link
                  href="/replay"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                >
                  Practice replay
                </Link>


                <Link
                  href="/analytics"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                >
                  Full analytics
                </Link>


                <Link
                  href="/journal"
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  + Log trade
                </Link>
              </>
            }

            status={
              <StatusBadge
                tone="positive"
                dot
              >
                Journal connected
              </StatusBadge>
            }
          />


          {error && (
            <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
              {error}
            </div>
          )}


          {loading ? (
            <DashboardLoading />
          ) : (
            <div className="space-y-8">

              {/* ===========================================
                  DATE RANGE
              =========================================== */}

              <Card
                padding="sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm font-medium text-zinc-200">
                      Performance period
                    </p>


                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      All performance statistics update using the selected date range.
                    </p>

                  </div>


                  <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-900 bg-black p-1">

                    {(
                      [
                        "7D",
                        "30D",
                        "3M",
                        "1Y",
                        "ALL",
                      ] as DateRange[]
                    ).map(
                      (
                        range,
                      ) => (
                        <button
                          key={
                            range
                          }

                          type="button"

                          onClick={() =>
                            setDateRange(
                              range,
                            )
                          }

                          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                            dateRange
                            === range
                              ? "bg-zinc-100 text-black"
                              : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                          }`}
                        >
                          {range}
                        </button>
                      ),
                    )}

                  </div>

                </div>
              </Card>


              {/* ===========================================
                  PRIMARY METRICS
              =========================================== */}

              <section>

                <SectionHeading
                  eyebrow="Performance"
                  title="Trading performance"
                  description="The most important statistics from your selected period."
                />


                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {stats.map(
                    (
                      stat,
                    ) => (
                      <MetricCard
                        key={
                          stat.label
                        }

                        label={
                          stat.label
                        }

                        value={
                          <span
                            className={
                              getToneClass(
                                stat.tone,
                              )
                            }
                          >
                            {
                              stat.value
                            }
                          </span>
                        }

                        detail={
                          stat.detail
                        }
                      />
                    ),
                  )}

                </div>

              </section>


              {/* ===========================================
                  SECONDARY METRICS
              =========================================== */}

              <section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {secondaryStats.map(
                    (
                      stat,
                    ) => (
                      <MetricCard
                        key={
                          stat.label
                        }

                        label={
                          stat.label
                        }

                        value={
                          <span
                            className={
                              getToneClass(
                                stat.tone,
                              )
                            }
                          >
                            {
                              stat.value
                            }
                          </span>
                        }

                        detail={
                          stat.detail
                        }
                      />
                    ),
                  )}

                </div>

              </section>


              {/* ===========================================
                  EQUITY + SNAPSHOT
              =========================================== */}

              <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

                <Card
                  title="Equity curve"

                  description="Cumulative realized P&L after every trade in the selected period."

                  action={
                    <div className="text-right">

                      <p
                        className={`text-xl font-semibold ${
                          analytics.netPnl
                          > 0
                            ? "text-emerald-400"
                            : analytics.netPnl
                              < 0
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {analytics.netPnl
                        > 0
                          ? "+"
                          : ""}

                        {formatMoney(
                          analytics.netPnl,
                        )}
                      </p>


                      <p className="mt-1 text-[11px] text-zinc-600">
                        Net realized
                      </p>

                    </div>
                  }
                >

                  {equityCurve.length
                  === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className="mt-2 h-80 w-full">

                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <LineChart
                          data={
                            equityCurve
                          }

                          margin={{
                            top:
                              10,

                            right:
                              20,

                            left:
                              0,

                            bottom:
                              0,
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#27272a"
                            vertical={
                              false
                            }
                          />


                          <XAxis
                            dataKey="trade"
                            stroke="#52525b"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={
                              11
                            }
                          />


                          <YAxis
                            stroke="#52525b"
                            tickLine={
                              false
                            }
                            axisLine={
                              false
                            }
                            fontSize={
                              11
                            }

                            tickFormatter={(
                              value,
                            ) =>
                              `$${value}`
                            }
                          />


                          <Tooltip
                            contentStyle={{
                              backgroundColor:
                                "#09090b",

                              border:
                                "1px solid #27272a",

                              borderRadius:
                                "12px",

                              boxShadow:
                                "0 15px 35px rgba(0,0,0,.35)",
                            }}

                            labelStyle={{
                              color:
                                "#71717a",
                            }}

                            formatter={(
                              value,
                            ) => [
                              formatMoney(
                                Number(
                                  value,
                                ),
                              ),

                              "Equity",
                            ]}

                            labelFormatter={(
                              label,
                            ) =>
                              `Trade ${label}`
                            }
                          />


                          <Line
                            type="monotone"
                            dataKey="equity"
                            stroke="currentColor"
                            strokeWidth={
                              2
                            }
                            className="text-emerald-400"
                            dot={
                              false
                            }

                            activeDot={{
                              r:
                                4,
                            }}
                          />

                        </LineChart>

                      </ResponsiveContainer>

                    </div>
                  )}

                </Card>


                <Card
                  title="Trading snapshot"
                  description="A quick interpretation of your recent journal data."
                >

                  <p className="text-sm leading-7 text-zinc-400">

                    {
                      analytics.results.length
                      < 5
                        ? `You have ${analytics.results.length} trade${analytics.results.length === 1 ? "" : "s"} in this period. Keep logging consistently so the patterns in your journal become more reliable.`

                        : analytics.expectancy
                          > 0
                          ? `Your expectancy is currently ${formatMoney(analytics.expectancy)} per trade. Focus on consistently executing the setups and behaviors contributing to that positive edge.`

                          : `Your expectancy is currently ${formatMoney(analytics.expectancy)} per trade. Review average losses, weaker strategies and repeated psychology patterns before increasing risk.`
                    }

                  </p>


                  <div className="mt-6 grid gap-2">

                    <MiniMetric
                      label="Average confidence"
                      value={`${analytics.averageConfidence.toFixed(
                        1,
                      )}/10`}
                    />


                    <MiniMetric
                      label="Wins"
                      value={
                        analytics.winners
                          .length
                          .toString()
                      }

                      tone="positive"
                    />


                    <MiniMetric
                      label="Losses"
                      value={
                        analytics.losers
                          .length
                          .toString()
                      }

                      tone="negative"
                    />


                    <MiniMetric
                      label="Breakeven"
                      value={
                        analytics.breakeven
                          .length
                          .toString()
                      }
                    />

                  </div>


                  <Link
                    href="/ai-coach"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    Open AI Coach
                    <span>
                      →
                    </span>
                  </Link>

                </Card>

              </section>


              {/* ===========================================
                  DIRECTION ANALYSIS
              =========================================== */}

              <section>

                <SectionHeading
                  eyebrow="Execution"
                  title="Long vs short"
                  description="Compare your performance based on trade direction."
                />


                <div className="mt-4 grid gap-4 lg:grid-cols-2">

                  <DirectionCard
                    title="Long trades"

                    trades={
                      analytics.longStats
                        .trades
                    }

                    winRate={
                      analytics.longStats
                        .winRate
                    }

                    pnl={
                      analytics.longStats
                        .pnl
                    }

                    averagePnl={
                      analytics.longStats
                        .averagePnl
                    }

                    direction="long"
                  />


                  <DirectionCard
                    title="Short trades"

                    trades={
                      analytics.shortStats
                        .trades
                    }

                    winRate={
                      analytics.shortStats
                        .winRate
                    }

                    pnl={
                      analytics.shortStats
                        .pnl
                    }

                    averagePnl={
                      analytics.shortStats
                        .averagePnl
                    }

                    direction="short"
                  />

                </div>

              </section>


              {/* ===========================================
                  BEST / WORST TRADE
              =========================================== */}

              <section>

                <SectionHeading
                  eyebrow="Trade review"
                  title="Performance extremes"
                  description="Your strongest and weakest executions in the selected period."
                />


                <div className="mt-4 grid gap-4 lg:grid-cols-2">

                  <TradeHighlight
                    eyebrow="Best trade"

                    result={
                      analytics.bestTrade
                    }

                    type="best"
                  />


                  <TradeHighlight
                    eyebrow="Worst trade"

                    result={
                      analytics.worstTrade
                    }

                    type="worst"
                  />

                </div>

              </section>


              {/* ===========================================
                  STRATEGY
              =========================================== */}

              <section>

                <SectionHeading
                  eyebrow="Edge"
                  title="Strategy performance"
                  description="Strategies are ranked by expectancy instead of raw profit alone."
                />


                <div className="mt-4 grid gap-4 lg:grid-cols-2">

                  <StrategyCard
                    eyebrow="Strongest strategy"

                    strategy={
                      analytics.bestStrategy
                    }
                  />


                  <StrategyCard
                    eyebrow="Strategy to review"

                    strategy={
                      analytics.worstStrategy
                    }
                  />

                </div>

              </section>


              {/* ===========================================
                  TAGS
              =========================================== */}

              {(
                analytics.bestTag
                || analytics.worstTag
              ) && (
                <section>

                  <SectionHeading
                    eyebrow="Behavior"
                    title="Journal tag patterns"
                    description="See which behaviors and trading conditions have been associated with stronger results."
                  />


                  <div className="mt-4 grid gap-4 lg:grid-cols-2">

                    <TagCard
                      eyebrow="Strongest tag"

                      tag={
                        analytics.bestTag
                      }
                    />


                    <TagCard
                      eyebrow="Tag to review"

                      tag={
                        analytics.worstTag
                      }
                    />

                  </div>

                </section>
              )}


              {/* ===========================================
                  RECENT TRADES
              =========================================== */}

              <Card
                padding="none"
                className="overflow-hidden"

                title={undefined}
              >

                <div className="flex flex-col gap-3 border-b border-zinc-900 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                      Journal activity
                    </p>


                    <h2 className="mt-2 text-lg font-semibold text-white">
                      Recent trades
                    </h2>


                    <p className="mt-1 text-sm text-zinc-600">
                      Your latest executions from the selected period.
                    </p>

                  </div>


                  <Link
                    href="/journal"
                    className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    View journal →
                  </Link>

                </div>


                {recentTrades.length
                === 0 ? (
                  <div className="p-12 text-center">

                    <p className="font-medium text-zinc-300">
                      No trades in this period
                    </p>


                    <p className="mt-2 text-sm text-zinc-600">
                      Change the date range or log another trade.
                    </p>

                  </div>
                ) : (
                  <div>

                    <div className="hidden grid-cols-[1fr_110px_1.3fr_130px] border-b border-zinc-900 bg-black/30 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 sm:grid">

                      <span>
                        Trade
                      </span>

                      <span>
                        Direction
                      </span>

                      <span>
                        Strategy
                      </span>

                      <span className="text-right">
                        P&L
                      </span>

                    </div>


                    <div className="divide-y divide-zinc-900">

                      {recentTrades.map(
                        ({
                          trade,
                          pnl,
                        }) => (
                          <div
                            key={
                              trade.id
                            }

                            className="grid gap-3 px-6 py-5 transition hover:bg-zinc-900/30 sm:grid-cols-[1fr_110px_1.3fr_130px] sm:items-center"
                          >

                            <div>

                              <p className="font-semibold text-zinc-100">
                                {
                                  trade.symbol
                                }
                              </p>


                              <p className="mt-1 text-xs text-zinc-600">
                                {
                                  new Date(
                                    trade.created_at,
                                  )
                                    .toLocaleDateString(
                                      "en-CA",
                                    )
                                }
                              </p>

                            </div>


                            <div>

                              <StatusBadge
                                tone={
                                  trade.direction
                                    .toLowerCase()
                                  === "long"
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {
                                  trade.direction
                                }
                              </StatusBadge>

                            </div>


                            <p className="text-sm text-zinc-400">
                              {getStrategyName(
                                trade,
                              )}
                            </p>


                            <p
                              className={`font-semibold sm:text-right ${
                                pnl
                                > 0
                                  ? "text-emerald-400"
                                  : pnl
                                    < 0
                                    ? "text-red-400"
                                    : "text-white"
                              }`}
                            >
                              {pnl
                              > 0
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

                  </div>
                )}

              </Card>


              {/* ===========================================
                  QUICK ACTIONS
              =========================================== */}

              <section>

                <SectionHeading
                  eyebrow="Workspace"
                  title="Continue your process"
                  description="Move directly into the next part of your trading workflow."
                />


                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <QuickAction
                    href="/journal"
                    number="01"
                    title="Log a trade"
                    description="Record your execution, strategy and psychology."
                  />


                  <QuickAction
                    href="/replay"
                    number="02"
                    title="Practice replay"
                    description="Practice historical sessions without seeing future candles."
                  />


                  <QuickAction
                    href="/analytics"
                    number="03"
                    title="Review analytics"
                    description="Dig deeper into strategies, risk and trading behavior."
                  />


                  <QuickAction
                    href="/ai-coach"
                    number="04"
                    title="Ask AI Coach"
                    description="Get personalized feedback from your journal data."
                  />

                </div>

              </section>

            </div>
          )}

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
        {eyebrow}
      </p>


      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>


      {description && (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      )}

    </div>
  );
}


/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-900 bg-black px-4 py-3">

      <span className="text-sm text-zinc-600">
        {label}
      </span>


      <span
        className={`text-sm font-semibold ${
          getToneClass(
            tone,
          )
        }`}
      >
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   DIRECTION CARD
========================================================= */

function DirectionCard({
  title,
  trades,
  winRate,
  pnl,
  averagePnl,
  direction,
}: {
  title: string;
  trades: number;
  winRate: number;
  pnl: number;
  averagePnl: number;
  direction:
    | "long"
    | "short";
}) {
  return (
    <Card>

      <div className="flex items-start justify-between gap-4">

        <div>

          <StatusBadge
            tone={
              direction
              === "long"
                ? "positive"
                : "negative"
            }
          >
            {direction
              === "long"
                ? "Long"
                : "Short"}
          </StatusBadge>


          <h3 className="mt-4 text-xl font-semibold text-white">
            {title}
          </h3>

        </div>


        <div className="text-right">

          <p
            className={`text-lg font-semibold ${
              pnl
              > 0
                ? "text-emerald-400"
                : pnl
                  < 0
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {pnl
            > 0
              ? "+"
              : ""}

            {formatMoney(
              pnl,
            )}
          </p>


          <p className="mt-1 text-[11px] text-zinc-600">
            Net P&L
          </p>

        </div>

      </div>


      <div className="mt-6 grid grid-cols-3 gap-3">

        <MiniMetricBlock
          label="Trades"
          value={
            trades.toString()
          }
        />


        <MiniMetricBlock
          label="Win rate"
          value={`${winRate.toFixed(
            1,
          )}%`}
        />


        <MiniMetricBlock
          label="Avg P&L"
          value={
            formatMoney(
              averagePnl,
            )
          }

          tone={
            toneFromNumber(
              averagePnl,
            )
          }
        />

      </div>

    </Card>
  );
}


/* =========================================================
   MINI METRIC BLOCK
========================================================= */

function MiniMetricBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>


      <p
        className={`mt-2 text-sm font-semibold ${
          getToneClass(
            tone,
          )
        }`}
      >
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   TRADE HIGHLIGHT
========================================================= */

function TradeHighlight({
  eyebrow,
  result,
  type,
}: {
  eyebrow: string;

  result:
    | {
        trade: Trade;
        pnl: number;
      }
    | null;

  type:
    | "best"
    | "worst";
}) {
  return (
    <Card>

      <div className="flex items-center justify-between gap-4">

        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
          {eyebrow}
        </p>


        <StatusBadge
          tone={
            type
            === "best"
              ? "positive"
              : "negative"
          }
        >
          {type
          === "best"
            ? "Strongest"
            : "Weakest"}
        </StatusBadge>

      </div>


      {!result ? (
        <p className="mt-6 text-sm text-zinc-600">
          No trade data yet.
        </p>
      ) : (
        <>

          <div className="mt-6 flex items-start justify-between gap-4">

            <div>

              <h3 className="text-2xl font-semibold tracking-tight text-white">
                {
                  result.trade
                    .symbol
                }
              </h3>


              <p className="mt-1.5 text-sm text-zinc-500">
                {
                  getStrategyName(
                    result.trade,
                  )
                }
                {" · "}
                {
                  result.trade
                    .direction
                }
              </p>

            </div>


            <p
              className={`text-xl font-semibold ${
                result.pnl
                > 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {result.pnl
              > 0
                ? "+"
                : ""}

              {formatMoney(
                result.pnl,
              )}
            </p>

          </div>


          <p className="mt-6 text-xs text-zinc-700">
            {
              new Date(
                result.trade
                  .created_at,
              )
                .toLocaleDateString(
                  "en-CA",
                )
            }
          </p>

        </>
      )}

    </Card>
  );
}


/* =========================================================
   STRATEGY CARD
========================================================= */

function StrategyCard({
  eyebrow,
  strategy,
}: {
  eyebrow: string;

  strategy:
    | {
        name: string;
        trades: number;
        wins: number;
        losses: number;
        pnl: number;
        winRate: number;
        expectancy: number;
      }
    | null;
}) {
  return (
    <Card>

      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
        {eyebrow}
      </p>


      {!strategy ? (
        <p className="mt-5 text-sm text-zinc-600">
          More strategy data is needed.
        </p>
      ) : (
        <>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {
              strategy.name
            }
          </h3>


          <p
            className={`mt-2 text-sm font-semibold ${
              strategy.expectancy
              > 0
                ? "text-emerald-400"
                : strategy.expectancy
                  < 0
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {formatMoney(
              strategy.expectancy,
            )}
            {" expectancy"}
          </p>


          <div className="mt-6 grid grid-cols-3 gap-3">

            <MiniMetricBlock
              label="Trades"
              value={
                strategy.trades
                  .toString()
              }
            />


            <MiniMetricBlock
              label="Win rate"
              value={`${strategy.winRate.toFixed(
                1,
              )}%`}
            />


            <MiniMetricBlock
              label="Net P&L"
              value={
                formatMoney(
                  strategy.pnl,
                )
              }

              tone={
                toneFromNumber(
                  strategy.pnl,
                )
              }
            />

          </div>

        </>
      )}

    </Card>
  );
}


/* =========================================================
   TAG CARD
========================================================= */

function TagCard({
  eyebrow,
  tag,
}: {
  eyebrow: string;

  tag:
    | {
        name: string;
        trades: number;
        pnl: number;
        averagePnl: number;
        winRate: number;
      }
    | null;
}) {
  return (
    <Card>

      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
        {eyebrow}
      </p>


      {!tag ? (
        <p className="mt-5 text-sm text-zinc-600">
          Add tags to your trades to unlock this analysis.
        </p>
      ) : (
        <>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {
              tag.name
            }
          </h3>


          <p
            className={`mt-2 text-sm font-semibold ${
              tag.averagePnl
              > 0
                ? "text-emerald-400"
                : tag.averagePnl
                  < 0
                  ? "text-red-400"
                  : "text-white"
            }`}
          >
            {formatMoney(
              tag.averagePnl,
            )}
            {" average"}
          </p>


          <div className="mt-6 grid grid-cols-2 gap-3">

            <MiniMetricBlock
              label="Trades"
              value={
                tag.trades
                  .toString()
              }
            />


            <MiniMetricBlock
              label="Win rate"
              value={`${tag.winRate.toFixed(
                1,
              )}%`}
            />

          </div>

        </>
      )}

    </Card>
  );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  number,
  title,
  description,
}: {
  href: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={
        href
      }

      className="group rounded-2xl border border-zinc-900 bg-zinc-950/70 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-950"
    >

      <div className="flex items-start justify-between gap-4">

        <span className="text-[10px] font-semibold tracking-[0.14em] text-zinc-700">
          {number}
        </span>


        <span className="text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-white">
          →
        </span>

      </div>


      <h3 className="mt-6 font-semibold text-zinc-200 transition group-hover:text-white">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {description}
      </p>

    </Link>
  );
}


/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div className="mt-4 flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-900 bg-black/30 px-6 text-center">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-900 bg-zinc-950 text-zinc-600">
        ↗
      </div>


      <p className="mt-4 font-medium text-zinc-300">
        No performance data
      </p>


      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Log trades or select a wider date range to build your equity curve.
      </p>


      <Link
        href="/journal"
        className="mt-5 text-sm font-medium text-blue-400 transition hover:text-blue-300"
      >
        Log a trade →
      </Link>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function DashboardLoading() {
  return (
    <div className="space-y-8">

      <div className="h-20 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70" />


      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {
          Array.from({
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

                className="h-32 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70"
              />
            ),
          )
        }

      </section>


      <div className="h-96 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70" />

    </div>
  );
}