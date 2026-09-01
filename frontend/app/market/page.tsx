"use client";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type IRange,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";

import { api } from "@/lib/api";


/* =========================================================
   TYPES
========================================================= */

type HistoryPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};


type MarketAnalysis = {
  symbol: string;

  price: number;
  previous_close: number;
  change_percent: number;

  rsi: number;

  macd: number;
  macd_signal: number;
  macd_histogram: number;

  sma_20: number;
  sma_50: number;
  sma_200: number;

  distance_from_sma_20: number;
  distance_from_sma_50: number;
  distance_from_sma_200: number;

  volatility: number;
  atr_14: number;

  high_52w: number;
  low_52w: number;

  support: number;
  resistance: number;

  distance_from_52w_high_percent: number;
  distance_from_52w_low_percent: number;

  volume: number;
  average_volume_20d: number;
  volume_ratio: number;

  performance_5d_percent: number;
  performance_20d_percent: number;
  performance_60d_percent: number;

  score: number;
  signal: string;
  risk: string;

  trend_score: number;
  intraday_score: number;
  opportunity_score: number;
  aggressive_score: number;

  intraday_trend: string;
  action_state: string;

  intraday_fit_score: number;
  short_term_fit_score: number;
  swing_fit_score: number;
  long_term_fit_score: number;

  trade_horizon: string;
  secondary_horizon: string;
  trade_duration: string;

  target_price: number | null;
  invalidation_price: number | null;

  target_source: string | null;
  invalidation_source: string | null;

  potential_upside_percent: number | null;
  potential_downside_percent: number | null;

  reward_risk_ratio: number | null;

  risk_level: string;

  intraday_vwap: number | null;
  intraday_ema_9: number | null;
  intraday_ema_20: number | null;

  intraday_change_percent: number | null;
  intraday_recent_momentum_percent: number | null;
  intraday_session_position: number | null;
  intraday_volume_ratio: number | null;

  reasons: string[];
  warnings: string[];

  history: HistoryPoint[];
};


type ChartRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "5Y"
  | "MAX";


type CandleInterval =
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "1d"
  | "1wk";


type IntervalMode =
  | "auto"
  | CandleInterval;


type MarketHistoryResponse = {
  symbol: string;

  interval: CandleInterval;

  bars: HistoryPoint[];

  has_more: boolean;

  oldest_available:
    string
    | null;

  newest_available:
    string
    | null;
};


type VisibleUnixRange = {
  from: number;
  to: number;
};


type BadgeTone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info";


/* =========================================================
   CONSTANTS
========================================================= */

const chartRanges: ChartRange[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "MAX",
];


const intervalButtons: {
  value: IntervalMode;
  label: string;
}[] = [
  {
    value: "auto",
    label: "Auto",
  },
  {
    value: "1m",
    label: "1m",
  },
  {
    value: "5m",
    label: "5m",
  },
  {
    value: "15m",
    label: "15m",
  },
  {
    value: "1h",
    label: "1H",
  },
  {
    value: "1d",
    label: "1D",
  },
  {
    value: "1wk",
    label: "1W",
  },
];


const rangePeriods: Record<
  ChartRange,
  string
> = {
  "1D": "1d",
  "5D": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "5Y": "5y",
  "MAX": "max",
};


const validIntervals: Record<
  ChartRange,
  CandleInterval[]
> = {
  "1D": [
    "1m",
    "5m",
    "15m",
    "1h",
    "1d",
  ],

  "5D": [
    "1m",
    "5m",
    "15m",
    "1h",
    "1d",
  ],

  "1M": [
    "5m",
    "15m",
    "1h",
    "1d",
  ],

  "3M": [
    "1d",
    "1wk",
  ],

  "6M": [
    "1d",
    "1wk",
  ],

  "1Y": [
    "1d",
    "1wk",
  ],

  "5Y": [
    "1d",
    "1wk",
  ],

  "MAX": [
    "1d",
    "1wk",
  ],
};


const olderWindowDays: Record<
  CandleInterval,
  number
> = {
  "1m": 2,
  "5m": 7,
  "15m": 14,
  "1h": 30,
  "1d": 365,
  "1wk": 3650,
};


const MARKET_REFRESH_INTERVAL =
  15_000;


const quickSymbols = [
  "AAPL",
  "NVDA",
  "MSFT",
  "TSLA",
  "AMZN",
  "META",
];


/* =========================================================
   HELPERS
========================================================= */

function getInitialInterval(
  range: ChartRange,
): CandleInterval {
  if (
    range === "1D"
  ) {
    return "5m";
  }

  if (
    range === "5D"
  ) {
    return "15m";
  }

  if (
    range === "1M"
  ) {
    return "1h";
  }

  if (
    range === "5Y"
    || range === "MAX"
  ) {
    return "1wk";
  }

  return "1d";
}


function getAutomaticInterval(
  visibleDays: number,
): CandleInterval {
  if (
    visibleDays <= 1.5
  ) {
    return "5m";
  }

  if (
    visibleDays <= 10
  ) {
    return "15m";
  }

  if (
    visibleDays <= 45
  ) {
    return "1h";
  }

  if (
    visibleDays <= 730
  ) {
    return "1d";
  }

  return "1wk";
}


function getSignalTone(
  signal: string,
): BadgeTone {
  const normalized =
    signal
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      "bullish",
    )
  ) {
    return "positive";
  }


  if (
    normalized.includes(
      "bearish",
    )
  ) {
    return "negative";
  }


  return "warning";
}


function getRiskTone(
  risk: string,
): BadgeTone {
  const normalized =
    risk
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      "very high",
    )
    || normalized === "high"
  ) {
    return "negative";
  }


  if (
    normalized.includes(
      "moderate",
    )
  ) {
    return "warning";
  }


  if (
    normalized.includes(
      "low",
    )
  ) {
    return "positive";
  }


  return "neutral";
}


