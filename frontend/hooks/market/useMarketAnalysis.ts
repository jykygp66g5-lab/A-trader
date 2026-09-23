"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { api } from "@/lib/api";

import {
  MARKET_REFRESH_INTERVAL,
} from "@/lib/market/constants";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type UseMarketAnalysisOptions = {
  onAnalysisStart?:
    (symbol: string) => void;

  onAnalysisSuccess?:
    (
      analysis: MarketAnalysis,
    ) => Promise<void> | void;

  onAnalysisError?:
    () => void;
};


export default function useMarketAnalysis({
  onAnalysisStart,
  onAnalysisSuccess,
  onAnalysisError,
}: UseMarketAnalysisOptions = {}) {
  const [
    analysis,
    setAnalysis,
  ] = useState<
    MarketAnalysis | null
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


  const refreshRunningRef =
    useRef(
      false,
    );


  const onAnalysisStartRef =
    useRef(
      onAnalysisStart,
    );


  const onAnalysisSuccessRef =
    useRef(
      onAnalysisSuccess,
    );


  const onAnalysisErrorRef =
    useRef(
      onAnalysisError,
    );


  useEffect(
    () => {
      onAnalysisStartRef.current =
        onAnalysisStart;

      onAnalysisSuccessRef.current =
        onAnalysisSuccess;

      onAnalysisErrorRef.current =
        onAnalysisError;
    },
    [
      onAnalysisStart,
      onAnalysisSuccess,
      onAnalysisError,
    ],
  );


  /* =======================================================
     FULL ANALYSIS
  ======================================================= */

  const analyzeSymbol =
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
        ) {
          setError(
            "Enter a stock symbol.",
          );

          return null;
        }


        try {
          setLoading(
            true,
          );


          setError(
            "",
          );


          onAnalysisStartRef.current?.(
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


          const marketAnalysis =
            result as MarketAnalysis;


          setAnalysis(
            marketAnalysis,
          );


          await onAnalysisSuccessRef
            .current?.(
              marketAnalysis,
            );


          return marketAnalysis;

        } catch (
          err
        ) {
          setAnalysis(
            null,
          );


          onAnalysisErrorRef.current?.();


          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong.",
          );


          return null;

        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     SILENT REFRESH
  ======================================================= */

  const refreshAnalysis =
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


          const result =
            await response
              .json() as MarketAnalysis;


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
          // Silent refresh failures keep
          // the existing market analysis.

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
     AUTOMATIC REFRESH
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


      const refreshInterval =
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
          refreshInterval,
        );
      };
    },
    [
      analysis?.symbol,
      refreshAnalysis,
    ],
  );


  /* =======================================================
     REFRESH WHEN TAB BECOMES VISIBLE
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


  return {
    analysis,
    setAnalysis,

    loading,
    refreshing,

    error,
    setError,

    analyzeSymbol,
    refreshAnalysis,
  };
}