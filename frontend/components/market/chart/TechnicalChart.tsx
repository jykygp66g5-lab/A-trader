"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type IRange,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import {
  calculateMovingAverages,
  type IndicatorPoint,
} from "@/lib/market/indicators";

import {
  detectTechnicalPatterns,
  type DetectedPattern,
  type PivotPoint,
} from "@/lib/market/patterns";

import type {
  CandleInterval,
  HistoryPoint,
  MarketAnalysis,
  VisibleUnixRange,
} from "@/lib/market/types";

import type {
  OverlayVisibility,
} from "./ChartOverlays";

import type {
  PatternVisibility,
} from "./PatternControls";


/* =========================================================
   PROPS
========================================================= */

type TechnicalChartProps = {
  data: HistoryPoint[];
  interval: CandleInterval;
  analysis: MarketAnalysis;
  hasMore: boolean;
  loadingMore: boolean;
  restoreRange: VisibleUnixRange | null;
  overlays: OverlayVisibility;
  patterns: PatternVisibility;
  onNeedMore: () => void;

  onVisibleRangeChange: (
    visibleDays: number,
    range: VisibleUnixRange,
  ) => void;
};


/* =========================================================
   SERIES TYPES
========================================================= */

type LineSeriesRef = ISeriesApi<"Line">;

type CandleSeriesRef =
  ISeriesApi<"Candlestick">;

type VolumeSeriesRef =
  ISeriesApi<"Histogram">;


/* =========================================================
   TIME HELPERS
========================================================= */

function toChartTime(
  value: string,
): UTCTimestamp {
  const timestamp =
    Math.floor(
      new Date(value).getTime()
      / 1000,
    );

  return timestamp as UTCTimestamp;
}


function unixToChartTime(
  value: number,
): UTCTimestamp {
  return value as UTCTimestamp;
}


