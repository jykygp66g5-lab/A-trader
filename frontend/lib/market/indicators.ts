import type {
  HistoryPoint,
} from "./types";


/* =========================================================
   TYPES
========================================================= */

export type IndicatorPoint = {
  date: string;
  value: number;
};


export type MovingAverageSet = {
  sma20: IndicatorPoint[];
  sma50: IndicatorPoint[];
  sma200: IndicatorPoint[];

  ema9: IndicatorPoint[];
  ema20: IndicatorPoint[];
};


/* =========================================================
   SIMPLE MOVING AVERAGE
========================================================= */

export function calculateSMA(
  history: HistoryPoint[],
  period: number,
): IndicatorPoint[] {
  if (
    period <= 0
    || history.length < period
  ) {
    return [];
  }


  const result:
    IndicatorPoint[] = [];


  let runningTotal = 0;


  for (
    let index = 0;
    index < history.length;
    index += 1
  ) {
    runningTotal +=
      history[index].close;


    if (
      index >= period
    ) {
      runningTotal -=
        history[
          index - period
        ].close;
    }


    if (
      index >= period - 1
    ) {
      result.push({
        date:
          history[index].date,

        value:
          runningTotal
          / period,
      });
    }
  }


  return result;
}


/* =========================================================
   EXPONENTIAL MOVING AVERAGE
========================================================= */

export function calculateEMA(
  history: HistoryPoint[],
  period: number,
): IndicatorPoint[] {
  if (
    period <= 0
    || history.length < period
  ) {
    return [];
  }


  const multiplier =
    2
    / (
      period
      + 1
    );


  const result:
    IndicatorPoint[] = [];


  let initialTotal = 0;


  for (
    let index = 0;
    index < period;
    index += 1
  ) {
    initialTotal +=
      history[index].close;
  }


  let previousEMA =
    initialTotal
    / period;


  result.push({
    date:
      history[
        period - 1
      ].date,

    value:
      previousEMA,
  });


  for (
    let index = period;
    index < history.length;
    index += 1
  ) {
    const close =
      history[index].close;


    const currentEMA =
      (
        close
        - previousEMA
      )
      * multiplier
      + previousEMA;


    result.push({
      date:
        history[index].date,

      value:
        currentEMA,
    });


    previousEMA =
      currentEMA;
  }


  return result;
}


/* =========================================================
   MOVING AVERAGE COLLECTION
========================================================= */

export function calculateMovingAverages(
  history: HistoryPoint[],
): MovingAverageSet {
  return {
    sma20:
      calculateSMA(
        history,
        20,
      ),

    sma50:
      calculateSMA(
        history,
        50,
      ),

    sma200:
      calculateSMA(
        history,
        200,
      ),

    ema9:
      calculateEMA(
        history,
        9,
      ),

    ema20:
      calculateEMA(
        history,
        20,
      ),
  };
}


/* =========================================================
   LATEST VALUE
========================================================= */

export function getLatestIndicatorValue(
  points: IndicatorPoint[],
): number | null {
  if (
    points.length === 0
  ) {
    return null;
  }


  return points[
    points.length - 1
  ].value;
}