"use client";

import type { ReactNode } from "react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
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


/* =========================================================
   TYPES
========================================================= */

type Trade = {
  id: number;

  symbol: string;
  direction: string;

  entry_price: number;
  exit_price: number;

  stop_loss: number | null;
  target_price: number | null;

  position_size: number;
  risk_percent: number;

  strategy: string;
  custom_strategy: string;

  playbook_setup_id: string;
  playbook_setup_name: string;

  tags: string[];

  confidence: number;

  psychology_notes: string;
  lesson_learned: string;

  trade_time: string | null;
  created_at: string;
};


type DateRange =
  | "7D"
  | "30D"
  | "3M"
  | "1Y"
  | "ALL";


type Tone =
  | "positive"
  | "negative"
  | "neutral";


type TradeResult = {
  trade: Trade;

  pnl: number;

  rMultiple:
    number | null;

  plannedRewardRisk:
    number | null;

  riskDollars:
    number | null;
};


/* =========================================================
   HELPERS
========================================================= */

function getTradeDate(
  trade: Trade,
) {
  return trade.trade_time
    ?? trade.created_at;
}


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


  return difference
    * trade.position_size;
}


function calculateRiskDollars(
  trade: Trade,
) {
  if (
    trade.stop_loss
    === null
  ) {
    return null;
  }


  const riskPerUnit =
    Math.abs(
      trade.entry_price
      - trade.stop_loss,
    );


  if (
    riskPerUnit <= 0
  ) {
    return null;
  }


  return riskPerUnit
    * trade.position_size;
}


function calculateRMultiple(
  trade: Trade,
) {
  const riskDollars =
    calculateRiskDollars(
      trade,
    );


  if (
    riskDollars
    === null
    || riskDollars <= 0
  ) {
    return null;
  }


  return calculatePnl(
    trade,
  ) / riskDollars;
}


function calculatePlannedRewardRisk(
  trade: Trade,
) {
  if (
    trade.stop_loss
    === null
    || trade.target_price
    === null
  ) {
    return null;
  }


  const risk =
    Math.abs(
      trade.entry_price
      - trade.stop_loss,
    );


  const reward =
    Math.abs(
      trade.target_price
      - trade.entry_price,
    );


  if (
    risk <= 0
  ) {
    return null;
  }


  return reward / risk;
}


function getTradeResult(
  trade: Trade,
): TradeResult {
  return {
    trade,

    pnl:
      calculatePnl(
        trade,
      ),

    rMultiple:
      calculateRMultiple(
        trade,
      ),

    plannedRewardRisk:
      calculatePlannedRewardRisk(
        trade,
      ),

    riskDollars:
      calculateRiskDollars(
        trade,
      ),
  };
}


