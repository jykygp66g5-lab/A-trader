import type {
  CandleInterval,
  ChartRange,
  IntervalMode,
} from "./types";


/* =========================================================
   CHART RANGES
========================================================= */

export const chartRanges: ChartRange[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "MAX",
];


/* =========================================================
   INTERVAL BUTTONS
========================================================= */

export const intervalButtons: {
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


/* =========================================================
   RANGE PERIODS
========================================================= */

export const rangePeriods: Record<
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


/* =========================================================
   VALID INTERVALS
========================================================= */

export const validIntervals: Record<
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


/* =========================================================
   OLDER HISTORY WINDOWS
========================================================= */

export const olderWindowDays: Record<
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


/* =========================================================
   MARKET SETTINGS
========================================================= */

export const MARKET_REFRESH_INTERVAL =
  15_000;


export const quickSymbols = [
  "AAPL",
  "NVDA",
  "MSFT",
  "TSLA",
  "AMZN",
  "META",
];


/* =========================================================
   INTERVAL HELPERS
========================================================= */

export function getInitialInterval(
  range: ChartRange,
): CandleInterval {
  if (range === "1D") {
    return "5m";
  }

  if (range === "5D") {
    return "15m";
  }

  if (range === "1M") {
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


export function getAutomaticInterval(
  visibleDays: number,
): CandleInterval {
  if (visibleDays <= 1.5) {
    return "5m";
  }

  if (visibleDays <= 10) {
    return "15m";
  }

  if (visibleDays <= 45) {
    return "1h";
  }

  if (visibleDays <= 730) {
    return "1d";
  }

  return "1wk";
}