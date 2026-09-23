/* =========================================================
   MARKET TYPES
========================================================= */

export type HistoryPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};


export type MarketAnalysis = {
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


export type ChartRange =
  | "1D"
  | "5D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "5Y"
  | "MAX";


export type CandleInterval =
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "1d"
  | "1wk";


export type IntervalMode =
  | "auto"
  | CandleInterval;


export type MarketHistoryResponse = {
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


export type VisibleUnixRange = {
  from: number;
  to: number;
};


export type BadgeTone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info";