function normalizeTrade(
  trade: Trade,
): Trade {
  return {
    ...trade,

    stop_loss:
      trade.stop_loss
      ?? null,

    target_price:
      trade.target_price
      ?? null,

    custom_strategy:
      trade.custom_strategy
      ?? "",

    playbook_setup_id:
      trade.playbook_setup_id
      ?? "",

    playbook_setup_name:
      trade.playbook_setup_name
      ?? "",

    tags:
      trade.tags
      ?? [],

    psychology_notes:
      trade.psychology_notes
      ?? "",

    lesson_learned:
      trade.lesson_learned
      ?? "",

    trade_time:
      trade.trade_time
      ?? null,
  };
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


function formatSignedMoney(
  value: number,
) {
  if (
    value > 0
  ) {
    return `+${formatMoney(
      value,
    )}`;
  }


  return formatMoney(
    value,
  );
}


function formatR(
  value:
    number | null,
) {
  if (
    value === null
  ) {
    return "—";
  }


  return `${value > 0 ? "+" : ""}${value.toFixed(
    2,
  )}R`;
}


function getStrategyName(
  trade: Trade,
) {
  if (
    trade.strategy
    === "Custom"
    && trade.custom_strategy
      .trim()
  ) {
    return trade
      .custom_strategy
      .trim();
  }


  return trade.strategy
    .trim()
    || "Unspecified";
}


function getTone(
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


function getValueClass(
  value: number,
) {
  if (
    value > 0
  ) {
    return "text-emerald-400";
  }


  if (
    value < 0
  ) {
    return "text-red-400";
  }


  return "text-zinc-300";
}


function filterTradesByRange(
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
    ) => {
      const date =
        new Date(
          getTradeDate(
            trade,
          ),
        );


      return (
        !Number.isNaN(
          date.getTime(),
        )
        && date >= start
      );
    },
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function AnalyticsPage() {
  const [
    trades,
    setTrades,
  ] = useState<
    Trade[]
  >(
    [],
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
     LOAD
  ======================================================= */

  useEffect(
    () => {
      async function loadTrades() {
        try {
          setLoading(
            true,
          );


          setError(
            "",
          );


          const response =
            await api(
              "/trades",
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
              typeof details?.detail
              === "string"
                ? details.detail
                : "Could not load analytics.",
            );
          }


          const data:
            Trade[] =
            await response
              .json();


          setTrades(
            data.map(
              normalizeTrade,
            ),
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
          setLoading(
            false,
          );
        }
      }


      void loadTrades();
    },
    [],
  );


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTrades =
    useMemo(
      () =>
        filterTradesByRange(
          trades,
          dateRange,
        ),
      [
        trades,
        dateRange,
      ],
    );


  /* =======================================================
     CORE ANALYTICS
  ======================================================= */

  const analytics =
    useMemo(
      () => {
        const results =
          [...filteredTrades]
            .sort(
              (
                a,
                b,
              ) =>
                new Date(
                  getTradeDate(
                    a,
                  ),
                ).getTime()
                - new Date(
                  getTradeDate(
                    b,
                  ),
                ).getTime(),
            )
            .map(
              getTradeResult,
            );


        const winners =
          results.filter(
            (
              result,
            ) =>
              result.pnl > 0,
          );


        const losers =
          results.filter(
            (
              result,
            ) =>
              result.pnl < 0,
          );


        const breakeven =
          results.filter(
            (
              result,
            ) =>
              result.pnl === 0,
          );


        const rResults =
          results.filter(
            (
              result,
            ): result is TradeResult & {
              rMultiple: number;
            } =>
              result.rMultiple
              !== null,
          );


        const plannedResults =
          results.filter(
            (
              result,
            ): result is TradeResult & {
              plannedRewardRisk: number;
            } =>
              result.plannedRewardRisk
              !== null,
          );


        const totalPnl =
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
          results.length > 0
            ? (
                winners.length
                / results.length
              ) * 100
            : 0;


        const lossRate =
          results.length > 0
            ? (
                losers.length
                / results.length
              ) * 100
            : 0;


        const averagePnl =
          results.length > 0
            ? totalPnl
              / results.length
            : 0;


        const averageWinner =
          winners.length > 0
            ? grossProfit
              / winners.length
            : 0;


        const averageLoser =
          losers.length > 0
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
          grossLoss > 0
            ? grossProfit
              / grossLoss
            : grossProfit > 0
              ? Infinity
              : null;


        const averageR =
          rResults.length > 0
            ? rResults.reduce(
                (
                  total,
                  result,
                ) =>
                  total
                  + result.rMultiple,
                0,
              )
              / rResults.length
            : null;


        const averagePlannedRR =
          plannedResults.length > 0
            ? plannedResults.reduce(
                (
                  total,
                  result,
                ) =>
                  total
                  + result.plannedRewardRisk,
                0,
              )
              / plannedResults.length
            : null;


        const largestWinner =
          winners.length > 0
            ? Math.max(
                ...winners.map(
                  (
                    result,
                  ) =>
                    result.pnl,
                ),
              )
            : 0;


        const largestLoser =
          losers.length > 0
            ? Math.min(
                ...losers.map(
                  (
                    result,
                  ) =>
                    result.pnl,
                ),
              )
            : 0;


        const bestTrade =
          results.length > 0
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
          results.length > 0
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


        let currentWinStreak =
          0;

        let currentLossStreak =
          0;

        let longestWinStreak =
          0;

        let longestLossStreak =
          0;


        results.forEach(
          (
            result,
          ) => {
            if (
              result.pnl > 0
            ) {
              currentWinStreak +=
                1;


              currentLossStreak =
                0;


              longestWinStreak =
                Math.max(
                  longestWinStreak,
                  currentWinStreak,
                );

            } else if (
              result.pnl < 0
            ) {
              currentLossStreak +=
                1;


              currentWinStreak =
                0;


              longestLossStreak =
                Math.max(
                  longestLossStreak,
                  currentLossStreak,
                );

            } else {
              currentWinStreak =
                0;


              currentLossStreak =
                0;
            }
          },
        );


        function directionStats(
          direction:
            "long"
            | "short",
        ) {
          const matching =
            results.filter(
              (
                result,
              ) =>
                result.trade
                  .direction
                  .toLowerCase()
                === direction,
            );


          const matchingWins =
            matching.filter(
              (
                result,
              ) =>
                result.pnl > 0,
            );


          const pnl =
            matching.reduce(
              (
                total,
                result,
              ) =>
                total
                + result.pnl,
              0,
            );


          const rTrades =
            matching.filter(
              (
                result,
              ): result is TradeResult & {
                rMultiple: number;
              } =>
                result.rMultiple
                !== null,
            );


          return {
            trades:
              matching.length,

            wins:
              matchingWins.length,

            pnl,

            winRate:
              matching.length > 0
                ? (
                    matchingWins.length
                    / matching.length
                  ) * 100
                : 0,

            averagePnl:
              matching.length > 0
                ? pnl
                  / matching.length
                : 0,

            averageR:
              rTrades.length > 0
                ? rTrades.reduce(
                    (
                      total,
                      result,
                    ) =>
                      total
                      + result.rMultiple,
                    0,
                  )
                  / rTrades.length
                : null,
          };
        }


        const averageConfidence =
          filteredTrades.length > 0
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


        const averageRisk =
          filteredTrades.length > 0
            ? filteredTrades.reduce(
                (
                  total,
                  trade,
                ) =>
                  total
                  + trade.risk_percent,
                0,
              )
              / filteredTrades.length
            : 0;


        return {
          results,

          winners,
          losers,
          breakeven,

          totalTrades:
            results.length,

          totalPnl,

          grossProfit,
          grossLoss,

          winRate,

          averagePnl,

          averageWinner,
          averageLoser,

          expectancy,
          profitFactor,

          averageR,
          averagePlannedRR,

          rTradeCount:
            rResults.length,

          largestWinner,
          largestLoser,

          bestTrade,
          worstTrade,

          longestWinStreak,
          longestLossStreak,

          averageConfidence,
          averageRisk,

          longStats:
            directionStats(
              "long",
            ),

          shortStats:
            directionStats(
              "short",
            ),
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
                index + 1,

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
            };
          },
        );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     R CURVE
  ======================================================= */

  const rCurve =
    useMemo(
      () => {
        let runningR =
          0;


        return analytics.results
          .filter(
            (
              result,
            ): result is TradeResult & {
              rMultiple: number;
            } =>
              result.rMultiple
              !== null,
          )
          .map(
            (
              result,
              index,
            ) => {
              runningR +=
                result.rMultiple;


              return {
                trade:
                  index + 1,

                r:
                  Number(
                    runningR
                      .toFixed(
                        2,
                      ),
                  ),

                symbol:
                  result.trade
                    .symbol,
              };
            },
          );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     STRATEGIES
  ======================================================= */

  const strategyBreakdown =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            TradeResult[]
          >();


        analytics.results.forEach(
          (
            result,
          ) => {
            const name =
              getStrategyName(
                result.trade,
              );


            const current =
              map.get(
                name,
              )
              ?? [];


            current.push(
              result,
            );


            map.set(
              name,
              current,
            );
          },
        );


        return Array.from(
          map.entries(),
        )
          .map(
            (
              [
                name,
                results,
              ],
            ) => {
              const wins =
                results.filter(
                  (
                    result,
                  ) =>
                    result.pnl > 0,
                );


              const losers =
                results.filter(
                  (
                    result,
                  ) =>
                    result.pnl < 0,
                );


              const totalPnl =
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
                wins.reduce(
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
                results.length > 0
                  ? (
                      wins.length
                      / results.length
                    ) * 100
                  : 0;


              const lossRate =
                results.length > 0
                  ? (
                      losers.length
                      / results.length
                    ) * 100
                  : 0;


              const averageWinner =
                wins.length > 0
                  ? grossProfit
                    / wins.length
                  : 0;


              const averageLoser =
                losers.length > 0
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


              const rResults =
                results.filter(
                  (
                    result,
                  ): result is TradeResult & {
                    rMultiple: number;
                  } =>
                    result.rMultiple
                    !== null,
                );


              const averageR =
                rResults.length > 0
                  ? rResults.reduce(
                      (
                        total,
                        result,
                      ) =>
                        total
                        + result.rMultiple,
                      0,
                    )
                    / rResults.length
                  : null;


              return {
                name,

                trades:
                  results.length,

                wins:
                  wins.length,

                winRate,

                totalPnl,

                expectancy,

                averageR,
              };
            },
          )
          .sort(
            (
              a,
              b,
            ) => {
              if (
                a.averageR
                !== null
                && b.averageR
                !== null
              ) {
                return b.averageR
                  - a.averageR;
              }


              return b.expectancy
                - a.expectancy;
            },
          );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     PLAYBOOK BREAKDOWN
  ======================================================= */

  const playbookBreakdown =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            TradeResult[]
          >();


        analytics.results.forEach(
          (
            result,
          ) => {
            const name =
              result.trade
                .playbook_setup_name
                .trim();


            if (
              !name
            ) {
              return;
            }


            const current =
              map.get(
                name,
              )
              ?? [];


            current.push(
              result,
            );


            map.set(
              name,
              current,
            );
          },
        );


        return Array.from(
          map.entries(),
        )
          .map(
            (
              [
                name,
                results,
              ],
            ) => {
              const winners =
                results.filter(
                  (
                    result,
                  ) =>
                    result.pnl > 0,
                );


              const totalPnl =
                results.reduce(
                  (
                    total,
                    result,
                  ) =>
                    total
                    + result.pnl,
                  0,
                );


              const rResults =
                results.filter(
                  (
                    result,
                  ): result is TradeResult & {
                    rMultiple: number;
                  } =>
                    result.rMultiple
                    !== null,
                );


              const averageR =
                rResults.length > 0
                  ? rResults.reduce(
                      (
                        total,
                        result,
                      ) =>
                        total
                        + result.rMultiple,
                      0,
                    )
                    / rResults.length
                  : null;


              return {
                name,

                trades:
                  results.length,

                winRate:
                  results.length > 0
                    ? (
                        winners.length
                        / results.length
                      ) * 100
                    : 0,

                pnl:
                  totalPnl,

                averageR,
              };
            },
          )
          .sort(
            (
              a,
              b,
            ) => {
              if (
                a.averageR
                !== null
                && b.averageR
                !== null
              ) {
                return b.averageR
                  - a.averageR;
              }


              return b.pnl
                - a.pnl;
            },
          );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     TAG BREAKDOWN
  ======================================================= */

  const tagBreakdown =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            TradeResult[]
          >();


        analytics.results.forEach(
          (
            result,
          ) => {
            const uniqueTags =
              Array.from(
                new Set(
                  result.trade.tags,
                ),
              );


            uniqueTags.forEach(
              (
                tag,
              ) => {
                const current =
                  map.get(
                    tag,
                  )
                  ?? [];


                current.push(
                  result,
                );


                map.set(
                  tag,
                  current,
                );
              },
            );
          },
        );


        return Array.from(
          map.entries(),
        )
          .map(
            (
              [
                name,
                results,
              ],
            ) => {
              const wins =
                results.filter(
                  (
                    result,
                  ) =>
                    result.pnl > 0,
                );


              const totalPnl =
                results.reduce(
                  (
                    total,
                    result,
                  ) =>
                    total
                    + result.pnl,
                  0,
                );


              const rResults =
                results.filter(
                  (
                    result,
                  ): result is TradeResult & {
                    rMultiple: number;
                  } =>
                    result.rMultiple
                    !== null,
                );


              return {
                name,

                trades:
                  results.length,

                winRate:
                  results.length > 0
                    ? (
                        wins.length
                        / results.length
                      ) * 100
                    : 0,

                totalPnl,

                averageR:
                  rResults.length > 0
                    ? rResults.reduce(
                        (
                          total,
                          result,
                        ) =>
                          total
                          + result.rMultiple,
                        0,
                      )
                      / rResults.length
                    : null,
              };
            },
          )
          .sort(
            (
              a,
              b,
            ) => {
              if (
                a.averageR
                !== null
                && b.averageR
                !== null
              ) {
                return b.averageR
                  - a.averageR;
              }


              return b.totalPnl
                - a.totalPnl;
            },
          );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     CONFIDENCE
  ======================================================= */

  const confidenceBreakdown =
    useMemo(
      () => {
        const buckets = [
          {
            label:
              "1–3",

            min:
              1,

            max:
              3,
          },

          {
            label:
              "4–6",

            min:
              4,

            max:
              6,
          },

          {
            label:
              "7–8",

            min:
              7,

            max:
              8,
          },

          {
            label:
              "9–10",

            min:
              9,

            max:
              10,
          },
        ];


        return buckets.map(
          (
            bucket,
          ) => {
            const matching =
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade.confidence
                  >= bucket.min
                  && result.trade.confidence
                  <= bucket.max,
              );


            const rResults =
              matching.filter(
                (
                  result,
                ): result is TradeResult & {
                  rMultiple: number;
                } =>
                  result.rMultiple
                  !== null,
              );


            return {
              confidence:
                bucket.label,

              trades:
                matching.length,

              averageR:
                rResults.length > 0
                  ? Number(
                      (
                        rResults.reduce(
                          (
                            total,
                            result,
                          ) =>
                            total
                            + result.rMultiple,
                          0,
                        )
                        / rResults.length
                      ).toFixed(
                        2,
                      ),
                    )
                  : null,
            };
          },
        );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     RISK BREAKDOWN
  ======================================================= */

  const riskBreakdown =
    useMemo(
      () => {
        const buckets = [
          {
            label:
              "≤0.5%",

            min:
              0,

            max:
              0.5,
          },

          {
            label:
              "0.5–1%",

            min:
              0.500001,

            max:
              1,
          },

          {
            label:
              "1–2%",

            min:
              1.000001,

            max:
              2,
          },

          {
            label:
              ">2%",

            min:
              2.000001,

            max:
              Infinity,
          },
        ];


        return buckets.map(
          (
            bucket,
          ) => {
            const matching =
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade
                    .risk_percent
                  >= bucket.min
                  && result.trade
                    .risk_percent
                  <= bucket.max,
              );


            const winners =
              matching.filter(
                (
                  result,
                ) =>
                  result.pnl > 0,
              );


            const rResults =
              matching.filter(
                (
                  result,
                ): result is TradeResult & {
                  rMultiple: number;
                } =>
                  result.rMultiple
                  !== null,
              );


            return {
              risk:
                bucket.label,

              trades:
                matching.length,

              winRate:
                matching.length > 0
                  ? (
                      winners.length
                      / matching.length
                    ) * 100
                  : 0,

              averageR:
                rResults.length > 0
                  ? Number(
                      (
                        rResults.reduce(
                          (
                            total,
                            result,
                          ) =>
                            total
                            + result.rMultiple,
                          0,
                        )
                        / rResults.length
                      ).toFixed(
                        2,
                      ),
                    )
                  : null,
            };
          },
        );
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     JOURNAL QUALITY
  ======================================================= */

  const journalQuality =
    useMemo(
      () => {
        const total =
          analytics.totalTrades;


        if (
          total === 0
        ) {
          return {
            stopRate:
              0,

            targetRate:
              0,

            playbookRate:
              0,

            tagRate:
              0,

            psychologyRate:
              0,

            lessonRate:
              0,

            tradeTimeRate:
              0,
          };
        }


        const percentage =
          (
            count: number,
          ) =>
            (
              count
              / total
            ) * 100;


        return {
          stopRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade
                    .stop_loss
                  !== null,
              ).length,
            ),

          targetRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade
                    .target_price
                  !== null,
              ).length,
            ),

          playbookRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  Boolean(
                    result.trade
                      .playbook_setup_name
                      .trim(),
                  ),
              ).length,
            ),

          tagRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade
                    .tags
                    .length > 0,
              ).length,
            ),

          psychologyRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  Boolean(
                    result.trade
                      .psychology_notes
                      .trim(),
                  ),
              ).length,
            ),

          lessonRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  Boolean(
                    result.trade
                      .lesson_learned
                      .trim(),
                  ),
              ).length,
            ),

          tradeTimeRate:
            percentage(
              analytics.results.filter(
                (
                  result,
                ) =>
                  result.trade
                    .trade_time
                  !== null,
              ).length,
            ),
        };
      },
      [
        analytics.results,
        analytics.totalTrades,
      ],
    );


  /* =======================================================
     CALENDAR
  ======================================================= */

  const calendarData =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            {
              pnl: number;

              r: number;

              rTrades: number;

              trades: number;

              wins: number;

              losses: number;

              breakeven: number;
            }
          >();


        analytics.results.forEach(
          (
            result,
          ) => {
            const date =
              new Date(
                getTradeDate(
                  result.trade,
                ),
              );


            const key =
              [
                date.getFullYear(),

                String(
                  date.getMonth()
                  + 1,
                ).padStart(
                  2,
                  "0",
                ),

                String(
                  date.getDate(),
                ).padStart(
                  2,
                  "0",
                ),
              ].join(
                "-",
              );


            const current =
              map.get(
                key,
              )
              ?? {
                pnl:
                  0,

                r:
                  0,

                rTrades:
                  0,

                trades:
                  0,

                wins:
                  0,

                losses:
                  0,

                breakeven:
                  0,
              };


            map.set(
              key,
              {
                pnl:
                  current.pnl
                  + result.pnl,

                r:
                  current.r
                  + (
                    result.rMultiple
                    ?? 0
                  ),

                rTrades:
                  current.rTrades
                  + (
                    result.rMultiple
                    !== null
                      ? 1
                      : 0
                  ),

                trades:
                  current.trades
                  + 1,

                wins:
                  current.wins
                  + (
                    result.pnl > 0
                      ? 1
                      : 0
                  ),

                losses:
                  current.losses
                  + (
                    result.pnl < 0
                      ? 1
                      : 0
                  ),

                breakeven:
                  current.breakeven
                  + (
                    result.pnl === 0
                      ? 1
                      : 0
                  ),
              },
            );
          },
        );


        const today =
          new Date();


        const year =
          today.getFullYear();


        const month =
          today.getMonth();


        const firstDay =
          new Date(
            year,
            month,
            1,
          );


        const lastDay =
          new Date(
            year,
            month + 1,
            0,
          );


        const leading =
          firstDay.getDay();


        const totalDays =
          lastDay.getDate();


        const days =
          Array.from(
            {
              length:
                leading
                + totalDays,
            },

            (
              _,
              index,
            ) => {
              if (
                index < leading
              ) {
                return null;
              }


              const dayNumber =
                index
                - leading
                + 1;


              const key =
                [
                  year,

                  String(
                    month + 1,
                  ).padStart(
                    2,
                    "0",
                  ),

                  String(
                    dayNumber,
                  ).padStart(
                    2,
                    "0",
                  ),
                ].join(
                  "-",
                );


              return {
                dayNumber,

                key,

                stats:
                  map.get(
                    key,
                  )
                  ?? null,
              };
            },
          );


        return {
          monthName:
            today.toLocaleDateString(
              "en-CA",
              {
                month:
                  "long",

                year:
                  "numeric",
              },
            ),

          days,
        };
      },
      [
        analytics.results,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Analytics"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Performance intelligence"

            title="Trading Analytics"

            description="Measure your results in dollars and R, compare strategies and Playbook setups, identify behavioral patterns and see whether your journal process is producing a measurable edge."

            actions={
              <div className="flex rounded-xl border border-zinc-900 bg-zinc-950 p-1">

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

                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        dateRange
                        === range
                          ? "bg-white text-black"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                      }`}
                    >
                      {
                        range
                      }
                    </button>
                  ),
                )}

              </div>
            }

            status={
              <>
                <StatusBadge
                  tone="positive"
                  dot
                >
                  Analytics ready
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    filteredTrades.length
                  }
                  {" trade"}
                  {
                    filteredTrades.length
                    === 1
                      ? ""
                      : "s"
                  }
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    dateRange
                  }
                </StatusBadge>
              </>
            }
          />


          <div className="space-y-8">

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


            {loading
            ? (
                <AnalyticsLoading />
              )

            : (
                <>

                  {/* =====================================
                      PRIMARY METRICS
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Performance"
                      title="Core results"
                      description="The most important measurements for evaluating whether your trading process currently has a positive edge."
                    />


                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                      <MetricCard
                        label="Net P&L"

                        value={
                          <span
                            className={
                              getValueClass(
                                analytics.totalPnl,
                              )
                            }
                          >
                            {
                              formatSignedMoney(
                                analytics.totalPnl,
                              )
                            }
                          </span>
                        }

                        detail={`${analytics.totalTrades} trade${analytics.totalTrades === 1 ? "" : "s"}`}
                      />


                      <MetricCard
                        label="Win rate"

                        value={`${analytics.winRate.toFixed(
                          1,
                        )}%`}

                        detail={`${analytics.winners.length} wins · ${analytics.losers.length} losses · ${analytics.breakeven.length} BE`}
                      />


                      <MetricCard
                        label="Average R"

                        value={
                          <span
                            className={
                              analytics.averageR
                              === null
                                ? "text-zinc-300"
                                : getValueClass(
                                    analytics.averageR,
                                  )
                            }
                          >
                            {
                              formatR(
                                analytics.averageR,
                              )
                            }
                          </span>
                        }

                        detail={`${analytics.rTradeCount} trade${analytics.rTradeCount === 1 ? "" : "s"} with stop data`}
                      />


                      <MetricCard
                        label="Profit factor"

                        value={
                          analytics.profitFactor
                          === null
                            ? "—"
                            : analytics.profitFactor
                              === Infinity
                              ? "∞"
                              : analytics.profitFactor
                                  .toFixed(
                                    2,
                                  )
                        }

                        detail="Gross profit ÷ gross loss"
                      />

                    </div>

                  </section>


                  {/* =====================================
                      SECONDARY METRICS
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Efficiency"
                      title="Trade quality"
                    />


                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                      <MetricCard
                        label="Expectancy"

                        value={
                          <span
                            className={
                              getValueClass(
                                analytics.expectancy,
                              )
                            }
                          >
                            {
                              formatSignedMoney(
                                analytics.expectancy,
                              )
                            }
                          </span>
                        }

                        detail="Expected dollar result per trade"
                      />


                      <MetricCard
                        label="Planned R:R"

                        value={
                          analytics.averagePlannedRR
                          === null
                            ? "—"
                            : `${analytics.averagePlannedRR.toFixed(
                                2,
                              )}:1`
                        }

                        detail="Average documented reward-to-risk"
                      />


                      <MetricCard
                        label="Average risk"

                        value={`${analytics.averageRisk.toFixed(
                          2,
                        )}%`}

                        detail="Average recorded account risk"
                      />


                      <MetricCard
                        label="Average confidence"

                        value={`${analytics.averageConfidence.toFixed(
                          1,
                        )}/10`}

                        detail="Average confidence before execution"
                      />

                    </div>

                  </section>


                  {/* =====================================
                      CURVES
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Performance curves"
                      title="Progress over time"
                      description="Compare dollar performance with normalized R performance across your completed trades."
                    />


                    <div className="mt-4 grid gap-4 xl:grid-cols-2">

                      <ChartCard
                        title="Cumulative P&L"
                        description="Running dollar result after each completed trade."
                        badge={
                          <StatusBadge
                            tone={
                              analytics.totalPnl
                              > 0
                                ? "positive"
                                : analytics.totalPnl
                                  < 0
                                  ? "negative"
                                  : "neutral"
                            }
                          >
                            {
                              formatSignedMoney(
                                analytics.totalPnl,
                              )
                            }
                          </StatusBadge>
                        }
                      >

                        {equityCurve.length
                        === 0 ? (
                            <EmptyState
                              text="Log trades to build your equity curve."
                            />

                          ) : (
                            <div className="mt-6 h-72">

                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <LineChart
                                  data={
                                    equityCurve
                                  }
                                >

                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#27272a"
                                  />


                                  <XAxis
                                    dataKey="trade"
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }
                                  />


                                  <YAxis
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
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
                                  />


                                  <Line
                                    type="monotone"
                                    dataKey="equity"
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                      r:
                                        4,
                                    }}
                                  />

                                </LineChart>
                              </ResponsiveContainer>

                            </div>
                          )}

                      </ChartCard>


                      <ChartCard
                        title="Cumulative R"
                        description="Normalized performance independent of position size."
                        badge={
                          <StatusBadge
                            tone={
                              analytics.averageR
                              === null
                                ? "neutral"
                                : analytics.averageR
                                  > 0
                                  ? "positive"
                                  : analytics.averageR
                                    < 0
                                    ? "negative"
                                    : "neutral"
                            }
                          >
                            {
                              formatR(
                                analytics.averageR,
                              )
                            }
                            {" avg"}
                          </StatusBadge>
                        }
                      >

                        {rCurve.length
                        === 0 ? (
                            <EmptyState
                              text="Document stop losses to build a cumulative R curve."
                            />

                          ) : (
                            <div className="mt-6 h-72">

                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <LineChart
                                  data={
                                    rCurve
                                  }
                                >

                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#27272a"
                                  />


                                  <XAxis
                                    dataKey="trade"
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }
                                  />


                                  <YAxis
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }

                                    tickFormatter={(
                                      value,
                                    ) =>
                                      `${value}R`
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
                                    }}

                                    formatter={(
                                      value,
                                    ) => [
                                      `${Number(
                                        value,
                                      ).toFixed(
                                        2,
                                      )}R`,

                                      "Cumulative R",
                                    ]}
                                  />


                                  <Line
                                    type="monotone"
                                    dataKey="r"
                                    stroke="#60a5fa"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                      r:
                                        4,
                                    }}
                                  />

                                </LineChart>
                              </ResponsiveContainer>

                            </div>
                          )}

                      </ChartCard>

                    </div>

                  </section>


                  {/* =====================================
                      LONG VS SHORT
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Direction"
                      title="Long vs short"
                      description="Determine whether your edge changes depending on trade direction."
                    />


                    <div className="mt-4 grid gap-4 lg:grid-cols-2">

                      <DirectionCard
                        name="Long"

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

                        averageR={
                          analytics.longStats
                            .averageR
                        }
                      />


                      <DirectionCard
                        name="Short"

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

                        averageR={
                          analytics.shortStats
                            .averageR
                        }
                      />

                    </div>

                  </section>


                  {/* =====================================
                      BEST / WORST
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Trade extremes"
                      title="Best and worst execution"
                      description="Review the trades that had the largest positive and negative impact on your results."
                    />


                    <div className="mt-4 grid gap-4 lg:grid-cols-2">

                      <TradeHighlight
                        title="Best trade"

                        result={
                          analytics.bestTrade
                        }

                        tone="positive"
                      />


                      <TradeHighlight
                        title="Worst trade"

                        result={
                          analytics.worstTrade
                        }

                        tone="negative"
                      />

                    </div>

                  </section>


                  {/* =====================================
                      STRATEGIES
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Strategies"
                      title="Performance by strategy"
                      description="Compare repeated approaches using win rate, expectancy, P&L and normalized R."
                    />


                    <Card
                      className="mt-4"
                      padding="none"
                    >

                      {strategyBreakdown.length
                      === 0 ? (
                          <EmptyState
                            text="Add strategies to your journal to unlock this analysis."
                          />

                        ) : (
                          <div className="overflow-x-auto">

                            <table className="w-full min-w-[900px] text-left">

                              <thead className="border-b border-zinc-900 bg-black/40 text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">

                                <tr>

                                  <th className="px-5 py-4">
                                    Strategy
                                  </th>

                                  <th className="px-5 py-4">
                                    Trades
                                  </th>

                                  <th className="px-5 py-4">
                                    Win rate
                                  </th>

                                  <th className="px-5 py-4">
                                    Average R
                                  </th>

                                  <th className="px-5 py-4">
                                    Expectancy
                                  </th>

                                  <th className="px-5 py-4 text-right">
                                    Net P&L
                                  </th>

                                </tr>

                              </thead>


                              <tbody className="divide-y divide-zinc-900">

                                {strategyBreakdown.map(
                                  (
                                    strategy,
                                    index,
                                  ) => (
                                    <tr
                                      key={
                                        strategy.name
                                      }

                                      className="transition hover:bg-zinc-900/30"
                                    >

                                      <td className="px-5 py-4">

                                        <div className="flex items-center gap-3">

                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-black text-xs font-semibold text-zinc-600">
                                            {
                                              index
                                              + 1
                                            }
                                          </div>


                                          <div>

                                            <p className="font-semibold text-zinc-200">
                                              {
                                                strategy.name
                                              }
                                            </p>


                                            {index
                                            === 0
                                            && (
                                              <p className="mt-1 text-[11px] text-blue-400">
                                                Leading strategy
                                              </p>
                                            )}

                                          </div>

                                        </div>

                                      </td>


                                      <td className="px-5 py-4 text-sm text-zinc-500">
                                        {
                                          strategy.trades
                                        }
                                      </td>


                                      <td className="px-5 py-4 text-sm text-zinc-400">
                                        {
                                          strategy.winRate
                                            .toFixed(
                                              1,
                                            )
                                        }
                                        %
                                      </td>


                                      <td
                                        className={`px-5 py-4 font-semibold ${
                                          strategy.averageR
                                          === null
                                            ? "text-zinc-700"
                                            : getValueClass(
                                                strategy.averageR,
                                              )
                                        }`}
                                      >
                                        {
                                          formatR(
                                            strategy.averageR,
                                          )
                                        }
                                      </td>


                                      <td
                                        className={`px-5 py-4 font-medium ${getValueClass(
                                          strategy.expectancy,
                                        )}`}
                                      >
                                        {
                                          formatSignedMoney(
                                            strategy.expectancy,
                                          )
                                        }
                                      </td>


                                      <td
                                        className={`px-5 py-4 text-right font-semibold ${getValueClass(
                                          strategy.totalPnl,
                                        )}`}
                                      >
                                        {
                                          formatSignedMoney(
                                            strategy.totalPnl,
                                          )
                                        }
                                      </td>

                                    </tr>
                                  ),
                                )}

                              </tbody>

                            </table>

                          </div>
                        )}

                    </Card>

                  </section>


                  {/* =====================================
                      PLAYBOOK
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Playbook"
                      title="Setup performance"
                      description="Compare your journal results against the setups you intentionally defined before trading."
                    />


                    {playbookBreakdown.length
                    === 0 ? (
                        <Card
                          className="mt-4"
                        >
                          <EmptyState
                            text="Link journal trades to Playbook setups to unlock this analysis."
                          />
                        </Card>

                      ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                          {playbookBreakdown.map(
                            (
                              setup,
                            ) => (
                              <Card
                                key={
                                  setup.name
                                }

                                className="transition-colors hover:border-zinc-700"
                              >

                                <div className="flex items-start justify-between gap-4">

                                  <div>

                                    <StatusBadge
                                      tone="info"
                                    >
                                      Playbook
                                    </StatusBadge>


                                    <h3 className="mt-3 font-semibold text-zinc-200">
                                      {
                                        setup.name
                                      }
                                    </h3>


                                    <p className="mt-1 text-xs text-zinc-600">
                                      {
                                        setup.trades
                                      }
                                      {" "}
                                      {
                                        setup.trades
                                        === 1
                                          ? "trade"
                                          : "trades"
                                      }
                                    </p>

                                  </div>


                                  <p
                                    className={`text-lg font-semibold ${getValueClass(
                                      setup.pnl,
                                    )}`}
                                  >
                                    {
                                      formatSignedMoney(
                                        setup.pnl,
                                      )
                                    }
                                  </p>

                                </div>


                                <div className="mt-5 grid grid-cols-2 gap-2">

                                  <SmallMetric
                                    label="Win rate"

                                    value={`${setup.winRate.toFixed(
                                      1,
                                    )}%`}
                                  />


                                  <SmallMetric
                                    label="Avg R"

                                    value={
                                      formatR(
                                        setup.averageR,
                                      )
                                    }
                                  />

                                </div>

                              </Card>
                            ),
                          )}

                        </div>
                      )}

                  </section>


                  {/* =====================================
                      TAGS
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Behavior"
                      title="Performance by tag"
                      description="Find patterns in market context, execution quality and trading behavior."
                    />


                    {tagBreakdown.length
                    === 0 ? (
                        <Card
                          className="mt-4"
                        >
                          <EmptyState
                            text="Add tags to your trades to unlock behavior analysis."
                          />
                        </Card>

                      ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                          {tagBreakdown.map(
                            (
                              tag,
                            ) => (
                              <Card
                                key={
                                  tag.name
                                }

                                className="transition-colors hover:border-zinc-700"
                              >

                                <div className="flex items-start justify-between gap-4">

                                  <div>

                                    <StatusBadge
                                      tone="neutral"
                                    >
                                      {
                                        tag.trades
                                      }
                                      {" trade"}
                                      {
                                        tag.trades
                                        === 1
                                          ? ""
                                          : "s"
                                      }
                                    </StatusBadge>


                                    <h3 className="mt-3 font-semibold text-zinc-200">
                                      {
                                        tag.name
                                      }
                                    </h3>

                                  </div>


                                  <p
                                    className={`font-semibold ${
                                      tag.averageR
                                      === null
                                        ? "text-zinc-600"
                                        : getValueClass(
                                            tag.averageR,
                                          )
                                    }`}
                                  >
                                    {
                                      formatR(
                                        tag.averageR,
                                      )
                                    }
                                  </p>

                                </div>


                                <div className="mt-5 space-y-3">

                                  <DataRow
                                    label="Win rate"

                                    value={`${tag.winRate.toFixed(
                                      1,
                                    )}%`}
                                  />


                                  <DataRow
                                    label="Net P&L"

                                    value={
                                      formatSignedMoney(
                                        tag.totalPnl,
                                      )
                                    }

                                    valueClass={
                                      getValueClass(
                                        tag.totalPnl,
                                      )
                                    }
                                  />

                                </div>

                              </Card>
                            ),
                          )}

                        </div>
                      )}

                  </section>


                  {/* =====================================
                      CONFIDENCE + RISK
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Decision quality"
                      title="Confidence and risk"
                      description="Check whether more confidence or more account risk is actually associated with better normalized results."
                    />


                    <div className="mt-4 grid gap-4 xl:grid-cols-2">

                      <ChartCard
                        title="Confidence vs R"
                        description="Average R by confidence bucket."
                      >

                        {analytics.rTradeCount
                        === 0 ? (
                            <EmptyState
                              text="Add stop-loss data to compare confidence against R."
                            />

                          ) : (
                            <div className="mt-6 h-72">

                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <BarChart
                                  data={
                                    confidenceBreakdown
                                  }
                                >

                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#27272a"
                                  />


                                  <XAxis
                                    dataKey="confidence"
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }
                                  />


                                  <YAxis
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }

                                    tickFormatter={(
                                      value,
                                    ) =>
                                      `${value}R`
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
                                    }}

                                    formatter={(
                                      value,
                                    ) => [
                                      value
                                      === null
                                      || value
                                      === undefined
                                        ? "No R data"
                                        : `${Number(
                                            value,
                                          ).toFixed(
                                            2,
                                          )}R`,

                                      "Average R",
                                    ]}
                                  />


                                  <Bar
                                    dataKey="averageR"
                                    fill="#60a5fa"

                                    radius={[
                                      6,
                                      6,
                                      0,
                                      0,
                                    ]}
                                  />

                                </BarChart>
                              </ResponsiveContainer>

                            </div>
                          )}

                      </ChartCard>


                      <ChartCard
                        title="Risk vs R"
                        description="Average R by recorded account-risk bucket."
                      >

                        {analytics.rTradeCount
                        === 0 ? (
                            <EmptyState
                              text="Add stop-loss data to compare risk against R."
                            />

                          ) : (
                            <div className="mt-6 h-72">

                              <ResponsiveContainer
                                width="100%"
                                height="100%"
                              >
                                <BarChart
                                  data={
                                    riskBreakdown
                                  }
                                >

                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#27272a"
                                  />


                                  <XAxis
                                    dataKey="risk"
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }
                                  />


                                  <YAxis
                                    stroke="#71717a"
                                    tickLine={
                                      false
                                    }
                                    axisLine={
                                      false
                                    }

                                    tickFormatter={(
                                      value,
                                    ) =>
                                      `${value}R`
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
                                    }}

                                    formatter={(
                                      value,
                                    ) => [
                                      value
                                      === null
                                      || value
                                      === undefined
                                        ? "No R data"
                                        : `${Number(
                                            value,
                                          ).toFixed(
                                            2,
                                          )}R`,

                                      "Average R",
                                    ]}
                                  />


                                  <Bar
                                    dataKey="averageR"
                                    fill="#a78bfa"

                                    radius={[
                                      6,
                                      6,
                                      0,
                                      0,
                                    ]}
                                  />

                                </BarChart>
                              </ResponsiveContainer>

                            </div>
                          )}

                      </ChartCard>

                    </div>

                  </section>


                  {/* =====================================
                      JOURNAL QUALITY
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Journal quality"
                      title="Data completeness"
                      description="Better journal completeness gives Analytics stronger evidence for identifying real patterns."
                    />


                    <Card
                      className="mt-4"
                    >

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <CompletionMetric
                          label="Stops documented"

                          value={
                            journalQuality.stopRate
                          }
                        />


                        <CompletionMetric
                          label="Targets documented"

                          value={
                            journalQuality.targetRate
                          }
                        />


                        <CompletionMetric
                          label="Playbook linked"

                          value={
                            journalQuality.playbookRate
                          }
                        />


                        <CompletionMetric
                          label="Tags recorded"

                          value={
                            journalQuality.tagRate
                          }
                        />


                        <CompletionMetric
                          label="Psychology documented"

                          value={
                            journalQuality.psychologyRate
                          }
                        />


                        <CompletionMetric
                          label="Lessons documented"

                          value={
                            journalQuality.lessonRate
                          }
                        />


                        <CompletionMetric
                          label="Trade time recorded"

                          value={
                            journalQuality.tradeTimeRate
                          }
                        />

                      </div>

                    </Card>

                  </section>


                  {/* =====================================
                      EXTREMES
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Consistency"
                      title="Results and streaks"
                      description="Track the size of your largest outcomes and how long winning or losing sequences tend to continue."
                    />


                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                      <MetricCard
                        label="Largest winner"

                        value={
                          <span className="text-emerald-400">
                            {
                              formatSignedMoney(
                                analytics.largestWinner,
                              )
                            }
                          </span>
                        }

                        detail="Largest profitable trade"
                      />


                      <MetricCard
                        label="Largest loser"

                        value={
                          <span className="text-red-400">
                            {
                              formatSignedMoney(
                                analytics.largestLoser,
                              )
                            }
                          </span>
                        }

                        detail="Largest losing trade"
                      />


                      <MetricCard
                        label="Longest win streak"

                        value={
                          analytics.longestWinStreak
                            .toString()
                        }

                        detail="Consecutive profitable trades"
                      />


                      <MetricCard
                        label="Longest loss streak"

                        value={
                          analytics.longestLossStreak
                            .toString()
                        }

                        detail="Consecutive losing trades"
                      />

                    </div>

                  </section>


                  {/* =====================================
                      CALENDAR
                  ===================================== */}

                  <section>

                    <SectionHeading
                      eyebrow="Trading calendar"
                      title={
                        calendarData.monthName
                      }
                      description="Daily P&L and cumulative R for the current month."
                    />


                    <Card
                      className="mt-4"
                    >

                      <div className="overflow-x-auto">

                        <div className="min-w-[760px]">

                          <div className="grid grid-cols-7 gap-2">

                            {[
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                            ].map(
                              (
                                day,
                              ) => (
                                <div
                                  key={
                                    day
                                  }

                                  className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700"
                                >
                                  {
                                    day
                                  }
                                </div>
                              ),
                            )}


                            {calendarData.days.map(
                              (
                                day,
                                index,
                              ) => {
                                if (
                                  !day
                                ) {
                                  return (
                                    <div
                                      key={`empty-${index}`}

                                      className="min-h-28 rounded-xl"
                                    />
                                  );
                                }


                                const pnl =
                                  day.stats
                                    ?.pnl
                                  ?? 0;


                                const hasTrades =
                                  day.stats
                                  !== null;


                                return (
                                  <div
                                    key={
                                      day.key
                                    }

                                    className={`min-h-28 rounded-xl border p-3 transition ${
                                      !hasTrades
                                        ? "border-zinc-900 bg-black/40"
                                        : pnl > 0
                                          ? "border-emerald-950 bg-emerald-950/10"
                                          : pnl < 0
                                            ? "border-red-950 bg-red-950/10"
                                            : "border-zinc-800 bg-zinc-900/40"
                                    }`}
                                  >

                                    <div className="flex items-start justify-between gap-2">

                                      <span className="text-sm font-medium text-zinc-300">
                                        {
                                          day.dayNumber
                                        }
                                      </span>


                                      {hasTrades
                                      && (
                                        <span className="text-[10px] text-zinc-700">
                                          {
                                            day.stats?.trades
                                          }
                                          {" trade"}
                                          {
                                            day.stats?.trades
                                            === 1
                                              ? ""
                                              : "s"
                                          }
                                        </span>
                                      )}

                                    </div>


                                    {hasTrades
                                    && (
                                      <div className="mt-5">

                                        <p
                                          className={`text-sm font-semibold ${getValueClass(
                                            pnl,
                                          )}`}
                                        >
                                          {
                                            formatSignedMoney(
                                              pnl,
                                            )
                                          }
                                        </p>


                                        {day.stats
                                        && day.stats.rTrades
                                        > 0
                                        && (
                                          <p
                                            className={`mt-1 text-[11px] font-medium ${getValueClass(
                                              day.stats.r,
                                            )}`}
                                          >
                                            {
                                              day.stats.r
                                              > 0
                                                ? "+"
                                                : ""
                                            }
                                            {
                                              day.stats.r
                                                .toFixed(
                                                  2,
                                                )
                                            }
                                            R
                                          </p>
                                        )}


                                        <p className="mt-2 text-[10px] text-zinc-700">
                                          {
                                            day.stats?.wins
                                          }
                                          W
                                          {" · "}
                                          {
                                            day.stats?.losses
                                          }
                                          L

                                          {
                                            day.stats?.breakeven
                                            ? ` · ${day.stats.breakeven} BE`
                                            : ""
                                          }
                                        </p>

                                      </div>
                                    )}

                                  </div>
                                );
                              },
                            )}

                          </div>

                        </div>

                      </div>

                    </Card>

                  </section>

                </>
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
   CHART CARD
========================================================= */

function ChartCard({
  title,
  description,
  badge,
  children,
}: {
  title: string;

  description: string;

  badge?:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <Card
      title={
        title
      }

      description={
        description
      }

      action={
        badge
      }
    >
      {
        children
      }
    </Card>
  );
}


/* =========================================================
   DIRECTION CARD
========================================================= */

function DirectionCard({
  name,
  trades,
  winRate,
  pnl,
  averagePnl,
  averageR,
}: {
  name: string;

  trades: number;

  winRate: number;

  pnl: number;

  averagePnl: number;

  averageR:
    number | null;
}) {
  const isLong =
    name
      .toLowerCase()
    === "long";


  return (
    <Card
      className="transition-colors hover:border-zinc-700"
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <StatusBadge
            tone={
              isLong
                ? "positive"
                : "negative"
            }
          >
            {
              name
            }
          </StatusBadge>


          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {
              name
            }
            {" trades"}
          </h3>

        </div>


        <p
          className={`text-xl font-semibold ${getValueClass(
            pnl,
          )}`}
        >
          {
            formatSignedMoney(
              pnl,
            )
          }
        </p>

      </div>


      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

        <SmallMetric
          label="Trades"

          value={
            trades.toString()
          }
        />


        <SmallMetric
          label="Win rate"

          value={`${winRate.toFixed(
            1,
          )}%`}
        />


        <SmallMetric
          label="Avg P&L"

          value={
            formatSignedMoney(
              averagePnl,
            )
          }

          valueClass={
            getValueClass(
              averagePnl,
            )
          }
        />


        <SmallMetric
          label="Avg R"

          value={
            formatR(
              averageR,
            )
          }

          valueClass={
            averageR
            === null
              ? undefined
              : getValueClass(
                  averageR,
                )
          }
        />

      </div>

    </Card>
  );
}


/* =========================================================
   TRADE HIGHLIGHT
========================================================= */

function TradeHighlight({
  title,
  result,
  tone,
}: {
  title: string;

  result:
    TradeResult
    | null;

  tone:
    "positive"
    | "negative";
}) {
  return (
    <Card>

      <div className="flex items-center justify-between gap-3">

        <StatusBadge
          tone={
            tone
          }
        >
          {
            title
          }
        </StatusBadge>


        {result
        && (
          <p
            className={`text-lg font-semibold ${getValueClass(
              result.pnl,
            )}`}
          >
            {
              formatSignedMoney(
                result.pnl,
              )
            }
          </p>
        )}

      </div>


      {!result
      ? (
          <EmptyState
            text="No trade data yet."
          />

        ) : (
          <>

            <div className="mt-5">

              <h3 className="text-2xl font-semibold tracking-tight text-white">
                {
                  result.trade.symbol
                }
              </h3>


              <p className="mt-1 text-sm text-zinc-600">
                {
                  getStrategyName(
                    result.trade,
                  )
                }
                {" · "}
                {
                  result.trade.direction
                }
              </p>

            </div>


            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <SmallMetric
                label="Entry"

                value={`$${result.trade.entry_price.toFixed(
                  2,
                )}`}
              />


              <SmallMetric
                label="Exit"

                value={`$${result.trade.exit_price.toFixed(
                  2,
                )}`}
              />


              <SmallMetric
                label="Actual R"

                value={
                  formatR(
                    result.rMultiple,
                  )
                }

                valueClass={
                  result.rMultiple
                  === null
                    ? undefined
                    : getValueClass(
                        result.rMultiple,
                      )
                }
              />


              <SmallMetric
                label="Planned R:R"

                value={
                  result.plannedRewardRisk
                  === null
                    ? "—"
                    : `${result.plannedRewardRisk.toFixed(
                        2,
                      )}:1`
                }
              />

            </div>

          </>
        )}

    </Card>
  );
}


/* =========================================================
   COMPLETION METRIC
========================================================= */

function CompletionMetric({
  label,
  value,
}: {
  label: string;

  value: number;
}) {
  const bounded =
    Math.min(
      100,
      Math.max(
        0,
        value,
      ),
    );


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <div className="flex items-center justify-between gap-4">

        <p className="text-xs text-zinc-500">
          {
            label
          }
        </p>


        <p className="text-sm font-semibold text-zinc-300">
          {
            value.toFixed(
              0,
            )
          }
          %
        </p>

      </div>


      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">

        <div
          className="h-full rounded-full bg-white transition-all"

          style={{
            width:
              `${bounded}%`,
          }}
        />

      </div>

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
  label: string;

  value: string;

  valueClass?:
    string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-2 text-sm font-semibold ${
          valueClass
          ?? "text-zinc-300"
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
   DATA ROW
========================================================= */

function DataRow({
  label,
  value,
  valueClass,
}: {
  label: string;

  value: string;

  valueClass?:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-sm text-zinc-600">
        {
          label
        }
      </span>


      <span
        className={`text-sm font-medium ${
          valueClass
          ?? "text-zinc-300"
        }`}
      >
        {
          value
        }
      </span>

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-zinc-900 bg-black/20 p-8 text-center">

      <p className="text-sm leading-6 text-zinc-600">
        {
          text
        }
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function AnalyticsLoading() {
  return (
    <div className="space-y-8">

      <div>

        <div className="h-3 w-24 animate-pulse rounded bg-zinc-900" />


        <div className="mt-3 h-7 w-52 animate-pulse rounded bg-zinc-900" />

      </div>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

              className="h-32 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950"
            />
          ),
        )}

      </div>


      <div className="grid gap-4 xl:grid-cols-2">

        <div className="h-96 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950" />


        <div className="h-96 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950" />

      </div>

    </div>
  );
}