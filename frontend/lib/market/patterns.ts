import type {
  HistoryPoint,
} from "./types";

import {
  calculateSMA,
  type IndicatorPoint,
} from "./indicators";


/* =========================================================
   TYPES
========================================================= */

export type PivotType =
  | "high"
  | "low";


export type PivotPoint = {
  index: number;
  date: string;
  price: number;
  type: PivotType;
};


export type PatternDirection =
  | "bullish"
  | "bearish"
  | "neutral";


export type PatternType =
  | "breakout"
  | "breakdown"
  | "double-top"
  | "double-bottom"
  | "golden-cross"
  | "death-cross";


export type DetectedPattern = {
  id: string;

  type: PatternType;

  name: string;

  direction:
    PatternDirection;

  startDate: string;

  endDate: string;

  confirmationDate:
    string | null;

  level:
    number | null;

  secondaryLevel:
    number | null;

  confidence:
    number;

  description:
    string;

  points:
    PivotPoint[];
};


export type PatternDetectionResult = {
  pivots: PivotPoint[];

  patterns:
    DetectedPattern[];
};


/* =========================================================
   HELPERS
========================================================= */

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value,
    ),
  );
}


function percentDifference(
  first: number,
  second: number,
) {
  if (
    first === 0
    || second === 0
  ) {
    return Infinity;
  }


  const average =
    (
      Math.abs(first)
      + Math.abs(second)
    )
    / 2;


  return (
    Math.abs(
      first - second,
    )
    / average
  ) * 100;
}


function averageVolume(
  history: HistoryPoint[],
  endIndex: number,
  period = 20,
) {
  const startIndex =
    Math.max(
      0,
      endIndex
      - period,
    );


  const points =
    history.slice(
      startIndex,
      endIndex,
    );


  if (
    points.length === 0
  ) {
    return 0;
  }


  return (
    points.reduce(
      (
        total,
        point,
      ) =>
        total
        + point.volume,
      0,
    )
    / points.length
  );
}


function makePatternId(
  type: PatternType,
  date: string,
) {
  return `${type}-${date}`;
}


/* =========================================================
   SWING / PIVOT DETECTION
========================================================= */

export function detectPivots(
  history: HistoryPoint[],
  leftBars = 3,
  rightBars = 3,
): PivotPoint[] {
  if (
    history.length
    < leftBars
    + rightBars
    + 1
  ) {
    return [];
  }


  const pivots:
    PivotPoint[] = [];


  for (
    let index = leftBars;
    index
    < history.length
    - rightBars;
    index += 1
  ) {
    const current =
      history[index];


    let isHigh =
      true;


    let isLow =
      true;


    for (
      let offset = 1;
      offset
      <= leftBars;
      offset += 1
    ) {
      if (
        current.high
        <= history[
          index - offset
        ].high
      ) {
        isHigh =
          false;
      }


      if (
        current.low
        >= history[
          index - offset
        ].low
      ) {
        isLow =
          false;
      }
    }


    for (
      let offset = 1;
      offset
      <= rightBars;
      offset += 1
    ) {
      if (
        current.high
        <= history[
          index + offset
        ].high
      ) {
        isHigh =
          false;
      }


      if (
        current.low
        >= history[
          index + offset
        ].low
      ) {
        isLow =
          false;
      }
    }


    if (
      isHigh
    ) {
      pivots.push({
        index,
        date:
          current.date,
        price:
          current.high,
        type:
          "high",
      });
    }


    if (
      isLow
    ) {
      pivots.push({
        index,
        date:
          current.date,
        price:
          current.low,
        type:
          "low",
      });
    }
  }


  return pivots.sort(
    (
      first,
      second,
    ) =>
      first.index
      - second.index,
  );
}


/* =========================================================
   BREAKOUTS / BREAKDOWNS
========================================================= */

