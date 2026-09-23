import type {
  BadgeTone,
  HistoryPoint,
} from "./types";


/* =========================================================
   BADGE TONES
========================================================= */

export function getSignalTone(
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


export function getRiskTone(
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


export function getActionTone(
  action: string,
): BadgeTone {
  const normalized =
    action
      .trim()
      .toLowerCase();

  if (
    normalized
    === "potential entry"
  ) {
    return "positive";
  }

  if (
    normalized
    === "avoid"
  ) {
    return "negative";
  }

  if (
    normalized
    === "extended"
    || normalized
    === "wait"
  ) {
    return "warning";
  }

  if (
    normalized
    === "watch"
  ) {
    return "info";
  }

  return "neutral";
}


/* =========================================================
   DISPLAY CLASSES
========================================================= */

export function getScoreClass(
  value: number,
) {
  if (value >= 75) {
    return "text-emerald-400";
  }

  if (value >= 60) {
    return "text-blue-400";
  }

  if (value >= 45) {
    return "text-amber-400";
  }

  return "text-red-400";
}


export function getRiskClass(
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


export function getRatioClass(
  value: number | null,
) {
  if (value === null) {
    return "text-zinc-300";
  }

  if (value >= 3) {
    return "text-emerald-400";
  }

  if (value >= 2) {
    return "text-cyan-400";
  }

  if (value >= 1.5) {
    return "text-blue-400";
  }

  if (value >= 1) {
    return "text-amber-400";
  }

  return "text-red-400";
}


export function getHorizonClass(
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


/* =========================================================
   RSI
========================================================= */

export function getRsiDescription(
  rsi: number,
) {
  if (rsi >= 70) {
    return "Overbought";
  }

  if (rsi <= 30) {
    return "Oversold";
  }

  if (rsi >= 55) {
    return "Positive momentum";
  }

  if (rsi <= 45) {
    return "Weak momentum";
  }

  return "Neutral momentum";
}


/* =========================================================
   NUMBER FORMATTING
========================================================= */

export function formatVolume(
  value: number,
) {
  if (value >= 1_000_000_000) {
    return `${(
      value
      / 1_000_000_000
    ).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(
      value
      / 1_000_000
    ).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(
      value
      / 1_000
    ).toFixed(1)}K`;
  }

  return value.toString();
}


export function formatOptionalPrice(
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

  return `$${value.toFixed(2)}`;
}


export function formatOptionalPercent(
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

  if (forcePositive) {
    return `+${Math.abs(
      value,
    ).toFixed(2)}%`;
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}


/* =========================================================
   SCORE HELPERS
========================================================= */

export function scoreWidth(
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


/* =========================================================
   HISTORY HELPERS
========================================================= */

export function mergeHistory(
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
    (a, b) =>
      new Date(
        a.date,
      ).getTime()
      - new Date(
        b.date,
      ).getTime(),
  );
}