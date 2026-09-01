import { api } from "@/lib/api";


export type ReplayInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "1d";


export type ReplayBar = {
  date: string;

  open: number;
  high: number;
  low: number;
  close: number;

  volume: number;
};


export type ReplaySession = {
  symbol: string;

  interval: ReplayInterval;

  session_date: string;

  bars: ReplayBar[];

  total_bars: number;

  first_bar: string | null;
  last_bar: string | null;

  previous_close: number | null;

  session_open: number | null;
  session_high: number | null;
  session_low: number | null;
  session_close: number | null;

  total_volume: number;

  is_intraday: boolean;

  message: string;
};


export type LoadReplayOptions = {
  symbol: string;

  sessionDate: string;

  interval?: ReplayInterval;

  lookbackDays?: number;
};


export async function loadReplaySession({
  symbol,
  sessionDate,
  interval = "5m",
  lookbackDays = 90,
}: LoadReplayOptions): Promise<ReplaySession> {
  const ticker =
    symbol
      .trim()
      .toUpperCase();


  if (!ticker) {
    throw new Error(
      "Enter a stock symbol.",
    );
  }


  if (!sessionDate) {
    throw new Error(
      "Choose a replay date.",
    );
  }


  const params =
    new URLSearchParams({
      session_date:
        sessionDate,

      interval,

      lookback_days:
        String(
          lookbackDays,
        ),
    });


  const response =
    await api(
      `/replay/session/${encodeURIComponent(
        ticker,
      )}?${params.toString()}`,
    );


  const result =
    await response
      .json()
      .catch(
        () => null,
      );


  if (!response.ok) {
    throw new Error(
      result?.detail
      || "Could not load replay session.",
    );
  }


  return (
    result as ReplaySession
  );
}


export function getReplayPriceChange(
  currentPrice: number,
  previousClose:
    number | null,
): number {
  if (
    previousClose === null
    || previousClose === 0
  ) {
    return 0;
  }


  return (
    (
      currentPrice
      - previousClose
    )
    / previousClose
  ) * 100;
}


export function getReplayProgress(
  revealedBars: number,
  totalBars: number,
): number {
  if (
    totalBars <= 0
  ) {
    return 0;
  }


  return Math.min(
    100,
    Math.max(
      0,
      (
        revealedBars
        / totalBars
      ) * 100,
    ),
  );
}


export function formatReplayVolume(
  value: number,
): string {
  if (
    value
    >= 1_000_000_000
  ) {
    return `${(
      value
      / 1_000_000_000
    ).toFixed(2)}B`;
  }


  if (
    value
    >= 1_000_000
  ) {
    return `${(
      value
      / 1_000_000
    ).toFixed(2)}M`;
  }


  if (
    value
    >= 1_000
  ) {
    return `${(
      value
      / 1_000
    ).toFixed(1)}K`;
  }


  return String(
    value,
  );
}


export function formatReplayPrice(
  value:
    number | null,
): string {
  if (value === null) {
    return "—";
  }


  return `$${value.toFixed(
    2,
  )}`;
}