function detectBreakouts(
  history: HistoryPoint[],
): DetectedPattern[] {
  if (
    history.length
    < 25
  ) {
    return [];
  }


  const patterns:
    DetectedPattern[] = [];


  const lookback =
    20;


  for (
    let index = lookback;
    index < history.length;
    index += 1
  ) {
    const current =
      history[index];


    const previousWindow =
      history.slice(
        index - lookback,
        index,
      );


    const resistance =
      Math.max(
        ...previousWindow.map(
          (
            point,
          ) =>
            point.high,
        ),
      );


    const support =
      Math.min(
        ...previousWindow.map(
          (
            point,
          ) =>
            point.low,
        ),
      );


    const previousClose =
      history[
        index - 1
      ].close;


    const avgVolume =
      averageVolume(
        history,
        index,
        20,
      );


    const volumeRatio =
      avgVolume > 0
        ? current.volume
          / avgVolume
        : 1;


    const breakoutBuffer =
      resistance
      * 0.001;


    const breakdownBuffer =
      support
      * 0.001;


    const bullishBreakout =
      previousClose
      <= resistance
      && current.close
      > resistance
      + breakoutBuffer;


    const bearishBreakdown =
      previousClose
      >= support
      && current.close
      < support
      - breakdownBuffer;


    if (
      bullishBreakout
    ) {
      const distance =
        (
          (
            current.close
            - resistance
          )
          / resistance
        )
        * 100;


      const confidence =
        clamp(
          55
          + Math.min(
              distance
              * 10,
              20,
            )
          + Math.min(
              Math.max(
                volumeRatio
                - 1,
                0,
              )
              * 15,
              25,
            ),
          0,
          100,
        );


      patterns.push({
        id:
          makePatternId(
            "breakout",
            current.date,
          ),

        type:
          "breakout",

        name:
          "Breakout",

        direction:
          "bullish",

        startDate:
          previousWindow[
            0
          ].date,

        endDate:
          current.date,

        confirmationDate:
          current.date,

        level:
          resistance,

        secondaryLevel:
          null,

        confidence:
          Math.round(
            confidence,
          ),

        description:
          volumeRatio
          >= 1.2
            ? "Price closed above recent resistance with elevated volume."
            : "Price closed above recent resistance.",

        points: [],
      });
    }


    if (
      bearishBreakdown
    ) {
      const distance =
        (
          (
            support
            - current.close
          )
          / support
        )
        * 100;


      const confidence =
        clamp(
          55
          + Math.min(
              distance
              * 10,
              20,
            )
          + Math.min(
              Math.max(
                volumeRatio
                - 1,
                0,
              )
              * 15,
              25,
            ),
          0,
          100,
        );


      patterns.push({
        id:
          makePatternId(
            "breakdown",
            current.date,
          ),

        type:
          "breakdown",

        name:
          "Breakdown",

        direction:
          "bearish",

        startDate:
          previousWindow[
            0
          ].date,

        endDate:
          current.date,

        confirmationDate:
          current.date,

        level:
          support,

        secondaryLevel:
          null,

        confidence:
          Math.round(
            confidence,
          ),

        description:
          volumeRatio
          >= 1.2
            ? "Price closed below recent support with elevated volume."
            : "Price closed below recent support.",

        points: [],
      });
    }
  }


  return patterns;
}


/* =========================================================
   DOUBLE TOP
========================================================= */