function normalizeChartTime(
  value: Time,
): number {
  if (
    typeof value === "number"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    return Math.floor(
      new Date(value).getTime()
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


/* =========================================================
   INDICATOR DATA
========================================================= */

function toLineData(
  points: IndicatorPoint[],
) {
  return points.map(
    (point) => ({
      time:
        toChartTime(
          point.date,
        ),

      value:
        point.value,
    }),
  );
}


/* =========================================================
   PATTERN VISIBILITY
========================================================= */

function patternIsVisible(
  pattern: DetectedPattern,
  visibility: PatternVisibility,
): boolean {
  switch (
    pattern.type
  ) {
    case "breakout":
      return visibility
        .breakouts;

    case "breakdown":
      return visibility
        .breakdowns;

    case "double-bottom":
      return visibility
        .doubleBottoms;

    case "double-top":
      return visibility
        .doubleTops;

    case "golden-cross":
    case "death-cross":
      return visibility
        .movingAverageCrosses;

    default:
      return false;
  }
}


/* =========================================================
   PATTERN MARKERS
========================================================= */

function buildPatternMarkers(
  detectedPatterns:
    DetectedPattern[],

  pivots:
    PivotPoint[],

  visibility:
    PatternVisibility,

  interval:
    CandleInterval,
): SeriesMarker<Time>[] {
  const markers:
    SeriesMarker<Time>[] = [];


  for (
    const pattern
    of detectedPatterns
  ) {
    if (
      !patternIsVisible(
        pattern,
        visibility,
      )
    ) {
      continue;
    }


    /*
     * Classic Golden Cross / Death Cross terminology
     * refers to daily 50 / 200 moving averages.
     *
     * On intraday charts our averages are based on
     * displayed candles, so we don't show those
     * classic labels there.
     */
    if (
      (
        pattern.type === "golden-cross"
        || pattern.type === "death-cross"
      )
      && interval !== "1d"
    ) {
      continue;
    }


    switch (
      pattern.type
    ) {
      case "breakout":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "belowBar",

          color:
            "#34d399",

          shape:
            "arrowUp",

          text:
            "Breakout",
        });

        break;


      case "breakdown":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "aboveBar",

          color:
            "#f87171",

          shape:
            "arrowDown",

          text:
            "Breakdown",
        });

        break;


      case "double-bottom":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "belowBar",

          color:
            "#22d3ee",

          shape:
            "circle",

          text:
            "Double Bottom",
        });

        break;


      case "double-top":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "aboveBar",

          color:
            "#fb923c",

          shape:
            "circle",

          text:
            "Double Top",
        });

        break;


      case "golden-cross":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "belowBar",

          color:
            "#fbbf24",

          shape:
            "arrowUp",

          text:
            "Golden Cross",
        });

        break;


      case "death-cross":
        markers.push({
          time:
            toChartTime(
              pattern.endDate,
            ),

          position:
            "aboveBar",

          color:
            "#a78bfa",

          shape:
            "arrowDown",

          text:
            "Death Cross",
        });

        break;
    }
  }


  if (
    visibility.pivots
  ) {
    const recentPivots =
      pivots.slice(-40);


    for (
      const pivot
      of recentPivots
    ) {
      markers.push({
        time:
          toChartTime(
            pivot.date,
          ),

        position:
          pivot.type === "high"
            ? "aboveBar"
            : "belowBar",

        color:
          "#71717a",

        shape:
          "circle",

        text:
          pivot.type === "high"
            ? "Swing H"
            : "Swing L",
      });
    }
  }


  return markers.sort(
    (
      first,
      second,
    ) => {
      return (
        normalizeChartTime(
          first.time,
        )
        - normalizeChartTime(
          second.time,
        )
      );
    },
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function TechnicalChart({
  data,
  interval,
  analysis,
  hasMore,
  loadingMore,
  restoreRange,
  overlays,
  patterns,
  onNeedMore,
  onVisibleRangeChange,
}: TechnicalChartProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const chartRef =
    useRef<IChartApi | null>(
      null,
    );


  const candleSeriesRef =
    useRef<CandleSeriesRef | null>(
      null,
    );


  const volumeSeriesRef =
    useRef<VolumeSeriesRef | null>(
      null,
    );


  const sma20SeriesRef =
    useRef<LineSeriesRef | null>(
      null,
    );


  const sma50SeriesRef =
    useRef<LineSeriesRef | null>(
      null,
    );


  const sma200SeriesRef =
    useRef<LineSeriesRef | null>(
      null,
    );


  const ema9SeriesRef =
    useRef<LineSeriesRef | null>(
      null,
    );


  const ema20SeriesRef =
    useRef<LineSeriesRef | null>(
      null,
    );


  const markerPluginRef =
    useRef<
      ISeriesMarkersPluginApi<Time>
      | null
    >(
      null,
    );


  const supportLineRef =
    useRef<IPriceLine | null>(
      null,
    );


  const resistanceLineRef =
    useRef<IPriceLine | null>(
      null,
    );


  const targetLineRef =
    useRef<IPriceLine | null>(
      null,
    );


  const invalidationLineRef =
    useRef<IPriceLine | null>(
      null,
    );


  const previousLengthRef =
    useRef(0);


  const firstDataRef =
    useRef(true);


  const hasMoreRef =
    useRef(hasMore);


  const loadingMoreRef =
    useRef(loadingMore);


  const needMoreRef =
    useRef(onNeedMore);


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


  /* =======================================================
     CALCULATED TECHNICAL DATA
  ======================================================= */

  const movingAverages =
    useMemo(
      () =>
        calculateMovingAverages(
          data,
        ),
      [data],
    );


  const technicalPatterns =
    useMemo(
      () =>
        detectTechnicalPatterns(
          data,
        ),
      [data],
    );


  /* =======================================================
     KEEP CALLBACK REFS CURRENT
  ======================================================= */

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


  /* =======================================================
     CREATE CHART
  ======================================================= */

  useEffect(
    () => {
      const container =
        containerRef.current;


      if (
        !container
      ) {
        return;
      }


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
                interval !== "1d"
                && interval !== "1wk",

              secondsVisible:
                false,

              rightOffset:
                2,

              barSpacing:
                interval === "1m"
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


      /* ===================================================
         CANDLE SERIES
      =================================================== */

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


      /* ===================================================
         VOLUME SERIES
      =================================================== */

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


      /* ===================================================
         SMA 20
      =================================================== */

      sma20SeriesRef.current =
        chart.addSeries(
          LineSeries,
          {
            color:
              "#38bdf8",

            lineWidth:
              1,

            priceLineVisible:
              false,

            lastValueVisible:
              false,

            crosshairMarkerVisible:
              false,
          },
        );


      /* ===================================================
         SMA 50
      =================================================== */

      sma50SeriesRef.current =
        chart.addSeries(
          LineSeries,
          {
            color:
              "#fbbf24",

            lineWidth:
              2,

            priceLineVisible:
              false,

            lastValueVisible:
              false,

            crosshairMarkerVisible:
              false,
          },
        );


      /* ===================================================
         SMA 200
      =================================================== */

      sma200SeriesRef.current =
        chart.addSeries(
          LineSeries,
          {
            color:
              "#a78bfa",

            lineWidth:
              2,

            priceLineVisible:
              false,

            lastValueVisible:
              false,

            crosshairMarkerVisible:
              false,
          },
        );


      /* ===================================================
         EMA 9
      =================================================== */

      ema9SeriesRef.current =
        chart.addSeries(
          LineSeries,
          {
            color:
              "#22d3ee",

            lineWidth:
              1,

            priceLineVisible:
              false,

            lastValueVisible:
              false,

            crosshairMarkerVisible:
              false,
          },
        );


      /* ===================================================
         EMA 20
      =================================================== */

      ema20SeriesRef.current =
        chart.addSeries(
          LineSeries,
          {
            color:
              "#fb923c",

            lineWidth:
              1,

            priceLineVisible:
              false,

            lastValueVisible:
              false,

            crosshairMarkerVisible:
              false,
          },
        );


      /* ===================================================
         PATTERN MARKERS
      =================================================== */

      markerPluginRef.current =
        createSeriesMarkers(
          candleSeries,
          [],
        );


      /* ===================================================
         OLDER HISTORY DETECTION
      =================================================== */

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
            info.barsBefore < 12
            && hasMoreRef.current
            && !loadingMoreRef.current
          ) {
            needMoreRef
              .current();
          }
        };


      /* ===================================================
         VISIBLE TIME RANGE
      =================================================== */

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


                const visibleDays =
                  Math.abs(
                    to - from,
                  )
                  / 86400;


                visibleRangeRef
                  .current(
                    visibleDays,
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


      /* ===================================================
         RESIZE
      =================================================== */

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


      resizeObserver
        .observe(
          container,
        );


      /* ===================================================
         CLEANUP
      =================================================== */

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


        chart.remove();


        chartRef.current =
          null;

        candleSeriesRef.current =
          null;

        volumeSeriesRef.current =
          null;

        sma20SeriesRef.current =
          null;

        sma50SeriesRef.current =
          null;

        sma200SeriesRef.current =
          null;

        ema9SeriesRef.current =
          null;

        ema20SeriesRef.current =
          null;

        markerPluginRef.current =
          null;

        supportLineRef.current =
          null;

        resistanceLineRef.current =
          null;

        targetLineRef.current =
          null;

        invalidationLineRef.current =
          null;
      };
    },
    [
      interval,
      analysis.symbol,
    ],
  );


  /* =======================================================
     CANDLE + VOLUME DATA
  ======================================================= */

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
        || data.length === 0
      ) {
        return;
      }


      const oldRange =
        chart
          .timeScale()
          .getVisibleLogicalRange();


      const previousLength =
        previousLengthRef.current;


      const candleData =
        data.map(
          (point) => ({
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
        );


      const volumeData =
        data.map(
          (point) => ({
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
        );


      candleSeries
        .setData(
          candleData,
        );


      volumeSeries
        .setData(
          volumeData,
        );


      if (
        firstDataRef.current
      ) {
        if (
          restoreRange
        ) {
          const restoredRange:
            IRange<Time> = {
              from:
                unixToChartTime(
                  restoreRange.from,
                ),

              to:
                unixToChartTime(
                  restoreRange.to,
                ),
            };


          chart
            .timeScale()
            .setVisibleRange(
              restoredRange,
            );

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


  /* =======================================================
     MOVING AVERAGE DATA
  ======================================================= */

  useEffect(
    () => {
      sma20SeriesRef.current
        ?.setData(
          toLineData(
            movingAverages.sma20,
          ),
        );


      sma50SeriesRef.current
        ?.setData(
          toLineData(
            movingAverages.sma50,
          ),
        );


      sma200SeriesRef.current
        ?.setData(
          toLineData(
            movingAverages.sma200,
          ),
        );


      ema9SeriesRef.current
        ?.setData(
          toLineData(
            movingAverages.ema9,
          ),
        );


      ema20SeriesRef.current
        ?.setData(
          toLineData(
            movingAverages.ema20,
          ),
        );
    },
    [
      movingAverages,
    ],
  );


  /* =======================================================
     OVERLAY VISIBILITY
  ======================================================= */

  useEffect(
    () => {
      sma20SeriesRef.current
        ?.applyOptions({
          visible:
            overlays.sma20,
        });


      sma50SeriesRef.current
        ?.applyOptions({
          visible:
            overlays.sma50,
        });


      sma200SeriesRef.current
        ?.applyOptions({
          visible:
            overlays.sma200,
        });


      ema9SeriesRef.current
        ?.applyOptions({
          visible:
            overlays.ema9,
        });


      ema20SeriesRef.current
        ?.applyOptions({
          visible:
            overlays.ema20,
        });


      volumeSeriesRef.current
        ?.applyOptions({
          visible:
            overlays.volume,
        });
    },
    [
      overlays.sma20,
      overlays.sma50,
      overlays.sma200,
      overlays.ema9,
      overlays.ema20,
      overlays.volume,
    ],
  );


  /* =======================================================
     PRICE LEVELS
  ======================================================= */

  useEffect(
    () => {
      const candleSeries =
        candleSeriesRef.current;


      if (
        !candleSeries
      ) {
        return;
      }


      const activeCandleSeries =
        candleSeries;


      function removeLine(
        ref:
          MutableRefObject<
            IPriceLine
            | null
          >,
      ) {
        if (
          !ref.current
        ) {
          return;
        }


        activeCandleSeries
          .removePriceLine(
            ref.current,
          );


        ref.current =
          null;
      }


      removeLine(
        supportLineRef,
      );

      removeLine(
        resistanceLineRef,
      );

      removeLine(
        targetLineRef,
      );

      removeLine(
        invalidationLineRef,
      );


      if (
        overlays.support
        && Number.isFinite(
          analysis.support,
        )
      ) {
        supportLineRef.current =
          activeCandleSeries
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
      }


      if (
        overlays.resistance
        && Number.isFinite(
          analysis.resistance,
        )
      ) {
        resistanceLineRef.current =
          activeCandleSeries
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
      }


      if (
        overlays.target
        && analysis.target_price !== null
        && Number.isFinite(
          analysis.target_price,
        )
      ) {
        targetLineRef.current =
          activeCandleSeries
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
        overlays.invalidation
        && analysis.invalidation_price
        !== null
        && Number.isFinite(
          analysis.invalidation_price,
        )
      ) {
        invalidationLineRef.current =
          activeCandleSeries
            .createPriceLine({
              price:
                analysis
                  .invalidation_price,

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
    },
    [
      analysis.support,
      analysis.resistance,
      analysis.target_price,
      analysis.invalidation_price,
      overlays.support,
      overlays.resistance,
      overlays.target,
      overlays.invalidation,
    ],
  );


  /* =======================================================
     PATTERN MARKERS
  ======================================================= */

  useEffect(
    () => {
      const markerPlugin =
        markerPluginRef.current;


      if (
        !markerPlugin
      ) {
        return;
      }


      const markers =
        buildPatternMarkers(
          technicalPatterns
            .patterns,

          technicalPatterns
            .pivots,

          patterns,

          interval,
        );


      markerPlugin
        .setMarkers(
          markers,
        );
    },
    [
      technicalPatterns,
      patterns,
      interval,
    ],
  );


  /* =======================================================
     HISTORY EDGE
  ======================================================= */

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


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-900 bg-black">

      <div
        ref={
          containerRef
        }
        className="h-[440px] w-full"
      />


      {loadingMore && (
        <div className="absolute left-4 top-4 rounded-lg border border-zinc-800 bg-black/90 px-3 py-2 text-xs text-zinc-400 shadow-xl">
          Loading older candles…
        </div>
      )}


      {!hasMore && (
        <div className="absolute left-4 top-4 rounded-lg border border-zinc-800 bg-black/90 px-3 py-2 text-xs text-zinc-600">
          Oldest available data reached
        </div>
      )}

    </div>
  );
}