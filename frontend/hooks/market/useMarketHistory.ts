 "use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { api } from "@/lib/api";

import {
  getAutomaticInterval,
  getInitialInterval,
  olderWindowDays,
  rangePeriods,
  validIntervals,
} from "@/lib/market/constants";

import {
  mergeHistory,
} from "@/lib/market/formatters";

import type {
  CandleInterval,
  ChartRange,
  HistoryPoint,
  IntervalMode,
  MarketHistoryResponse,
  VisibleUnixRange,
} from "@/lib/market/types";


export default function useMarketHistory() {
  const [
    chartRange,
    setChartRange,
  ] = useState<ChartRange>(
    "3M",
  );


  const [
    intervalMode,
    setIntervalMode,
  ] = useState<IntervalMode>(
    "auto",
  );


  const [
    actualInterval,
    setActualInterval,
  ] = useState<CandleInterval>(
    "1d",
  );


  const [
    historyData,
    setHistoryData,
  ] = useState<HistoryPoint[]>(
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
    VisibleUnixRange | null
  >(
    null,
  );


  const autoSwitchRef =
    useRef(
      false,
    );


  /* =======================================================
     RESET
  ======================================================= */

  const resetHistory =
    useCallback(
      () => {
        setHistoryData(
          [],
        );


        setHasMoreHistory(
          true,
        );


        setRestoreRange(
          null,
        );
      },
      [],
    );


  /* =======================================================
     INITIAL HISTORY
  ======================================================= */

  const loadInitialHistory =
    useCallback(
      async (
        tickerInput: string,

        range:
          ChartRange,

        interval:
          CandleInterval,

        preserve:
          VisibleUnixRange | null
          = null,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
        ) {
          throw new Error(
            "A market symbol is required.",
          );
        }


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


          const history =
            result as MarketHistoryResponse;


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


          return history;

        } finally {
          setHistoryLoading(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     LOAD HISTORY FOR A NEW ANALYSIS
  ======================================================= */

  const loadHistoryForSymbol =
    useCallback(
      async (
        ticker: string,
      ) => {
        resetHistory();


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
      },
      [
        intervalMode,
        chartRange,
        loadInitialHistory,
        resetHistory,
      ],
    );


  /* =======================================================
     CHANGE RANGE
  ======================================================= */

  const changeRange =
    useCallback(
      async (
        tickerInput: string,
        next: ChartRange,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
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


        await loadInitialHistory(
          ticker,
          next,
          nextInterval,
        );
      },
      [
        intervalMode,
        loadInitialHistory,
      ],
    );


  /* =======================================================
     CHANGE INTERVAL
  ======================================================= */

  const changeInterval =
    useCallback(
      async (
        tickerInput: string,
        next: IntervalMode,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
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


        await loadInitialHistory(
          ticker,
          chartRange,
          nextInterval,
        );
      },
      [
        chartRange,
        loadInitialHistory,
      ],
    );


  /* =======================================================
     LOAD OLDER HISTORY
  ======================================================= */

  const loadOlderHistory =
    useCallback(
      async (
        tickerInput: string,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
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
              ticker,
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


          const history =
            result as MarketHistoryResponse;


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
        tickerInput: string,

        visibleDays: number,

        range:
          VisibleUnixRange,
      ) => {
        const ticker =
          tickerInput
            .trim()
            .toUpperCase();


        if (
          !ticker
          || intervalMode
          !== "auto"
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
            ticker,
            chartRange,
            target,
            range,
          );

        } catch {
          // Keep the current chart if
          // automatic switching fails.

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


        if (
          !Number.isFinite(
            first,
          )
          || first === 0
          || !Number.isFinite(
            last,
          )
        ) {
          return 0;
        }


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


  return {
    chartRange,
    intervalMode,
    actualInterval,

    historyData,
    hasMoreHistory,
    historyLoading,
    loadingMore,
    restoreRange,

    chartPerformance,

    resetHistory,
    loadInitialHistory,
    loadHistoryForSymbol,
    changeRange,
    changeInterval,
    loadOlderHistory,
    handleVisibleRangeChange,
  };
}