function getActionTone(
  action: string,
): BadgeTone {
  const normalized =
    action
      .trim()
      .toLowerCase();


  if (
    normalized === "potential entry"
  ) {
    return "positive";
  }


  if (
    normalized === "avoid"
  ) {
    return "negative";
  }


  if (
    normalized === "extended"
    || normalized === "wait"
  ) {
    return "warning";
  }


  if (
    normalized === "watch"
  ) {
    return "info";
  }


  return "neutral";
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
  risk: string,
) {
  const normalized =
    risk
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      "very high",
    )
  ) {
    return "text-red-400";
  }


  if (
    normalized === "high"
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


function getRatioClass(
  value: number | null,
) {
  if (
    value === null
  ) {
    return "text-zinc-300";
  }

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


function getHorizonClass(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toLowerCase();


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


function getRsiDescription(
  rsi: number,
) {
  if (
    rsi >= 70
  ) {
    return "Overbought";
  }

  if (
    rsi <= 30
  ) {
    return "Oversold";
  }

  if (
    rsi >= 55
  ) {
    return "Positive momentum";
  }

  if (
    rsi <= 45
  ) {
    return "Weak momentum";
  }

  return "Neutral momentum";
}


function formatVolume(
  value: number,
) {
  if (
    value >= 1_000_000_000
  ) {
    return `${(
      value
      / 1_000_000_000
    ).toFixed(
      2,
    )}B`;
  }


  if (
    value >= 1_000_000
  ) {
    return `${(
      value
      / 1_000_000
    ).toFixed(
      2,
    )}M`;
  }


  if (
    value >= 1_000
  ) {
    return `${(
      value
      / 1_000
    ).toFixed(
      1,
    )}K`;
  }


  return value.toString();
}


function toChartTime(
  value: string,
): UTCTimestamp {
  return Math.floor(
    new Date(
      value,
    ).getTime()
    / 1000,
  ) as UTCTimestamp;
}


function normalizeChartTime(
  value: Time,
): number {
  if (
    typeof value
    === "number"
  ) {
    return value;
  }


  if (
    typeof value
    === "string"
  ) {
    return Math.floor(
      new Date(
        value,
      ).getTime()
      / 1000,
    );
  }


  return Math.floor(
    Date.UTC(
      value.year,
      value.month - 1,
      value.day,
    )
    / 1000,
  );
}


function mergeHistory(
  oldData: HistoryPoint[],
  newData: HistoryPoint[],
) {
  const map =
    new Map<
      string,
      HistoryPoint
    >();


  for (
    const item
    of newData
  ) {
    map.set(
      item.date,
      item,
    );
  }


  for (
    const item
    of oldData
  ) {
    map.set(
      item.date,
      item,
    );
  }


  return Array.from(
    map.values(),
  ).sort(
    (
      a,
      b,
    ) =>
      new Date(
        a.date,
      ).getTime()
      - new Date(
        b.date,
      ).getTime(),
  );
}


function scoreWidth(
  score: number,
) {
  if (
    !Number.isFinite(
      score,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.min(
      100,
      score,
    ),
  );
}


function formatOptionalPrice(
  value: number | null,
) {
  if (
    value === null
    || !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return `$${value.toFixed(
    2,
  )}`;
}


function formatOptionalPercent(
  value: number | null,
  forcePositive = false,
) {
  if (
    value === null
    || !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  if (
    forcePositive
  ) {
    return `+${Math.abs(
      value,
    ).toFixed(
      2,
    )}%`;
  }


  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}


/* =========================================================
   CHART
========================================================= */

function CandlestickChart({
  data,
  interval,
  analysis,
  hasMore,
  loadingMore,
  restoreRange,
  onNeedMore,
  onVisibleRangeChange,
}: {
  data: HistoryPoint[];

  interval:
    CandleInterval;

  analysis:
    MarketAnalysis;

  hasMore:
    boolean;

  loadingMore:
    boolean;

  restoreRange:
    VisibleUnixRange
    | null;

  onNeedMore:
    () => void;

  onVisibleRangeChange:
    (
      visibleDays: number,
      range: VisibleUnixRange,
    ) => void;
}) {
  const containerRef =
    useRef<
      HTMLDivElement
      | null
    >(
      null,
    );


  const chartRef =
    useRef<
      IChartApi
      | null
    >(
      null,
    );


  const candleSeriesRef =
    useRef<
      ISeriesApi<
        "Candlestick"
      >
      | null
    >(
      null,
    );


  const volumeSeriesRef =
    useRef<
      ISeriesApi<
        "Histogram"
      >
      | null
    >(
      null,
    );


  const previousLengthRef =
    useRef(
      0,
    );


  const firstDataRef =
    useRef(
      true,
    );


  const hasMoreRef =
    useRef(
      hasMore,
    );


  const loadingMoreRef =
    useRef(
      loadingMore,
    );


  const needMoreRef =
    useRef(
      onNeedMore,
    );


  const visibleRangeRef =
    useRef(
      onVisibleRangeChange,
    );


  const zoomTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      >
      | null
    >(
      null,
    );


  useEffect(
    () => {
      hasMoreRef.current =
        hasMore;

      loadingMoreRef.current =
        loadingMore;

      needMoreRef.current =
        onNeedMore;

      visibleRangeRef.current =
        onVisibleRangeChange;
    },
    [
      hasMore,
      loadingMore,
      onNeedMore,
      onVisibleRangeChange,
    ],
  );


  useEffect(
    () => {
      if (
        !containerRef.current
      ) {
        return;
      }


      const container =
        containerRef.current;


      firstDataRef.current =
        true;


      previousLengthRef.current =
        0;


      const chart =
        createChart(
          container,
          {
            width:
              container.clientWidth,

            height:
              440,

            layout: {
              background: {
                type:
                  ColorType.Solid,

                color:
                  "#09090b",
              },

              textColor:
                "#a1a1aa",
            },

            grid: {
              vertLines: {
                color:
                  "#18181b",
              },

              horzLines: {
                color:
                  "#18181b",
              },
            },

            rightPriceScale: {
              borderColor:
                "#27272a",

              scaleMargins: {
                top:
                  0.08,

                bottom:
                  0.18,
              },
            },

            timeScale: {
              borderColor:
                "#27272a",

              timeVisible:
                interval
                !== "1d"
                && interval
                !== "1wk",

              secondsVisible:
                false,

              rightOffset:
                2,

              barSpacing:
                interval
                === "1m"
                  ? 7
                  : 6,

              minBarSpacing:
                2,

              fixRightEdge:
                true,

              fixLeftEdge:
                false,

              lockVisibleTimeRangeOnResize:
                true,
            },

            crosshair: {
              vertLine: {
                color:
                  "#71717a",

                style:
                  LineStyle.Dashed,
              },

              horzLine: {
                color:
                  "#71717a",

                style:
                  LineStyle.Dashed,
              },
            },
          },
        );


      chartRef.current =
        chart;


      const candleSeries =
        chart.addSeries(
          CandlestickSeries,
          {
            upColor:
              "#34d399",

            downColor:
              "#f87171",

            borderVisible:
              false,

            wickUpColor:
              "#34d399",

            wickDownColor:
              "#f87171",
          },
        );


      candleSeriesRef.current =
        candleSeries;


      const volumeSeries =
        chart.addSeries(
          HistogramSeries,
          {
            priceFormat: {
              type:
                "volume",
            },

            priceScaleId:
              "",
          },
        );


      volumeSeriesRef.current =
        volumeSeries;


      volumeSeries
        .priceScale()
        .applyOptions({
          scaleMargins: {
            top:
              0.82,

            bottom:
              0,
          },
        });


      candleSeries
        .createPriceLine({
          price:
            analysis.support,

          color:
            "#34d399",

          lineWidth:
            1,

          lineStyle:
            LineStyle.Dashed,

          axisLabelVisible:
            true,

          title:
            "Support",
        });


      candleSeries
        .createPriceLine({
          price:
            analysis.resistance,

          color:
            "#f87171",

          lineWidth:
            1,

          lineStyle:
            LineStyle.Dashed,

          axisLabelVisible:
            true,

          title:
            "Resistance",
        });


      candleSeries
        .createPriceLine({
          price:
            analysis.sma_50,

          color:
            "#fbbf24",

          lineWidth:
            1,

          lineStyle:
            LineStyle.Dotted,

          axisLabelVisible:
            true,

          title:
            "SMA 50",
        });


      candleSeries
        .createPriceLine({
          price:
            analysis.sma_200,

          color:
            "#a78bfa",

          lineWidth:
            1,

          lineStyle:
            LineStyle.Dotted,

          axisLabelVisible:
            true,

          title:
            "SMA 200",
        });


      if (
        analysis.target_price
        !== null
        && Number.isFinite(
          analysis.target_price,
        )
      ) {
        candleSeries
          .createPriceLine({
            price:
              analysis.target_price,

            color:
              "#60a5fa",

            lineWidth:
              1,

            lineStyle:
              LineStyle.Dashed,

            axisLabelVisible:
              true,

            title:
              "Target",
          });
      }


      if (
        analysis.invalidation_price
        !== null
        && Number.isFinite(
          analysis.invalidation_price,
        )
      ) {
        candleSeries
          .createPriceLine({
            price:
              analysis.invalidation_price,

            color:
              "#fb923c",

            lineWidth:
              1,

            lineStyle:
              LineStyle.Dashed,

            axisLabelVisible:
              true,

            title:
              "Invalidation",
          });
      }


      const handleLogicalRange =
        (
          range: {
            from: number;
            to: number;
          }
          | null,
        ) => {
          if (
            !range
          ) {
            return;
          }


          const info =
            candleSeries
              .barsInLogicalRange(
                range,
              );


          if (
            !info
          ) {
            return;
          }


          if (
            info.barsBefore
            < 12
            && hasMoreRef.current
            && !loadingMoreRef.current
          ) {
            needMoreRef
              .current();
          }
        };


      const handleTimeRange =
        (
          range:
            IRange<Time>
            | null,
        ) => {
          if (
            !range
          ) {
            return;
          }


          if (
            zoomTimerRef.current
          ) {
            clearTimeout(
              zoomTimerRef.current,
            );
          }


          zoomTimerRef.current =
            setTimeout(
              () => {
                const from =
                  normalizeChartTime(
                    range.from,
                  );


                const to =
                  normalizeChartTime(
                    range.to,
                  );


                const days =
                  Math.abs(
                    to
                    - from,
                  )
                  / 86400;


                visibleRangeRef
                  .current(
                    days,
                    {
                      from,
                      to,
                    },
                  );
              },
              450,
            );
        };


      chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(
          handleLogicalRange,
        );


      chart
        .timeScale()
        .subscribeVisibleTimeRangeChange(
          handleTimeRange,
        );


      const resizeObserver =
        new ResizeObserver(
          () => {
            chart
              .applyOptions({
                width:
                  container
                    .clientWidth,
              });
          },
        );


      resizeObserver.observe(
        container,
      );


      return () => {
        if (
          zoomTimerRef.current
        ) {
          clearTimeout(
            zoomTimerRef.current,
          );
        }


        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(
            handleLogicalRange,
          );


        chart
          .timeScale()
          .unsubscribeVisibleTimeRangeChange(
            handleTimeRange,
          );


        resizeObserver
          .disconnect();


        chart
          .remove();


        chartRef.current =
          null;


        candleSeriesRef.current =
          null;


        volumeSeriesRef.current =
          null;
      };
    },
    [
      interval,
      analysis.symbol,
      analysis.support,
      analysis.resistance,
      analysis.sma_50,
      analysis.sma_200,
      analysis.target_price,
      analysis.invalidation_price,
    ],
  );


  useEffect(
    () => {
      const chart =
        chartRef.current;


      const candleSeries =
        candleSeriesRef.current;


      const volumeSeries =
        volumeSeriesRef.current;


      if (
        !chart
        || !candleSeries
        || !volumeSeries
        || data.length
        === 0
      ) {
        return;
      }


      const oldRange =
        chart
          .timeScale()
          .getVisibleLogicalRange();


      const previousLength =
        previousLengthRef.current;


      candleSeries
        .setData(
          data.map(
            (
              point,
            ) => ({
              time:
                toChartTime(
                  point.date,
                ),

              open:
                point.open,

              high:
                point.high,

              low:
                point.low,

              close:
                point.close,
            }),
          ),
        );


      volumeSeries
        .setData(
          data.map(
            (
              point,
            ) => ({
              time:
                toChartTime(
                  point.date,
                ),

              value:
                point.volume,

              color:
                point.close
                >= point.open
                  ? "#34d39966"
                  : "#f8717166",
            }),
          ),
        );


      if (
        firstDataRef.current
      ) {
        if (
          restoreRange
        ) {
          chart
            .timeScale()
            .setVisibleRange({
              from:
                restoreRange.from as UTCTimestamp,

              to:
                restoreRange.to as UTCTimestamp,
            });

        } else {
          chart
            .timeScale()
            .fitContent();
        }


        firstDataRef.current =
          false;

      } else if (
        oldRange
        && data.length
        > previousLength
      ) {
        const added =
          data.length
          - previousLength;


        chart
          .timeScale()
          .setVisibleLogicalRange({
            from:
              oldRange.from
              + added,

            to:
              oldRange.to
              + added,
          });
      }


      previousLengthRef.current =
        data.length;
    },
    [
      data,
      restoreRange,
    ],
  );


  useEffect(
    () => {
      chartRef.current
        ?.timeScale()
        .applyOptions({
          fixLeftEdge:
            !hasMore,
        });
    },
    [
      hasMore,
    ],
  );


  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-900 bg-black">

      <div
        ref={
          containerRef
        }

        className="h-[440px] w-full"
      />


      {loadingMore
      && (
        <div className="absolute left-4 top-4 rounded-lg border border-zinc-800 bg-black/90 px-3 py-2 text-xs text-zinc-400 shadow-xl">
          Loading older candles…
        </div>
      )}


      {!hasMore
      && (
        <div className="absolute left-4 top-4 rounded-lg border border-zinc-800 bg-black/90 px-3 py-2 text-xs text-zinc-600">
          Oldest available data reached
        </div>
      )}

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

function MarketPageContent() {
  const searchParams =
    useSearchParams();


  const [
    symbol,
    setSymbol,
  ] = useState(
    "AAPL",
  );


  const [
    analysis,
    setAnalysis,
  ] = useState<
    MarketAnalysis
    | null
  >(
    null,
  );


  const [
    chartRange,
    setChartRange,
  ] = useState<
    ChartRange
  >(
    "3M",
  );


  const [
    intervalMode,
    setIntervalMode,
  ] = useState<
    IntervalMode
  >(
    "auto",
  );


  const [
    actualInterval,
    setActualInterval,
  ] = useState<
    CandleInterval
  >(
    "1d",
  );


  const [
    historyData,
    setHistoryData,
  ] = useState<
    HistoryPoint[]
  >(
    [],
  );


  const [
    hasMoreHistory,
    setHasMoreHistory,
  ] = useState(
    true,
  );


  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(
    false,
  );


  const [
    loadingMore,
    setLoadingMore,
  ] = useState(
    false,
  );


  const [
    restoreRange,
    setRestoreRange,
  ] = useState<
    VisibleUnixRange
    | null
  >(
    null,
  );


  const [
    loading,
    setLoading,
  ] = useState(
    false,
  );


  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  const autoSwitchRef =
    useRef(
      false,
    );


  const lastUrlSymbolRef =
    useRef<
      string
      | null
    >(
      null,
    );


  const refreshRunningRef =
    useRef(
      false,
    );


  /* =======================================================
     HISTORY LOADER
  ======================================================= */

  const loadInitialHistory =
    useCallback(
      async (
        ticker: string,

        range:
          ChartRange,

        interval:
          CandleInterval,

        preserve:
          VisibleUnixRange
          | null
          = null,
      ) => {
        try {
          setHistoryLoading(
            true,
          );


          let url =
            `/market/history/${encodeURIComponent(
              ticker,
            )}`;


          if (
            preserve
          ) {
            const padding =
              Math.max(
                (
                  preserve.to
                  - preserve.from
                )
                * 0.75,

                86400,
              );


            const start =
              new Date(
                (
                  preserve.from
                  - padding
                )
                * 1000,
              )
                .toISOString();


            const end =
              new Date(
                (
                  preserve.to
                  + padding
                )
                * 1000,
              )
                .toISOString();


            url +=
              `?interval=${encodeURIComponent(
                interval,
              )}`
              + `&start=${encodeURIComponent(
                start,
              )}`
              + `&end=${encodeURIComponent(
                end,
              )}`;

          } else {
            url +=
              `?interval=${encodeURIComponent(
                interval,
              )}`
              + `&period=${encodeURIComponent(
                rangePeriods[
                  range
                ],
              )}`;
          }


          const response =
            await api(
              url,
            );


          const result =
            await response
              .json()
              .catch(
                () => null,
              );


          if (
            !response.ok
          ) {
            throw new Error(
              result?.detail
              || "Could not load chart history.",
            );
          }


          const history:
            MarketHistoryResponse =
            result;


          if (
            !history
            || !Array.isArray(
              history.bars,
            )
            || history.bars.length
            === 0
          ) {
            throw new Error(
              "No candles are available for this view.",
            );
          }


          setHistoryData(
            history.bars,
          );


          setHasMoreHistory(
            history.has_more,
          );


          setActualInterval(
            interval,
          );


          setRestoreRange(
            preserve,
          );

        } finally {
          setHistoryLoading(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     FULL ANALYZE
  ======================================================= */

  const analyzeSymbol =
    useCallback(
      async (
        tickerInput:
          string,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
        ) {
          setError(
            "Enter a stock symbol.",
          );

          return;
        }


        try {
          setLoading(
            true,
          );


          setError(
            "",
          );


          setSymbol(
            ticker,
          );


          const response =
            await api(
              `/market/analyze/${encodeURIComponent(
                ticker,
              )}`,
            );


          const result =
            await response
              .json()
              .catch(
                () => null,
              );


          if (
            !response.ok
          ) {
            throw new Error(
              result?.detail
              || "Could not analyze this symbol.",
            );
          }


          const marketAnalysis:
            MarketAnalysis =
            result;


          setAnalysis(
            marketAnalysis,
          );


          setHistoryData(
            [],
          );


          setRestoreRange(
            null,
          );


          const nextInterval =
            intervalMode
            === "auto"
              ? getInitialInterval(
                  chartRange,
                )
              : intervalMode;


          await loadInitialHistory(
            ticker,
            chartRange,
            nextInterval,
          );

        } catch (
          err
        ) {
          setAnalysis(
            null,
          );


          setHistoryData(
            [],
          );


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
      },
      [
        intervalMode,
        chartRange,
        loadInitialHistory,
      ],
    );


  /* =======================================================
     SILENT LIVE REFRESH
  ======================================================= */

  const refreshAnalysis =
    useCallback(
      async (
        tickerInput:
          string,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
          || refreshRunningRef.current
        ) {
          return;
        }


        try {
          refreshRunningRef.current =
            true;


          setRefreshing(
            true,
          );


          const response =
            await api(
              `/market/analyze/${encodeURIComponent(
                ticker,
              )}`,
            );


          if (
            !response.ok
          ) {
            return;
          }


          const result:
            MarketAnalysis =
            await response.json();


          if (
            result.symbol
              .trim()
              .toUpperCase()
            !== ticker
          ) {
            return;
          }


          setAnalysis(
            (
              current,
            ) => {
              if (
                !current
                || current.symbol
                  .trim()
                  .toUpperCase()
                !== ticker
              ) {
                return current;
              }


              return result;
            },
          );

        } catch {
          // Silent refresh errors keep the current result.

        } finally {
          refreshRunningRef.current =
            false;


          setRefreshing(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     URL SYMBOL
  ======================================================= */

  const requestedSymbol =
    useMemo(
      () =>
        searchParams
          .get(
            "symbol",
          )
          ?.trim()
          .toUpperCase()
        ?? "",
      [
        searchParams,
      ],
    );


  useEffect(
    () => {
      if (
        !requestedSymbol
      ) {
        return;
      }


      if (
        lastUrlSymbolRef.current
        === requestedSymbol
      ) {
        return;
      }


      lastUrlSymbolRef.current =
        requestedSymbol;


      setSymbol(
        requestedSymbol,
      );


      void analyzeSymbol(
        requestedSymbol,
      );
    },
    [
      requestedSymbol,
      analyzeSymbol,
    ],
  );


  /* =======================================================
     AUTOMATIC MARKET REFRESH
  ======================================================= */

  useEffect(
    () => {
      if (
        !analysis?.symbol
      ) {
        return;
      }


      const ticker =
        analysis.symbol;


      const interval =
        window.setInterval(
          () => {
            if (
              document.visibilityState
              !== "visible"
            ) {
              return;
            }


            void refreshAnalysis(
              ticker,
            );
          },
          MARKET_REFRESH_INTERVAL,
        );


      return () => {
        window.clearInterval(
          interval,
        );
      };
    },
    [
      analysis?.symbol,
      refreshAnalysis,
    ],
  );


  /* =======================================================
     REFRESH ON TAB RETURN
  ======================================================= */

  useEffect(
    () => {
      const handleVisibilityChange =
        () => {
          if (
            document.visibilityState
            !== "visible"
            || !analysis?.symbol
          ) {
            return;
          }


          void refreshAnalysis(
            analysis.symbol,
          );
        };


      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );


      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    },
    [
      analysis?.symbol,
      refreshAnalysis,
    ],
  );


  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  const handleAnalyze =
    async (
      event:
        FormEvent,
    ) => {
      event.preventDefault();


      lastUrlSymbolRef.current =
        symbol
          .trim()
          .toUpperCase();


      await analyzeSymbol(
        symbol,
      );
    };


  /* =======================================================
     RANGE
  ======================================================= */

  const changeRange =
    async (
      next:
        ChartRange,
    ) => {
      if (
        !analysis
      ) {
        return;
      }


      setChartRange(
        next,
      );


      let nextInterval:
        CandleInterval;


      if (
        intervalMode
        === "auto"
      ) {
        nextInterval =
          getInitialInterval(
            next,
          );

      } else if (
        validIntervals[
          next
        ].includes(
          intervalMode,
        )
      ) {
        nextInterval =
          intervalMode;

      } else {
        nextInterval =
          getInitialInterval(
            next,
          );


        setIntervalMode(
          "auto",
        );
      }


      setRestoreRange(
        null,
      );


      try {
        await loadInitialHistory(
          analysis.symbol,
          next,
          nextInterval,
        );

      } catch (
        err
      ) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not change chart range.",
        );
      }
    };


  /* =======================================================
     INTERVAL
  ======================================================= */

  const changeInterval =
    async (
      next:
        IntervalMode,
    ) => {
      if (
        !analysis
      ) {
        return;
      }


      const nextInterval =
        next
        === "auto"
          ? getInitialInterval(
              chartRange,
            )
          : next;


      if (
        !validIntervals[
          chartRange
        ].includes(
          nextInterval,
        )
      ) {
        return;
      }


      setIntervalMode(
        next,
      );


      setRestoreRange(
        null,
      );


      try {
        await loadInitialHistory(
          analysis.symbol,
          chartRange,
          nextInterval,
        );

      } catch (
        err
      ) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not change candle interval.",
        );
      }
    };


  /* =======================================================
     LOAD OLDER HISTORY
  ======================================================= */

  const loadOlderHistory =
    useCallback(
      async () => {
        if (
          !analysis
          || historyData.length
          === 0
          || loadingMore
          || !hasMoreHistory
        ) {
          return;
        }


        const oldest =
          historyData[
            0
          ].date;


        try {
          setLoadingMore(
            true,
          );


          const url =
            `/market/history/${encodeURIComponent(
              analysis.symbol,
            )}`
            + `?interval=${encodeURIComponent(
              actualInterval,
            )}`
            + `&before=${encodeURIComponent(
              oldest,
            )}`
            + `&window_days=${olderWindowDays[
              actualInterval
            ]}`;


          const response =
            await api(
              url,
            );


          const result =
            await response
              .json()
              .catch(
                () => null,
              );


          if (
            !response.ok
          ) {
            setHasMoreHistory(
              false,
            );

            return;
          }


          const history:
            MarketHistoryResponse =
            result;


          if (
            !history
            || !Array.isArray(
              history.bars,
            )
            || history.bars.length
            === 0
          ) {
            setHasMoreHistory(
              false,
            );

            return;
          }


          setHistoryData(
            (
              current,
            ) =>
              mergeHistory(
                current,
                history.bars,
              ),
          );


          setHasMoreHistory(
            history.has_more,
          );

        } catch {
          setHasMoreHistory(
            false,
          );

        } finally {
          setLoadingMore(
            false,
          );
        }
      },
      [
        analysis,
        historyData,
        loadingMore,
        hasMoreHistory,
        actualInterval,
      ],
    );


  /* =======================================================
     AUTO INTERVAL
  ======================================================= */

  const handleVisibleRangeChange =
    useCallback(
      async (
        visibleDays:
          number,

        range:
          VisibleUnixRange,
      ) => {
        if (
          intervalMode
          !== "auto"
          || !analysis
          || historyLoading
          || autoSwitchRef.current
        ) {
          return;
        }


        const target =
          getAutomaticInterval(
            visibleDays,
          );


        if (
          target
          === actualInterval
        ) {
          return;
        }


        const oldestAllowed =
          Date.now()
          - (
            60
            * 24
            * 60
            * 60
            * 1000
          );


        const targetIsIntraday =
          target === "1m"
          || target === "5m"
          || target === "15m"
          || target === "1h";


        if (
          targetIsIntraday
          && (
            range.from
            * 1000
            < oldestAllowed
          )
        ) {
          return;
        }


        try {
          autoSwitchRef.current =
            true;


          await loadInitialHistory(
            analysis.symbol,
            chartRange,
            target,
            range,
          );

        } catch {
          // Keep existing chart.

        } finally {
          window.setTimeout(
            () => {
              autoSwitchRef.current =
                false;
            },
            750,
          );
        }
      },
      [
        intervalMode,
        analysis,
        historyLoading,
        actualInterval,
        chartRange,
        loadInitialHistory,
      ],
    );


  /* =======================================================
     CHART PERFORMANCE
  ======================================================= */

  const chartPerformance =
    useMemo(
      () => {
        if (
          historyData.length
          < 2
        ) {
          return 0;
        }


        const first =
          historyData[
            0
          ].close;


        const last =
          historyData[
            historyData.length
            - 1
          ].close;


        return (
          (
            last
            - first
          )
          / first
        ) * 100;
      },
      [
        historyData,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Market Analysis"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Market intelligence"

            title="Market Analyzer"

            description="Analyze market structure, current momentum, trade timing and technical reward-to-risk while exploring the price action directly on an interactive chart."

            status={
              analysis
                ? (
                    <>
                      <StatusBadge
                        tone={
                          refreshing
                            ? "info"
                            : "positive"
                        }

                        dot
                      >
                        {
                          refreshing
                            ? "Updating market data"
                            : "Live analysis"
                        }
                      </StatusBadge>


                      <StatusBadge
                        tone="neutral"
                      >
                        Refreshes every 15s
                      </StatusBadge>
                    </>
                  )
                : (
                    <StatusBadge
                      tone="neutral"
                    >
                      Ready for analysis
                    </StatusBadge>
                  )
            }
          />


          <div className="space-y-8">

            {/* ===========================================
                SEARCH
            =========================================== */}

            <section>

              <SectionHeading
                eyebrow="Research"
                title="Analyze a symbol"
                description="Search any supported ticker or open a stock directly from the Scanner."
              />


              <Card
                className="mt-4"
              >

                <form
                  onSubmit={
                    handleAnalyze
                  }

                  className="flex flex-col gap-3 lg:flex-row"
                >

                  <div className="min-w-0 flex-1">

                    <label
                      htmlFor="market-symbol"
                      className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700"
                    >
                      Ticker symbol
                    </label>


                    <input
                      id="market-symbol"

                      value={
                        symbol
                      }

                      onChange={(
                        event,
                      ) =>
                        setSymbol(
                          event.target.value
                            .toUpperCase(),
                        )
                      }

                      placeholder="AAPL"

                      className="mt-2 w-full rounded-xl border border-zinc-900 bg-black px-4 py-3 text-sm font-medium uppercase text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700"
                    />

                  </div>


                  <button
                    type="submit"

                    disabled={
                      loading
                      || historyLoading
                    }

                    className="self-end rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {
                      loading
                        ? "Analyzing..."
                        : "Analyze"
                    }
                  </button>

                </form>


                <div className="mt-5 flex flex-wrap items-center gap-2">

                  <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                    Quick access
                  </span>


                  {quickSymbols.map(
                    (
                      ticker,
                    ) => (
                      <button
                        key={
                          ticker
                        }

                        type="button"

                        onClick={() => {
                          lastUrlSymbolRef.current =
                            ticker;


                          void analyzeSymbol(
                            ticker,
                          );
                        }}

                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          analysis?.symbol
                          === ticker
                            ? "border-zinc-600 bg-zinc-800 text-white"
                            : "border-zinc-900 bg-black text-zinc-500 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {
                          ticker
                        }
                      </button>
                    ),
                  )}

                </div>

              </Card>

            </section>


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
                EMPTY
            =========================================== */}

            {!analysis
            && !loading
            && (
              <Card>

                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
                    ↗
                  </div>


                  <p className="mt-4 text-lg font-semibold text-zinc-200">
                    Search a market symbol to begin
                  </p>


                  <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600">
                    A-Trader will analyze technical structure, intraday
                    behavior, support and resistance, trade horizon,
                    technical targets and historical price action.
                  </p>

                </div>

              </Card>
            )}


            {/* ===========================================
                INITIAL LOADING
            =========================================== */}

            {loading
            && !analysis
            && (
              <Card>

                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                  <span className="relative flex h-3 w-3">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />

                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-400" />

                  </span>


                  <p className="mt-5 font-medium text-zinc-300">
                    Analyzing{" "}
                    {
                      symbol
                    }…
                  </p>


                  <p className="mt-2 text-sm text-zinc-600">
                    Loading technical analysis and chart history.
                  </p>

                </div>

              </Card>
            )}


            {analysis
            && (
              <>

                {/* =========================================
                    MARKET HERO
                ========================================= */}

                <Card>

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-sm font-semibold text-zinc-300">
                          {
                            analysis.symbol
                          }
                        </p>


                        <StatusBadge
                          tone={
                            getSignalTone(
                              analysis.signal,
                            )
                          }
                        >
                          {
                            analysis.signal
                          }
                        </StatusBadge>


                        <StatusBadge
                          tone={
                            getActionTone(
                              analysis.action_state,
                            )
                          }
                        >
                          {
                            analysis.action_state
                          }
                        </StatusBadge>

                      </div>


                      <div className="mt-4 flex flex-wrap items-baseline gap-4">

                        <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                          $
                          {
                            analysis.price
                              .toFixed(
                                2,
                              )
                          }
                        </p>


                        <p
                          className={`text-base font-semibold ${
                            analysis.change_percent
                            >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {
                            analysis.change_percent
                            >= 0
                              ? "+"
                              : ""
                          }

                          {
                            analysis.change_percent
                              .toFixed(
                                2,
                              )
                          }%
                        </p>

                      </div>


                      <p className="mt-3 text-sm text-zinc-600">
                        Previous close $
                        {
                          analysis.previous_close
                            .toFixed(
                              2,
                            )
                        }
                      </p>

                    </div>


                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">

                      <HeroMetric
                        label="Opportunity"
                        value={`${analysis.opportunity_score}/100`}
                        valueClass={
                          getScoreClass(
                            analysis.opportunity_score,
                          )
                        }
                      />


                      <HeroMetric
                        label="Trend"
                        value={`${analysis.trend_score}/100`}
                        valueClass={
                          getScoreClass(
                            analysis.trend_score,
                          )
                        }
                      />


                      <HeroMetric
                        label="Intraday"
                        value={`${analysis.intraday_score}/100`}
                        valueClass={
                          getScoreClass(
                            analysis.intraday_score,
                          )
                        }
                      />


                      <HeroMetric
                        label="Risk"
                        value={
                          analysis.risk_level
                        }
                        valueClass={
                          getRiskClass(
                            analysis.risk_level,
                          )
                        }
                      />

                    </div>

                  </div>

                </Card>


                {/* =========================================
                    PRIMARY INTELLIGENCE
                ========================================= */}

                <section>

                  <SectionHeading
                    eyebrow="Setup quality"
                    title="Current opportunity"
                    description="Trend strength, current session behavior and entry quality are kept separate so a strong company does not automatically mean a strong entry."
                  />


                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <MetricCard
                      label="Opportunity"

                      value={
                        <span
                          className={
                            getScoreClass(
                              analysis.opportunity_score,
                            )
                          }
                        >
                          {
                            analysis.opportunity_score
                          }
                          /100
                        </span>
                      }

                      detail="Quality of the setup right now"
                    />


                    <MetricCard
                      label="Trend"

                      value={
                        <span
                          className={
                            getScoreClass(
                              analysis.trend_score,
                            )
                          }
                        >
                          {
                            analysis.trend_score
                          }
                          /100
                        </span>
                      }

                      detail={
                        analysis.price
                        >= analysis.sma_50
                          ? "Price is above the 50-day structure"
                          : "Price is below the 50-day structure"
                      }
                    />


                    <MetricCard
                      label="Intraday"

                      value={
                        <span
                          className={
                            getScoreClass(
                              analysis.intraday_score,
                            )
                          }
                        >
                          {
                            analysis.intraday_score
                          }
                          /100
                        </span>
                      }

                      detail={
                        analysis.intraday_trend
                      }
                    />


                    <MetricCard
                      label="Aggressive"

                      value={
                        <span
                          className={
                            getScoreClass(
                              analysis.aggressive_score,
                            )
                          }
                        >
                          {
                            analysis.aggressive_score
                          }
                          /100
                        </span>
                      }

                      detail="Momentum and upside-weighted score"
                    />

                  </div>

                </section>


                {/* =========================================
                    BEST FIT + TRADE PLAN
                ========================================= */}

                <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">

                  <Card
                    title="Best trade fit"
                    description="The holding period that currently aligns best with the technical structure."
                  >

                    <div className="mt-2">

                      <span
                        className={`inline-flex rounded-xl border px-3 py-1.5 text-sm font-semibold ${getHorizonClass(
                          analysis.trade_horizon,
                        )}`}
                      >
                        {
                          analysis.trade_horizon
                        }
                      </span>


                      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
                        {
                          analysis.trade_duration
                        }
                      </p>


                      <div className="mt-6 rounded-xl border border-zinc-900 bg-black p-4">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
                          Secondary fit
                        </p>


                        <p className="mt-2 font-semibold text-zinc-300">
                          {
                            analysis.secondary_horizon
                          }
                        </p>

                      </div>

                    </div>

                  </Card>


                  <Card
                    title="Technical trade plan"
                    description="Model-generated target, invalidation and estimated reward-to-risk."
                  >

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                      <TradePlanMetric
                        label="Target"
                        value={
                          formatOptionalPrice(
                            analysis.target_price,
                          )
                        }
                        detail={
                          analysis.target_source
                          ?? "No technical target"
                        }
                        secondary={
                          formatOptionalPercent(
                            analysis.potential_upside_percent,
                            true,
                          )
                        }
                        tone="positive"
                      />


                      <TradePlanMetric
                        label="Current"
                        value={`$${analysis.price.toFixed(
                          2,
                        )}`}
                        detail="Current market price"
                        secondary={
                          formatOptionalPercent(
                            analysis.change_percent,
                          )
                        }
                        tone={
                          analysis.change_percent
                          >= 0
                            ? "positive"
                            : "negative"
                        }
                      />


                      <TradePlanMetric
                        label="Invalidation"
                        value={
                          formatOptionalPrice(
                            analysis.invalidation_price,
                          )
                        }
                        detail={
                          analysis.invalidation_source
                          ?? "No invalidation level"
                        }
                        secondary={
                          analysis.potential_downside_percent
                          === null
                            ? "—"
                            : `-${Math.abs(
                                analysis.potential_downside_percent,
                              ).toFixed(
                                2,
                              )}%`
                        }
                        tone="negative"
                      />


                      <TradePlanMetric
                        label="Reward / Risk"
                        value={
                          analysis.reward_risk_ratio
                          === null
                            ? "—"
                            : `${analysis.reward_risk_ratio.toFixed(
                                2,
                              )}:1`
                        }
                        detail={`Risk level: ${analysis.risk_level}`}
                        valueClass={
                          getRatioClass(
                            analysis.reward_risk_ratio,
                          )
                        }
                      />

                    </div>

                  </Card>

                </section>


                {/* =========================================
                    HORIZONS
                ========================================= */}

                <Card
                  title="Trade horizon fit"
                  description="How well the current setup matches different holding periods."
                >

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    <HorizonScore
                      label="Intraday"
                      score={
                        analysis.intraday_fit_score
                      }
                    />


                    <HorizonScore
                      label="Short term"
                      score={
                        analysis.short_term_fit_score
                      }
                    />


                    <HorizonScore
                      label="Swing"
                      score={
                        analysis.swing_fit_score
                      }
                    />


                    <HorizonScore
                      label="Long term"
                      score={
                        analysis.long_term_fit_score
                      }
                    />

                  </div>

                </Card>


                {/* =========================================
                    CHART
                ========================================= */}

                <section>

                  <SectionHeading
                    eyebrow="Price action"
                    title="Interactive chart"
                    description="Explore the market across multiple time ranges and candle intervals. Auto mode adapts the candle interval as you zoom."
                  />


                  <Card
                    className="mt-4"
                  >

                    <div className="flex flex-col gap-5">

                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <StatusBadge
                              tone={
                                chartPerformance
                                >= 0
                                  ? "positive"
                                  : "negative"
                              }
                            >
                              {
                                chartPerformance
                                >= 0
                                  ? "+"
                                  : ""
                              }
                              {
                                chartPerformance
                                  .toFixed(
                                    2,
                                  )
                              }%
                            </StatusBadge>


                            <StatusBadge
                              tone="neutral"
                            >
                              {
                                chartRange
                              }
                            </StatusBadge>


                            <StatusBadge
                              tone="neutral"
                            >
                              {
                                actualInterval
                                === "1wk"
                                  ? "1W"
                                  : actualInterval
                                      .toUpperCase()
                              }
                              {" candles"}
                            </StatusBadge>


                            {intervalMode
                            === "auto"
                            && (
                              <StatusBadge
                                tone="info"
                              >
                                Auto interval
                              </StatusBadge>
                            )}

                          </div>


                          <p className="mt-3 text-xs text-zinc-700">
                            Drag to explore · Scroll or pinch to zoom · Older candles load automatically
                          </p>

                        </div>


                        <div className="space-y-2">

                          <ChartControlGroup>

                            {chartRanges.map(
                              (
                                range,
                              ) => (
                                <button
                                  key={
                                    range
                                  }

                                  type="button"

                                  disabled={
                                    historyLoading
                                  }

                                  onClick={() =>
                                    void changeRange(
                                      range,
                                    )
                                  }

                                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                    chartRange
                                    === range
                                      ? "bg-white text-black"
                                      : "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                  }`}
                                >
                                  {
                                    range
                                  }
                                </button>
                              ),
                            )}

                          </ChartControlGroup>


                          <ChartControlGroup>

                            {intervalButtons.map(
                              (
                                item,
                              ) => {
                                const available =
                                  item.value
                                  === "auto"
                                  || validIntervals[
                                    chartRange
                                  ].includes(
                                    item.value,
                                  );


                                const selected =
                                  item.value
                                  === intervalMode;


                                return (
                                  <button
                                    key={
                                      item.value
                                    }

                                    type="button"

                                    disabled={
                                      !available
                                      || historyLoading
                                    }

                                    onClick={() =>
                                      void changeInterval(
                                        item.value,
                                      )
                                    }

                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                      selected
                                        ? "bg-zinc-200 text-black"
                                        : available
                                          ? "text-zinc-500 hover:bg-zinc-800 hover:text-white"
                                          : "cursor-not-allowed text-zinc-800"
                                    }`}
                                  >
                                    {
                                      item.label
                                    }
                                  </button>
                                );
                              },
                            )}

                          </ChartControlGroup>

                        </div>

                      </div>


                      {historyLoading
                      && historyData.length
                      === 0 ? (
                        <div className="flex h-[440px] items-center justify-center rounded-xl border border-zinc-900 bg-black text-sm text-zinc-600">
                          Loading market history…
                        </div>

                      ) : historyData.length
                        > 0 ? (
                          <CandlestickChart
                            key={`${analysis.symbol}-${actualInterval}`}

                            data={
                              historyData
                            }

                            interval={
                              actualInterval
                            }

                            analysis={
                              analysis
                            }

                            hasMore={
                              hasMoreHistory
                            }

                            loadingMore={
                              loadingMore
                            }

                            restoreRange={
                              restoreRange
                            }

                            onNeedMore={
                              loadOlderHistory
                            }

                            onVisibleRangeChange={
                              handleVisibleRangeChange
                            }
                          />

                        ) : (
                          <div className="flex h-[440px] items-center justify-center rounded-xl border border-zinc-900 bg-black text-sm text-zinc-600">
                            No chart data available.
                          </div>
                        )}

                    </div>

                  </Card>

                </section>


                {/* =========================================
                    TECHNICAL DATA
                ========================================= */}

                <section>

                  <SectionHeading
                    eyebrow="Technical structure"
                    title="Market data"
                    description="Important structural and momentum measurements behind the analysis."
                  />


                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

                    <MetricCard
                      label="52-week high"

                      value={`$${analysis.high_52w.toFixed(
                        2,
                      )}`}

                      detail={`${analysis.distance_from_52w_high_percent.toFixed(
                        2,
                      )}% from high`}
                    />


                    <MetricCard
                      label="52-week low"

                      value={`$${analysis.low_52w.toFixed(
                        2,
                      )}`}

                      detail={`${analysis.distance_from_52w_low_percent.toFixed(
                        2,
                      )}% from low`}
                    />


                    <MetricCard
                      label="Latest volume"

                      value={
                        formatVolume(
                          analysis.volume,
                        )
                      }

                      detail={`${analysis.volume_ratio.toFixed(
                        2,
                      )}× 20-day average`}
                    />


                    <MetricCard
                      label="20-day avg volume"

                      value={
                        formatVolume(
                          analysis.average_volume_20d,
                        )
                      }

                      detail="Average participation"
                    />


                    <MetricCard
                      label="Support"

                      value={`$${analysis.support.toFixed(
                        2,
                      )}`}

                      detail="Recent technical floor"
                    />


                    <MetricCard
                      label="Resistance"

                      value={`$${analysis.resistance.toFixed(
                        2,
                      )}`}

                      detail="Recent technical ceiling"
                    />


                    <MetricCard
                      label="20-day SMA"

                      value={`$${analysis.sma_20.toFixed(
                        2,
                      )}`}

                      detail={`${analysis.distance_from_sma_20 >= 0 ? "+" : ""}${analysis.distance_from_sma_20.toFixed(
                        2,
                      )}% from price`}
                    />


                    <MetricCard
                      label="50-day SMA"

                      value={`$${analysis.sma_50.toFixed(
                        2,
                      )}`}

                      detail={`${analysis.distance_from_sma_50 >= 0 ? "+" : ""}${analysis.distance_from_sma_50.toFixed(
                        2,
                      )}% from price`}
                    />


                    <MetricCard
                      label="200-day SMA"

                      value={`$${analysis.sma_200.toFixed(
                        2,
                      )}`}

                      detail={`${analysis.distance_from_sma_200 >= 0 ? "+" : ""}${analysis.distance_from_sma_200.toFixed(
                        2,
                      )}% from price`}
                    />


                    <MetricCard
                      label="RSI"

                      value={
                        analysis.rsi
                          .toFixed(
                            2,
                          )
                      }

                      detail={
                        getRsiDescription(
                          analysis.rsi,
                        )
                      }
                    />


                    <MetricCard
                      label="MACD"

                      value={
                        analysis.macd
                          .toFixed(
                            4,
                          )
                      }

                      detail={`Histogram ${analysis.macd_histogram >= 0 ? "+" : ""}${analysis.macd_histogram.toFixed(
                        4,
                      )}`}
                    />


                    <MetricCard
                      label="ATR 14"

                      value={`$${analysis.atr_14.toFixed(
                        2,
                      )}`}

                      detail="Average daily range"
                    />

                  </div>

                </section>


                {/* =========================================
                    MARKET SUMMARY
                ========================================= */}

                <section>

                  <SectionHeading
                    eyebrow="Breakdown"
                    title="Market summary"
                    description="A compact view of structure, momentum and entry quality."
                  />


                  <div className="mt-4 grid gap-4 xl:grid-cols-3">

                    <SummaryCard
                      title="Structure"
                      badge={
                        <StatusBadge
                          tone={
                            getSignalTone(
                              analysis.signal,
                            )
                          }
                        >
                          {
                            analysis.signal
                          }
                        </StatusBadge>
                      }
                    >

                      <SummaryRow
                        label="Trend score"

                        value={`${analysis.trend_score}/100`}

                        valueClass={
                          getScoreClass(
                            analysis.trend_score,
                          )
                        }
                      />


                      <SummaryRow
                        label="Price vs SMA 20"

                        value={`${analysis.distance_from_sma_20 >= 0 ? "+" : ""}${analysis.distance_from_sma_20.toFixed(
                          2,
                        )}%`}
                      />


                      <SummaryRow
                        label="Price vs SMA 50"

                        value={`${analysis.distance_from_sma_50 >= 0 ? "+" : ""}${analysis.distance_from_sma_50.toFixed(
                          2,
                        )}%`}
                      />


                      <SummaryRow
                        label="Price vs SMA 200"

                        value={`${analysis.distance_from_sma_200 >= 0 ? "+" : ""}${analysis.distance_from_sma_200.toFixed(
                          2,
                        )}%`}
                      />


                      <SummaryRow
                        label="5-day performance"

                        value={
                          formatOptionalPercent(
                            analysis.performance_5d_percent,
                          )
                        }
                      />


                      <SummaryRow
                        label="20-day performance"

                        value={
                          formatOptionalPercent(
                            analysis.performance_20d_percent,
                          )
                        }
                      />


                      <SummaryRow
                        label="60-day performance"

                        value={
                          formatOptionalPercent(
                            analysis.performance_60d_percent,
                          )
                        }
                      />

                    </SummaryCard>


                    <SummaryCard
                      title="Current momentum"
                      badge={
                        <StatusBadge
                          tone={
                            analysis.intraday_score
                            >= 60
                              ? "positive"
                              : analysis.intraday_score
                                >= 45
                                ? "warning"
                                : "negative"
                          }
                        >
                          {
                            analysis.intraday_trend
                          }
                        </StatusBadge>
                      }
                    >

                      <SummaryRow
                        label="Intraday score"

                        value={`${analysis.intraday_score}/100`}

                        valueClass={
                          getScoreClass(
                            analysis.intraday_score,
                          )
                        }
                      />


                      <SummaryRow
                        label="RSI"

                        value={`${analysis.rsi.toFixed(
                          1,
                        )} · ${getRsiDescription(
                          analysis.rsi,
                        )}`}
                      />


                      <SummaryRow
                        label="MACD histogram"

                        value={`${analysis.macd_histogram >= 0 ? "+" : ""}${analysis.macd_histogram.toFixed(
                          4,
                        )}`}
                      />


                      <SummaryRow
                        label="Volume ratio"

                        value={`${analysis.volume_ratio.toFixed(
                          2,
                        )}×`}
                      />


                      <SummaryRow
                        label="Intraday change"

                        value={
                          formatOptionalPercent(
                            analysis.intraday_change_percent,
                          )
                        }
                      />


                      <SummaryRow
                        label="Recent momentum"

                        value={
                          formatOptionalPercent(
                            analysis.intraday_recent_momentum_percent,
                          )
                        }
                      />


                      <SummaryRow
                        label="Intraday volume"

                        value={
                          analysis.intraday_volume_ratio
                          === null
                            ? "—"
                            : `${analysis.intraday_volume_ratio.toFixed(
                                2,
                              )}×`
                        }
                      />

                    </SummaryCard>


                    <SummaryCard
                      title="Entry quality"
                      badge={
                        <StatusBadge
                          tone={
                            getActionTone(
                              analysis.action_state,
                            )
                          }
                        >
                          {
                            analysis.action_state
                          }
                        </StatusBadge>
                      }
                    >

                      <SummaryRow
                        label="Opportunity"

                        value={`${analysis.opportunity_score}/100`}

                        valueClass={
                          getScoreClass(
                            analysis.opportunity_score,
                          )
                        }
                      />


                      <SummaryRow
                        label="Aggressive"

                        value={`${analysis.aggressive_score}/100`}

                        valueClass={
                          getScoreClass(
                            analysis.aggressive_score,
                          )
                        }
                      />


                      <SummaryRow
                        label="Reward / Risk"

                        value={
                          analysis.reward_risk_ratio
                          === null
                            ? "—"
                            : `${analysis.reward_risk_ratio.toFixed(
                                2,
                              )}:1`
                        }

                        valueClass={
                          getRatioClass(
                            analysis.reward_risk_ratio,
                          )
                        }
                      />


                      <SummaryRow
                        label="Target"

                        value={
                          formatOptionalPrice(
                            analysis.target_price,
                          )
                        }

                        valueClass="text-emerald-400"
                      />


                      <SummaryRow
                        label="Invalidation"

                        value={
                          formatOptionalPrice(
                            analysis.invalidation_price,
                          )
                        }

                        valueClass="text-red-400"
                      />


                      <SummaryRow
                        label="Risk"

                        value={
                          analysis.risk_level
                        }

                        valueClass={
                          getRiskClass(
                            analysis.risk_level,
                          )
                        }
                      />


                      <SummaryRow
                        label="Best fit"

                        value={
                          analysis.trade_horizon
                        }
                      />

                    </SummaryCard>

                  </div>

                </section>


                {/* =========================================
                    REASONS + WARNINGS
                ========================================= */}

                <section>

                  <SectionHeading
                    eyebrow="Interpretation"
                    title="What is driving the setup?"
                    description="Positive factors explain the score while warnings highlight conditions that could weaken the trade."
                  />


                  <div className="mt-4 grid gap-4 xl:grid-cols-2">

                    <Card
                      title="Positive factors"

                      action={
                        <StatusBadge
                          tone="positive"
                        >
                          {
                            analysis.reasons.length
                          }
                          {" signal"}
                          {
                            analysis.reasons.length
                            === 1
                              ? ""
                              : "s"
                          }
                        </StatusBadge>
                      }
                    >

                      {
                        analysis.reasons.length
                        > 0
                          ? (
                              <div className="space-y-2">

                                {analysis.reasons.map(
                                  (
                                    reason,
                                    index,
                                  ) => (
                                    <InsightRow
                                      key={`${reason}-${index}`}
                                      tone="positive"
                                    >
                                      {
                                        reason
                                      }
                                    </InsightRow>
                                  ),
                                )}

                              </div>
                            )

                          : (
                              <EmptyInsight>
                                No positive factors were returned.
                              </EmptyInsight>
                            )
                      }

                    </Card>


                    <Card
                      title="Warnings"

                      action={
                        <StatusBadge
                          tone={
                            analysis.warnings.length
                            > 0
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {
                            analysis.warnings.length
                          }
                          {" warning"}
                          {
                            analysis.warnings.length
                            === 1
                              ? ""
                              : "s"
                          }
                        </StatusBadge>
                      }
                    >

                      {
                        analysis.warnings.length
                        > 0
                          ? (
                              <div className="space-y-2">

                                {analysis.warnings.map(
                                  (
                                    warning,
                                    index,
                                  ) => (
                                    <InsightRow
                                      key={`${warning}-${index}`}
                                      tone="warning"
                                    >
                                      {
                                        warning
                                      }
                                    </InsightRow>
                                  ),
                                )}

                              </div>
                            )

                          : (
                              <EmptyInsight>
                                No major warnings were returned.
                              </EmptyInsight>
                            )
                      }

                    </Card>

                  </div>

                </section>


                {/* =========================================
                    DISCLAIMER
                ========================================= */}

                <div className="border-t border-zinc-900 pt-5">

                  <p className="max-w-5xl text-xs leading-6 text-zinc-700">
                    Technical analysis is based on historical market data
                    and does not guarantee future performance. Target,
                    invalidation and reward/risk values are model-generated
                    technical estimates rather than guaranteed outcomes.
                    Intraday history is limited by the underlying market
                    data provider.
                  </p>

                </div>

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
   HERO METRIC
========================================================= */

function HeroMetric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
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
   TRADE PLAN METRIC
========================================================= */

function TradePlanMetric({
  label,
  value,
  detail,
  secondary,
  tone = "neutral",
  valueClass,
}: {
  label: string;
  value: string;
  detail: string;
  secondary?: string;
  tone?:
    | "neutral"
    | "positive"
    | "negative";
  valueClass?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-zinc-400";


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-3 text-xl font-semibold ${
          valueClass
          ?? (
            tone === "neutral"
              ? "text-white"
              : toneClass
          )
        }`}
      >
        {
          value
        }
      </p>


      <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-600">
        {
          detail
        }
      </p>


      {secondary
      && (
        <p
          className={`mt-3 text-sm font-semibold ${toneClass}`}
        >
          {
            secondary
          }
        </p>
      )}

    </div>
  );
}


/* =========================================================
   HORIZON SCORE
========================================================= */

function HorizonScore({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const valid =
    Number.isFinite(
      score,
    );


  const width =
    scoreWidth(
      score,
    );


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <div className="flex items-center justify-between gap-4">

        <p className="text-sm font-medium text-zinc-400">
          {
            label
          }
        </p>


        <p
          className={`text-sm font-semibold ${
            valid
              ? getScoreClass(
                  score,
                )
              : "text-zinc-600"
          }`}
        >
          {
            valid
              ? `${score}/100`
              : "—"
          }
        </p>

      </div>


      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">

        <div
          className="h-full rounded-full bg-white transition-all duration-500"

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
   CHART CONTROLS
========================================================= */

function ChartControlGroup({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-900 bg-black p-1">
      {
        children
      }
    </div>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>

      <div className="flex items-center justify-between gap-3">

        <h3 className="font-semibold text-zinc-200">
          {
            title
          }
        </h3>


        {
          badge
        }

      </div>


      <div className="mt-5 space-y-3">
        {
          children
        }
      </div>

    </Card>
  );
}


/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-zinc-600">
        {
          label
        }
      </span>


      <span
        className={`text-right text-sm font-medium ${
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
   INSIGHT ROW
========================================================= */

function InsightRow({
  tone,
  children,
}: {
  tone:
    | "positive"
    | "warning";

  children:
    ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-900 bg-black px-4 py-3">

      <span
        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
          tone
          === "positive"
            ? "bg-emerald-400"
            : "bg-amber-400"
        }`}
      />


      <p className="text-sm leading-6 text-zinc-400">
        {
          children
        }
      </p>

    </div>
  );
}


/* =========================================================
   EMPTY INSIGHT
========================================================= */

function EmptyInsight({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-900 bg-black/30 px-4 py-6 text-center text-sm text-zinc-600">
      {
        children
      }
    </div>

);
}
/* =========================================================
   PAGE WRAPPER
========================================================= */

function MarketPageLoading() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar active="Market Analysis" />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Market intelligence"
            title="Market Analyzer"
            description="Analyze market structure, current momentum, trade timing and technical reward-to-risk while exploring the price action directly on an interactive chart."
            status={
              <StatusBadge tone="neutral">
                Loading market analyzer
              </StatusBadge>
            }
          />

          <Card>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-400" />
              </span>

              <p className="mt-5 font-medium text-zinc-300">
                Loading Market Analyzer…
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Preparing market data and analysis tools.
              </p>

            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}


export default function MarketPage() {
  return (
    <Suspense fallback={<MarketPageLoading />}>
      <MarketPageContent />
    </Suspense>
  );
}