function detectDoubleTops(
  history: HistoryPoint[],
  pivots: PivotPoint[],
): DetectedPattern[] {
  const highs =
    pivots.filter(
      (
        pivot,
      ) =>
        pivot.type
        === "high",
    );


  const patterns:
    DetectedPattern[] = [];


  for (
    let index = 1;
    index < highs.length;
    index += 1
  ) {
    const first =
      highs[
        index - 1
      ];


    const second =
      highs[
        index
      ];


    const spacing =
      second.index
      - first.index;


    if (
      spacing < 5
      || spacing > 80
    ) {
      continue;
    }


    const difference =
      percentDifference(
        first.price,
        second.price,
      );


    if (
      difference > 2.5
    ) {
      continue;
    }


    const between =
      history.slice(
        first.index,
        second.index
        + 1,
      );


    if (
      between.length
      < 3
    ) {
      continue;
    }


    const neckline =
      Math.min(
        ...between.map(
          (
            point,
          ) =>
            point.low,
        ),
      );


    const peakAverage =
      (
        first.price
        + second.price
      )
      / 2;


    const pullbackDepth =
      (
        (
          peakAverage
          - neckline
        )
        / peakAverage
      )
      * 100;


    if (
      pullbackDepth
      < 1
    ) {
      continue;
    }


    const confidence =
      clamp(
        60
        + Math.max(
            0,
            20
            - difference
            * 6,
          )
        + Math.min(
            pullbackDepth
            * 2,
            20,
          ),
        0,
        100,
      );


    patterns.push({
      id:
        makePatternId(
          "double-top",
          second.date,
        ),

      type:
        "double-top",

      name:
        "Double Top",

      direction:
        "bearish",

      startDate:
        first.date,

      endDate:
        second.date,

      confirmationDate:
        null,

      level:
        peakAverage,

      secondaryLevel:
        neckline,

      confidence:
        Math.round(
          confidence,
        ),

      description:
        "Two similar swing highs formed with a pullback between them.",

      points: [
        first,
        second,
      ],
    });
  }


  return patterns;
}


/* =========================================================
   DOUBLE BOTTOM
========================================================= */

function detectDoubleBottoms(
  history: HistoryPoint[],
  pivots: PivotPoint[],
): DetectedPattern[] {
  const lows =
    pivots.filter(
      (
        pivot,
      ) =>
        pivot.type
        === "low",
    );


  const patterns:
    DetectedPattern[] = [];


  for (
    let index = 1;
    index < lows.length;
    index += 1
  ) {
    const first =
      lows[
        index - 1
      ];


    const second =
      lows[
        index
      ];


    const spacing =
      second.index
      - first.index;


    if (
      spacing < 5
      || spacing > 80
    ) {
      continue;
    }


    const difference =
      percentDifference(
        first.price,
        second.price,
      );


    if (
      difference > 2.5
    ) {
      continue;
    }


    const between =
      history.slice(
        first.index,
        second.index
        + 1,
      );


    if (
      between.length
      < 3
    ) {
      continue;
    }


    const neckline =
      Math.max(
        ...between.map(
          (
            point,
          ) =>
            point.high,
        ),
      );


    const bottomAverage =
      (
        first.price
        + second.price
      )
      / 2;


    const recoveryHeight =
      (
        (
          neckline
          - bottomAverage
        )
        / bottomAverage
      )
      * 100;


    if (
      recoveryHeight
      < 1
    ) {
      continue;
    }


    const confidence =
      clamp(
        60
        + Math.max(
            0,
            20
            - difference
            * 6,
          )
        + Math.min(
            recoveryHeight
            * 2,
            20,
          ),
        0,
        100,
      );


    patterns.push({
      id:
        makePatternId(
          "double-bottom",
          second.date,
        ),

      type:
        "double-bottom",

      name:
        "Double Bottom",

      direction:
        "bullish",

      startDate:
        first.date,

      endDate:
        second.date,

      confirmationDate:
        null,

      level:
        bottomAverage,

      secondaryLevel:
        neckline,

      confidence:
        Math.round(
          confidence,
        ),

      description:
        "Two similar swing lows formed with a recovery between them.",

      points: [
        first,
        second,
      ],
    });
  }


  return patterns;
}


/* =========================================================
   MOVING AVERAGE CROSS HELPERS
========================================================= */

function indicatorMap(
  points: IndicatorPoint[],
) {
  return new Map(
    points.map(
      (
        point,
      ) => [
        point.date,
        point.value,
      ],
    ),
  );
}


/* =========================================================
   GOLDEN CROSS / DEATH CROSS
========================================================= */

