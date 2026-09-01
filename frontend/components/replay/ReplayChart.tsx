"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import type {
  ReplayBar,
} from "@/lib/replay";

import type {
  ReplayTradeMarker,
} from "@/components/replay/ReplayTradePanel";


type ReplaySpeed =
  | 1
  | 2
  | 5
  | 10;


type ReplayChartProps = {
  bars: ReplayBar[];

  interval: string;

  symbol: string;

  tradeMarkers?: ReplayTradeMarker[];

  rewindLocked?: boolean;

  onProgressChange?: (
    visibleBars: ReplayBar[],
  ) => void;
};


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


export default function ReplayChart({
  bars,
  interval,
  symbol,
  tradeMarkers = [],
  rewindLocked = false,
  onProgressChange,
}: ReplayChartProps) {
  const containerRef =
    useRef<
      HTMLDivElement | null
    >(null);


  const chartRef =
    useRef<
      IChartApi | null
    >(null);


  const candleSeriesRef =
    useRef<
      ISeriesApi<
        "Candlestick"
      > | null
    >(null);


  const volumeSeriesRef =
    useRef<
      ISeriesApi<
        "Histogram"
      > | null
    >(null);


  const markerPluginRef =
    useRef<
      ISeriesMarkersPluginApi<
        Time
      > | null
    >(null);


  const [
    revealedCount,
    setRevealedCount,
  ] = useState(
    Math.min(
      10,
      bars.length,
    ),
  );


  const [
    playing,
    setPlaying,
  ] = useState(
    false,
  );


  const [
    speed,
    setSpeed,
  ] = useState<
    ReplaySpeed
  >(
    1,
  );


  const visibleBars =
    useMemo(
      () => {
        return bars.slice(
          0,
          revealedCount,
        );
      },
      [
        bars,
        revealedCount,
      ],
    );


  const currentBar =
    visibleBars.length > 0
      ? visibleBars[
          visibleBars.length - 1
        ]
      : null;


  const progress =
    bars.length > 0
      ? (
          revealedCount
          / bars.length
        ) * 100
      : 0;


  const finished =
    revealedCount
    >= bars.length;


  useEffect(
    () => {
      setRevealedCount(
        Math.min(
          10,
          bars.length,
        ),
      );

      setPlaying(
        false,
      );
    },
    [
      bars,
    ],
  );


  useEffect(
    () => {
      if (
        !playing
        || finished
      ) {
        return;
      }


      const delay =
        Math.max(
          100,
          1000
          / speed,
        );


      const timer =
        window.setInterval(
          () => {
            setRevealedCount(
              (
                current,
              ) => {
                const next =
                  Math.min(
                    current + 1,
                    bars.length,
                  );


                if (
                  next
                  >= bars.length
                ) {
                  setPlaying(
                    false,
                  );
                }


                return next;
              },
            );
          },
          delay,
        );


      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      playing,
      speed,
      finished,
      bars.length,
    ],
  );


  useEffect(
    () => {
      onProgressChange?.(
        visibleBars,
      );
    },
    [
      visibleBars,
      onProgressChange,
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


      const chart =
        createChart(
          container,
          {
            width:
              container.clientWidth,

            height:
              460,

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
                interval !== "1d",

              secondsVisible:
                false,

              rightOffset:
                5,

              barSpacing:
                9,

              minBarSpacing:
                3,

              fixRightEdge:
                true,

              lockVisibleTimeRangeOnResize:
                true,
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


      markerPluginRef.current =
        createSeriesMarkers(
          candleSeries,
          [],
        );


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


      const resizeObserver =
        new ResizeObserver(
          () => {
            chart.applyOptions({
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
        resizeObserver.disconnect();

        chart.remove();

        chartRef.current =
          null;

        candleSeriesRef.current =
          null;

        volumeSeriesRef.current =
          null;

        markerPluginRef.current =
          null;
      };
    },
    [
      interval,
      symbol,
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
        || visibleBars.length === 0
      ) {
        return;
      }


      candleSeries.setData(
        visibleBars.map(
          (
            bar,
          ) => ({
            time:
              toChartTime(
                bar.date,
              ),

            open:
              bar.open,

            high:
              bar.high,

            low:
              bar.low,

            close:
              bar.close,
          }),
        ),
      );


      volumeSeries.setData(
        visibleBars.map(
          (
            bar,
          ) => ({
            time:
              toChartTime(
                bar.date,
              ),

            value:
              bar.volume,

            color:
              bar.close
              >= bar.open
                ? "#34d39966"
                : "#f8717166",
          }),
        ),
      );


      chart
        .timeScale()
        .scrollToRealTime();
    },
    [
      visibleBars,
    ],
  );


  useEffect(
    () => {
      const markerPlugin =
        markerPluginRef.current;


      if (!markerPlugin) {
        return;
      }


      const visibleTimes =
        new Set(
          visibleBars.map(
            (
              bar,
            ) =>
              toChartTime(
                bar.date,
              ),
          ),
        );


      const markers:
        SeriesMarker<
          Time
        >[] =
        tradeMarkers
          .filter(
            (
              marker,
            ) => {
              return visibleTimes.has(
                toChartTime(
                  marker.time,
                ),
              );
            },
          )
          .map(
            (
              marker,
            ) => {
              const time =
                toChartTime(
                  marker.time,
                );


              if (
                marker.kind
                === "long-entry"
              ) {
                return {
                  id:
                    marker.id,

                  time,

                  position:
                    "belowBar",

                  color:
                    "#34d399",

                  shape:
                    "arrowUp",

                  text:
                    `Long $${marker.price.toFixed(
                      2,
                    )}`,

                  size:
                    1.2,
                };
              }


              if (
                marker.kind
                === "short-entry"
              ) {
                return {
                  id:
                    marker.id,

                  time,

                  position:
                    "aboveBar",

                  color:
                    "#f87171",

                  shape:
                    "arrowDown",

                  text:
                    `Short $${marker.price.toFixed(
                      2,
                    )}`,

                  size:
                    1.2,
                };
              }


              return {
                id:
                  marker.id,

                time,

                position:
                  "inBar",

                color:
                  "#ffffff",

                shape:
                  "circle",

                text:
                  `Exit $${marker.price.toFixed(
                    2,
                  )}`,

                size:
                  1,
              };
            },
          );


      markerPlugin.setMarkers(
        markers,
      );
    },
    [
      tradeMarkers,
      visibleBars,
    ],
  );


  function nextCandle() {
    setPlaying(
      false,
    );


    setRevealedCount(
      (
        current,
      ) =>
        Math.min(
          current + 1,
          bars.length,
        ),
    );
  }


  function previousCandle() {
    if (
      rewindLocked
    ) {
      return;
    }


    setPlaying(
      false,
    );


    setRevealedCount(
      (
        current,
      ) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }


  function restart() {
    if (
      rewindLocked
    ) {
      return;
    }


    setPlaying(
      false,
    );


    setRevealedCount(
      Math.min(
        10,
        bars.length,
      ),
    );
  }


  return (
    <div className="space-y-4">

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-black/40 p-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h3 className="font-semibold">
              {
                symbol
              }
            </h3>


            <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
              {
                interval
              }
            </span>


            {currentBar && (
              <span className="text-xs text-zinc-500">
                {
                  new Date(
                    currentBar.date,
                  )
                    .toLocaleString()
                }
              </span>
            )}

          </div>


          {currentBar && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">

              <span>
                O{" "}
                <strong className="text-zinc-200">
                  $
                  {
                    currentBar.open
                      .toFixed(2)
                  }
                </strong>
              </span>


              <span>
                H{" "}
                <strong className="text-zinc-200">
                  $
                  {
                    currentBar.high
                      .toFixed(2)
                  }
                </strong>
              </span>


              <span>
                L{" "}
                <strong className="text-zinc-200">
                  $
                  {
                    currentBar.low
                      .toFixed(2)
                  }
                </strong>
              </span>


              <span>
                C{" "}
                <strong className="text-zinc-200">
                  $
                  {
                    currentBar.close
                      .toFixed(2)
                  }
                </strong>
              </span>

            </div>
          )}

        </div>


        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"

            onClick={
              restart
            }

            disabled={
              rewindLocked
            }

            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Restart
          </button>


          <button
            type="button"

            onClick={
              previousCandle
            }

            disabled={
              rewindLocked
              || revealedCount <= 1
            }

            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ←
          </button>


          <button
            type="button"

            onClick={() =>
              setPlaying(
                (
                  current,
                ) =>
                  !current,
              )
            }

            disabled={
              finished
            }

            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {
              playing
                ? "Pause"
                : "Play"
            }
          </button>


          <button
            type="button"

            onClick={
              nextCandle
            }

            disabled={
              finished
            }

            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>


          <select
            value={
              speed
            }

            onChange={(
              event,
            ) => {
              const value =
                Number(
                  event.target.value,
                );


              if (
                value === 1
                || value === 2
                || value === 5
                || value === 10
              ) {
                setSpeed(
                  value,
                );
              }
            }}

            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none"
          >
            <option value="1">
              1×
            </option>

            <option value="2">
              2×
            </option>

            <option value="5">
              5×
            </option>

            <option value="10">
              10×
            </option>
          </select>

        </div>

      </div>


      {rewindLocked && (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-4 py-2 text-xs text-amber-300">
          Rewind is locked while a position is open.
        </div>
      )}


      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">

        <div
          ref={
            containerRef
          }

          className="h-[460px] w-full"
        />

      </div>


      <div className="space-y-2">

        <div className="flex items-center justify-between text-xs text-zinc-500">

          <span>
            Candle{" "}
            {
              revealedCount
            }
            {" / "}
            {
              bars.length
            }
          </span>


          <span>
            {
              progress
                .toFixed(0)
            }%
          </span>

        </div>


        <div className="h-2 overflow-hidden rounded-full bg-zinc-900">

          <div
            className="h-full bg-white transition-all"

            style={{
              width:
                `${progress}%`,
            }}
          />

        </div>

      </div>

    </div>
  );
}