function detectMovingAverageCrosses(
  history: HistoryPoint[],
): DetectedPattern[] {
  if (
    history.length < 200
  ) {
    return [];
  }


  const sma50 =
    calculateSMA(
      history,
      50,
    );


  const sma200 =
    calculateSMA(
      history,
      200,
    );


  const shortMap =
    indicatorMap(
      sma50,
    );


  const longMap =
    indicatorMap(
      sma200,
    );


  const comparable =
    history
      .map(
        (
          point,
        ) => ({
          date:
            point.date,

          short:
            shortMap.get(
              point.date,
            ),

          long:
            longMap.get(
              point.date,
            ),
        }),
      )
      .filter(
        (
          point,
        ): point is {
          date: string;
          short: number;
          long: number;
        } =>
          point.short
          !== undefined
          && point.long
          !== undefined,
      );


  const patterns:
    DetectedPattern[] = [];


  for (
    let index = 1;
    index < comparable.length;
    index += 1
  ) {
    const previous =
      comparable[
        index - 1
      ];


    const current =
      comparable[
        index
      ];


    const goldenCross =
      previous.short
      <= previous.long
      && current.short
      > current.long;


    const deathCross =
      previous.short
      >= previous.long
      && current.short
      < current.long;


    if (
      goldenCross
    ) {
      patterns.push({
        id:
          makePatternId(
            "golden-cross",
            current.date,
          ),

        type:
          "golden-cross",

        name:
          "Golden Cross",

        direction:
          "bullish",

        startDate:
          previous.date,

        endDate:
          current.date,

        confirmationDate:
          current.date,

        level:
          current.short,

        secondaryLevel:
          current.long,

        confidence:
          75,

        description:
          "The 50-period moving average crossed above the 200-period moving average.",

        points: [],
      });
    }


    if (
      deathCross
    ) {
      patterns.push({
        id:
          makePatternId(
            "death-cross",
            current.date,
          ),

        type:
          "death-cross",

        name:
          "Death Cross",

        direction:
          "bearish",

        startDate:
          previous.date,

        endDate:
          current.date,

        confirmationDate:
          current.date,

        level:
          current.short,

        secondaryLevel:
          current.long,

        confidence:
          75,

        description:
          "The 50-period moving average crossed below the 200-period moving average.",

        points: [],
      });
    }
  }


  return patterns;
}


/* =========================================================
   REMOVE DUPLICATE / NEARBY PATTERNS
========================================================= */

function reduceNearbyPatterns(
  patterns: DetectedPattern[],
) {
  const sorted =
    [...patterns].sort(
      (
        first,
        second,
      ) =>
        new Date(
          first.endDate,
        ).getTime()
        - new Date(
          second.endDate,
        ).getTime(),
    );


  const result:
    DetectedPattern[] = [];


  for (
    const pattern
    of sorted
  ) {
    const previous =
      result[
        result.length - 1
      ];


    if (
      previous
      && previous.type
      === pattern.type
    ) {
      const difference =
        Math.abs(
          new Date(
            pattern.endDate,
          ).getTime()
          - new Date(
            previous.endDate,
          ).getTime(),
        );


      const twelveHours =
        12
        * 60
        * 60
        * 1000;


      if (
        difference
        < twelveHours
      ) {
        if (
          pattern.confidence
          > previous.confidence
        ) {
          result[
            result.length - 1
          ] =
            pattern;
        }


        continue;
      }
    }


    result.push(
      pattern,
    );
  }


  return result;
}


/* =========================================================
   MAIN DETECTOR
========================================================= */

export function detectTechnicalPatterns(
  history: HistoryPoint[],
): PatternDetectionResult {
  if (
    history.length === 0
  ) {
    return {
      pivots: [],
      patterns: [],
    };
  }


  const pivots =
    detectPivots(
      history,
    );


  const patterns = [
    ...detectBreakouts(
      history,
    ),

    ...detectDoubleTops(
      history,
      pivots,
    ),

    ...detectDoubleBottoms(
      history,
      pivots,
    ),

    ...detectMovingAverageCrosses(
      history,
    ),
  ];


  return {
    pivots,

    patterns:
      reduceNearbyPatterns(
        patterns,
      ),
  };
}