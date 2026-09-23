"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";


type LessonLevel =
  | "Beginner"
  | "Intermediate";


type LessonSection = {
  title: string;
  content: string;
};


type LessonExample = {
  title: string;
  content: string;
};


type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};


type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: LessonLevel;
  points: string[];
  sections: LessonSection[];
  example: LessonExample;
  quiz: QuizQuestion[];
};


type LearningModule = {
  id: string;
  number: string;
  title: string;
  description: string;
  lessons: Lesson[];
};


const MODULES: LearningModule[] = [
  {
    id: "foundations",
    number: "01",
    title: "Trading Foundations",
    description:
      "Understand what markets are, how trades work and the basic language every trader should know.",

    lessons: [
      {
        id: "markets",
        title: "How financial markets work",
        description:
          "Learn what happens when buyers and sellers meet in a market.",
        duration: "6 min",
        level: "Beginner",

        points: [
          "Stocks",
          "Buyers and sellers",
          "Bid and ask",
          "Spread",
          "Liquidity",
          "Price movement",
        ],

        sections: [
          {
            title: "What a stock represents",
            content:
              "A stock represents partial ownership in a company. Public companies divide ownership into shares that can be bought and sold by investors and traders.",
          },
          {
            title: "Buyers and sellers",
            content:
              "Every completed trade requires a buyer and a seller. Buyers compete by offering prices they are willing to pay, while sellers offer prices they are willing to accept.",
          },
          {
            title: "Bid and ask",
            content:
              "The bid is the highest current price a buyer is offering. The ask is the lowest current price a seller is offering.",
          },
          {
            title: "The spread",
            content:
              "The difference between the bid and ask is called the spread. Highly liquid stocks often have smaller spreads because many buyers and sellers are competing.",
          },
          {
            title: "Why prices move",
            content:
              "Price changes when buyers or sellers become more aggressive. Strong buying pressure can push transactions to higher prices, while aggressive selling can push them lower.",
          },
          {
            title: "Liquidity",
            content:
              "Liquidity describes how easily an asset can be bought or sold without creating a large price change. Higher liquidity generally improves execution.",
          },
        ],

        example: {
          title: "Bid and ask example",
          content:
            "AAPL shows a bid of $200.00 and an ask of $200.02. A market buyer may pay about $200.02 because that is the lowest price currently offered by a seller.",
        },

        quiz: [
          {
            question:
              "What does the bid represent?",
            options: [
              "The highest price a buyer is willing to pay",
              "The lowest price a seller will accept",
              "Yesterday's closing price",
              "The company's fair value",
            ],
            correctIndex: 0,
            explanation:
              "The bid is the highest current buying offer.",
          },
          {
            question:
              "What is the spread?",
            options: [
              "The difference between bid and ask",
              "The day's total volume",
              "The daily high minus the low",
              "The profit on a trade",
            ],
            correctIndex: 0,
            explanation:
              "The spread measures the gap between the best bid and best ask.",
          },
          {
            question:
              "What can aggressive buying pressure do?",
            options: [
              "Push price higher",
              "Guarantee price falls",
              "Stop all trading",
              "Remove the spread permanently",
            ],
            correctIndex: 0,
            explanation:
              "Aggressive buyers can accept increasingly higher prices.",
          },
        ],
      },

      {
        id: "orders",
        title: "Market, limit and stop orders",
        description:
          "Understand the most common order types and how execution differs.",
        duration: "7 min",
        level: "Beginner",

        points: [
          "Market orders",
          "Limit orders",
          "Stop orders",
          "Stop-limit orders",
          "Slippage",
        ],

        sections: [
          {
            title: "Why order types matter",
            content:
              "Different order types give traders different levels of control over execution speed and execution price.",
          },
          {
            title: "Market orders",
            content:
              "A market order requests immediate execution at the best available price. Execution is prioritized over receiving an exact price.",
          },
          {
            title: "Limit orders",
            content:
              "A limit order defines the maximum price you will pay when buying or the minimum price you will accept when selling.",
          },
          {
            title: "Stop orders",
            content:
              "A stop order becomes active after price reaches a specified trigger level. Stops are commonly used to exit positions when the original trade idea fails.",
          },
          {
            title: "Stop-limit orders",
            content:
              "A stop-limit order becomes a limit order after its stop trigger is reached. This gives price control but creates the possibility that the order never fills.",
          },
          {
            title: "Slippage",
            content:
              "Slippage occurs when your actual execution price differs from the price you expected. Fast markets and low liquidity can increase slippage.",
          },
        ],

        example: {
          title: "Market versus limit",
          content:
            "A stock trades with a $50.00 bid and $50.05 ask. A market buy attempts immediate execution near the available ask. A $50.00 limit buy waits for shares to become available at $50.00 or lower.",
        },

        quiz: [
          {
            question:
              "What does a market order prioritize?",
            options: [
              "Fast execution",
              "An exact guaranteed price",
              "Guaranteed profit",
              "Zero slippage",
            ],
            correctIndex: 0,
            explanation:
              "Market orders prioritize execution rather than a specific price.",
          },
          {
            question:
              "What is one risk of a limit order?",
            options: [
              "It may not execute",
              "It always creates slippage",
              "It cannot be cancelled",
              "It guarantees a loss",
            ],
            correctIndex: 0,
            explanation:
              "Price may never reach your limit.",
          },
          {
            question:
              "What is slippage?",
            options: [
              "The difference between expected and actual execution price",
              "The difference between daily high and low",
              "Broker interest",
              "The bid price",
            ],
            correctIndex: 0,
            explanation:
              "Slippage is the difference between expected and actual fill price.",
          },
        ],
      },

      {
        id: "long-short",
        title: "Long vs Short",
        description:
          "Learn how traders can participate in rising and falling markets.",
        duration: "5 min",
        level: "Beginner",

        points: [
          "Long positions",
          "Short positions",
          "Long P&L",
          "Short P&L",
          "Short-selling risk",
        ],

        sections: [
          {
            title: "Going long",
            content:
              "A long position benefits when price increases after entry. A trader buys first and later sells the position.",
          },
          {
            title: "Going short",
            content:
              "A short position is designed to benefit from falling prices. With traditional stock short selling, shares are borrowed and sold before later being repurchased.",
          },
          {
            title: "Long profit and loss",
            content:
              "If you buy 10 shares at $100 and sell at $105, the price gain is $5 per share, producing $50 before trading costs.",
          },
          {
            title: "Short profit and loss",
            content:
              "If you short 10 shares at $100 and later cover at $95, the price difference is $5 per share, producing $50 before costs.",
          },
          {
            title: "Different risk profiles",
            content:
              "A stock cannot fall below zero, while its upside does not have a fixed maximum. This gives short positions a different theoretical risk profile from long positions.",
          },
          {
            title: "Borrowing",
            content:
              "Short selling can involve borrow fees, availability restrictions and additional broker requirements.",
          },
        ],

        example: {
          title: "Long versus short",
          content:
            "At $100, a long trader benefits if price rises to $105. A short trader entering at the same $100 benefits instead if price falls below the entry.",
        },

        quiz: [
          {
            question:
              "When does a long trade generally benefit?",
            options: [
              "When price rises",
              "When price falls",
              "When volume becomes zero",
              "Only after market close",
            ],
            correctIndex: 0,
            explanation:
              "Long positions generally benefit from rising prices.",
          },
          {
            question:
              "When does a short trade generally benefit?",
            options: [
              "When price falls",
              "When price rises",
              "Only during earnings",
              "Only when volume increases",
            ],
            correctIndex: 0,
            explanation:
              "Short positions generally benefit from falling prices.",
          },
          {
            question:
              "Why can short positions carry unusual risk?",
            options: [
              "A stock can theoretically rise without a fixed upper limit",
              "Stocks can fall below zero",
              "Short positions cannot be closed",
              "Stops cannot be used",
            ],
            correctIndex: 0,
            explanation:
              "A stock has no fixed maximum price.",
          },
        ],
      },
    ],
  },

  {
    id: "structure",
    number: "02",
    title: "Market Structure",
    description:
      "Learn how trends, ranges, support, resistance, volume and liquidity shape price behavior.",

    lessons: [
      {
        id: "trends",
        title: "Trends and ranges",
        description:
          "Recognize whether price is trending or moving sideways.",
        duration: "7 min",
        level: "Beginner",

        points: [
          "Higher highs",
          "Higher lows",
          "Lower highs",
          "Lower lows",
          "Ranges",
          "Timeframes",
        ],

        sections: [
          {
            title: "Market structure",
            content:
              "Market structure describes the sequence created by price highs and lows.",
          },
          {
            title: "Uptrends",
            content:
              "An uptrend commonly produces higher highs and higher lows.",
          },
          {
            title: "Downtrends",
            content:
              "A downtrend commonly produces lower highs and lower lows.",
          },
          {
            title: "Ranges",
            content:
              "A range occurs when price repeatedly moves between an upper and lower region without sustaining a directional trend.",
          },
          {
            title: "Changing structure",
            content:
              "A trend can weaken, transition into a range or reverse. Traders watch whether the previous sequence of highs and lows is still being maintained.",
          },
          {
            title: "Timeframe context",
            content:
              "A stock can be bullish on one timeframe and bearish on another, so market structure should always be interpreted relative to the timeframe being traded.",
          },
        ],

        example: {
          title: "Uptrend example",
          content:
            "Price rises from $100 to $105, pulls back to $102 and then rises to $108. The new high and higher pullback low are consistent with an uptrend.",
        },

        quiz: [
          {
            question:
              "What commonly defines an uptrend?",
            options: [
              "Higher highs and higher lows",
              "Lower highs and lower lows",
              "Constant price",
              "Low volume only",
            ],
            correctIndex: 0,
            explanation:
              "Higher highs and higher lows are a common description of an uptrend.",
          },
          {
            question:
              "What is a range?",
            options: [
              "Price repeatedly trading between upper and lower areas",
              "Price only rising",
              "Price only falling",
              "No market activity",
            ],
            correctIndex: 0,
            explanation:
              "Ranges occur when price remains within a relatively defined area.",
          },
          {
            question:
              "Can different timeframes show different trends?",
            options: [
              "Yes",
              "No",
              "Only on futures",
              "Only after hours",
            ],
            correctIndex: 0,
            explanation:
              "Different timeframes can show different structures simultaneously.",
          },
        ],
      },

      {
        id: "support-resistance",
        title: "Support and resistance",
        description:
          "Understand important price areas and how breakouts develop.",
        duration: "8 min",
        level: "Beginner",

        points: [
          "Support",
          "Resistance",
          "Zones",
          "Breakouts",
          "Retests",
          "False breakouts",
        ],

        sections: [
          {
            title: "Support",
            content:
              "Support is an area where buying interest has previously been strong enough to slow or stop a decline.",
          },
          {
            title: "Resistance",
            content:
              "Resistance is an area where selling activity has previously slowed or stopped a rally.",
          },
          {
            title: "Think in zones",
            content:
              "Support and resistance are normally more useful as areas than perfectly exact price lines.",
          },
          {
            title: "Breakouts",
            content:
              "A breakout occurs when price moves through an established support or resistance area.",
          },
          {
            title: "Retests",
            content:
              "A retest occurs when price returns to a recently broken area.",
          },
          {
            title: "False breakouts",
            content:
              "A false breakout occurs when price moves beyond an important area but quickly returns inside the previous structure.",
          },
          {
            title: "No level is guaranteed",
            content:
              "Support and resistance identify areas where reactions may occur. Price is never required to respect them.",
          },
        ],

        example: {
          title: "Breakout retest",
          content:
            "A stock repeatedly fails at $75. It eventually breaks above $75 and later pulls back. If buyers appear near that area, the former resistance may now be acting as support.",
        },

        quiz: [
          {
            question:
              "What is support?",
            options: [
              "An area where buying previously appeared",
              "A guaranteed bottom",
              "The daily high",
              "The bid price only",
            ],
            correctIndex: 0,
            explanation:
              "Support describes an area where buyers previously became active.",
          },
          {
            question:
              "What is a retest?",
            options: [
              "Price returning to a recently broken area",
              "A broker cancelling a trade",
              "A stock split",
              "A volume indicator",
            ],
            correctIndex: 0,
            explanation:
              "A retest occurs when price revisits a broken level.",
          },
          {
            question:
              "What is a false breakout?",
            options: [
              "Price breaks a level but fails to remain beyond it",
              "Price never moves",
              "A high-volume trade",
              "A limit order",
            ],
            correctIndex: 0,
            explanation:
              "False breakouts fail to sustain movement beyond the level.",
          },
        ],
      },

      {
        id: "volume",
        title: "Volume and liquidity",
        description:
          "Learn how participation and available orders affect execution.",
        duration: "7 min",
        level: "Intermediate",

        points: [
          "Volume",
          "Relative volume",
          "Participation",
          "Liquidity",
          "Thin markets",
          "Slippage",
        ],

        sections: [
          {
            title: "Volume",
            content:
              "Volume measures the amount of trading activity during a specified period.",
          },
          {
            title: "Relative volume",
            content:
              "Relative volume compares current activity with the typical activity of the same asset.",
          },
          {
            title: "Participation",
            content:
              "Unusually high volume can indicate increased market participation, although it does not guarantee that a price move will continue.",
          },
          {
            title: "Liquidity",
            content:
              "Liquidity measures how easily orders can be executed without causing large price changes.",
          },
          {
            title: "Thin markets",
            content:
              "Thin markets contain fewer available orders. This can produce wider spreads and more abrupt price movement.",
          },
          {
            title: "Execution risk",
            content:
              "Lower liquidity can increase slippage, especially for larger orders or during fast price movement.",
          },
        ],

        example: {
          title: "Relative-volume example",
          content:
            "A stock normally trades 500,000 shares during the first hour but trades 2 million shares during the same period today. That indicates unusually high participation.",
        },

        quiz: [
          {
            question:
              "What does volume measure?",
            options: [
              "Trading activity",
              "Future direction",
              "Company revenue",
              "Only buying",
            ],
            correctIndex: 0,
            explanation:
              "Volume measures how much trading occurred.",
          },
          {
            question:
              "What does relative volume compare?",
            options: [
              "Current activity with normal activity",
              "Bid and ask",
              "Profit and loss",
              "Two different stocks",
            ],
            correctIndex: 0,
            explanation:
              "Relative volume compares current volume with typical volume.",
          },
          {
            question:
              "What risk is common in thin markets?",
            options: [
              "Wider spreads and greater slippage",
              "Guaranteed fills",
              "No volatility",
              "No price movement",
            ],
            correctIndex: 0,
            explanation:
              "Lower liquidity can create worse execution.",
          },
        ],
      },
    ],
  },

  {
    id: "risk",
    number: "03",
    title: "Risk Management",
    description:
      "Learn how to control losses, determine position size and evaluate risk-to-reward.",

    lessons: [
      {
        id: "risk-per-trade",
        title: "Risk per trade",
        description:
          "Understand how much capital one trading idea should expose.",
        duration: "8 min",
        level: "Beginner",

        points: [
          "Dollar risk",
          "Percentage risk",
          "Maximum loss",
          "Consistency",
          "Drawdowns",
        ],

        sections: [
          {
            title: "Risk per trade",
            content:
              "Risk per trade is the amount you plan to lose if the trade reaches its invalidation point.",
          },
          {
            title: "Position value is different",
            content:
              "A $5,000 position does not necessarily mean $5,000 is at risk. Risk depends on entry price, stop distance and position size.",
          },
          {
            title: "Percentage risk",
            content:
              "Risk can be expressed as a percentage of account value. One percent of a $10,000 account equals $100.",
          },
          {
            title: "Consistency",
            content:
              "Consistent risk makes trading results easier to evaluate because individual trades affect the account more evenly.",
          },
          {
            title: "Losing streaks",
            content:
              "Controlling individual trade risk reduces the damage caused by normal losing streaks.",
          },
          {
            title: "Avoid increasing risk emotionally",
            content:
              "Increasing size after losses in an attempt to recover quickly can accelerate drawdowns.",
          },
        ],

        example: {
          title: "Account-risk example",
          content:
            "A $20,000 account using a 0.5% risk budget would plan approximately $100 of risk on a trade.",
        },

        quiz: [
          {
            question:
              "What does risk per trade describe?",
            options: [
              "The planned loss if the trade is invalidated",
              "The full market value of every position",
              "Expected profit",
              "Trading volume",
            ],
            correctIndex: 0,
            explanation:
              "Risk per trade describes planned capital exposure.",
          },
          {
            question:
              "What is 1% of a $10,000 account?",
            options: [
              "$100",
              "$10",
              "$1,000",
              "$500",
            ],
            correctIndex: 0,
            explanation:
              "One percent of $10,000 is $100.",
          },
          {
            question:
              "Why keep risk controlled during a losing streak?",
            options: [
              "To limit drawdown",
              "To guarantee the next win",
              "To increase leverage",
              "To remove volatility",
            ],
            correctIndex: 0,
            explanation:
              "Controlled risk limits the damage of consecutive losses.",
          },
        ],
      },

      {
        id: "position-sizing",
        title: "Position sizing",
        description:
          "Calculate trade size from risk and stop distance.",
        duration: "9 min",
        level: "Intermediate",

        points: [
          "Risk per share",
          "Stop distance",
          "Dollar risk",
          "Share quantity",
          "Position sizing",
        ],

        sections: [
          {
            title: "Why size matters",
            content:
              "Position size determines how strongly price movement affects your account.",
          },
          {
            title: "Risk per share",
            content:
              "Risk per share is commonly calculated from the distance between entry and stop.",
          },
          {
            title: "Position-size formula",
            content:
              "A common calculation is position size = maximum dollar risk divided by risk per share.",
          },
          {
            title: "Wider stops",
            content:
              "If the stop gets wider while total dollar risk remains constant, position size should decrease.",
          },
          {
            title: "Tighter stops",
            content:
              "A tighter stop reduces theoretical risk per share, which can allow a larger position while keeping total risk unchanged.",
          },
          {
            title: "Real execution differs",
            content:
              "Slippage, gaps and commissions mean actual losses can differ from theoretical calculations.",
          },
        ],

        example: {
          title: "Sizing example",
          content:
            "Maximum risk is $100. Entry is $50 and stop is $49.50. Risk per share is $0.50, so the theoretical position size is 200 shares.",
        },

        quiz: [
          {
            question:
              "How is risk per share commonly calculated on a long trade?",
            options: [
              "Entry minus stop",
              "Entry plus stop",
              "Target minus stop",
              "Account size divided by entry",
            ],
            correctIndex: 0,
            explanation:
              "The entry-to-stop distance represents risk per share.",
          },
          {
            question:
              "What happens to size if the stop gets wider but dollar risk stays constant?",
            options: [
              "Position size decreases",
              "Position size increases",
              "Nothing changes",
              "Position size doubles",
            ],
            correctIndex: 0,
            explanation:
              "More risk per share requires fewer shares.",
          },
          {
            question:
              "$100 risk divided by $0.50 risk per share equals:",
            options: [
              "200 shares",
              "100 shares",
              "50 shares",
              "500 shares",
            ],
            correctIndex: 0,
            explanation:
              "$100 ÷ $0.50 = 200.",
          },
        ],
      },

      {
        id: "risk-reward",
        title: "Risk-to-reward",
        description:
          "Understand R multiples, expectancy and why win rate is not everything.",
        duration: "8 min",
        level: "Intermediate",

        points: [
          "R multiples",
          "Risk/reward",
          "Win rate",
          "Average winner",
          "Average loser",
          "Expectancy",
        ],

        sections: [
          {
            title: "Risk-to-reward",
            content:
              "Risk-to-reward compares the amount at risk with the potential reward.",
          },
          {
            title: "R multiples",
            content:
              "One R represents your initial planned risk. A $100 risk producing $200 profit equals +2R.",
          },
          {
            title: "Win rate",
            content:
              "Win rate measures how often trades finish profitably but does not measure how large winners and losers are.",
          },
          {
            title: "Average winner and loser",
            content:
              "A lower win rate can still produce good results if winning trades are sufficiently larger than losing trades.",
          },
          {
            title: "Expectancy",
            content:
              "Expectancy estimates the average result a strategy produces over a sufficiently large sample.",
          },
          {
            title: "Targets need context",
            content:
              "A theoretical 5R target is not useful if the market structure makes reaching that level unrealistic.",
          },
        ],

        example: {
          title: "Expectancy example",
          content:
            "A strategy wins half of its trades. Winners average +2R and losers average -1R. Across two average trades, the combined result is +1R.",
        },

        quiz: [
          {
            question:
              "$300 profit on $100 initial risk equals:",
            options: [
              "+3R",
              "+1R",
              "+2R",
              "+4R",
            ],
            correctIndex: 0,
            explanation:
              "$300 is three times the original $100 risk.",
          },
          {
            question:
              "Can a 40% win-rate strategy be profitable?",
            options: [
              "Yes",
              "No",
              "Only with no losing trades",
              "Only with market orders",
            ],
            correctIndex: 0,
            explanation:
              "Large average winners can compensate for a lower win rate.",
          },
          {
            question:
              "What does positive expectancy describe?",
            options: [
              "A favorable average outcome over a meaningful sample",
              "A guaranteed winning trade",
              "A 100% win rate",
              "No risk",
            ],
            correctIndex: 0,
            explanation:
              "Expectancy concerns average results over repeated trades.",
          },
        ],
      },
    ],
  },

  {
    id: "technical",
    number: "04",
    title: "Technical Analysis",
    description:
      "Learn how traders interpret charts and indicators without treating them as automatic signals.",

    lessons: [
      {
        id: "candlesticks",
        title: "Reading candlesticks",
        description:
          "Understand open, high, low and close information.",
        duration: "7 min",
        level: "Beginner",

        points: [
          "Open",
          "High",
          "Low",
          "Close",
          "Body",
          "Wicks",
          "Timeframes",
        ],

        sections: [
          {
            title: "Candlesticks",
            content:
              "A candlestick summarizes price activity during a specific period.",
          },
          {
            title: "Open and close",
            content:
              "The open is the first traded price of the period, while the close is the final traded price.",
          },
          {
            title: "High and low",
            content:
              "The high is the highest traded price and the low is the lowest traded price during the candle.",
          },
          {
            title: "Candle body",
            content:
              "The body represents the distance between open and close.",
          },
          {
            title: "Wicks",
            content:
              "Wicks show prices traded outside the open-to-close range.",
          },
          {
            title: "Rejection",
            content:
              "Long wicks can indicate that price moved into an area and later moved away before the candle closed.",
          },
          {
            title: "Timeframes",
            content:
              "Each candle can represent anything from seconds to months depending on the selected chart timeframe.",
          },
          {
            title: "Context matters",
            content:
              "Individual candle shapes should not be treated as guaranteed predictions.",
          },
        ],

        example: {
          title: "OHLC example",
          content:
            "A five-minute candle opens at $100, reaches $103, trades down to $99 and closes at $102. Its OHLC values are 100, 103, 99 and 102.",
        },

        quiz: [
          {
            question:
              "What is the candle high?",
            options: [
              "Highest traded price during the period",
              "Closing price",
              "Opening price",
              "Bid price",
            ],
            correctIndex: 0,
            explanation:
              "The high is the maximum traded price during that candle.",
          },
          {
            question:
              "What does the body represent?",
            options: [
              "Open-to-close range",
              "High-to-low range only",
              "Volume",
              "Spread",
            ],
            correctIndex: 0,
            explanation:
              "The body spans the opening and closing prices.",
          },
          {
            question:
              "Does a long lower wick guarantee a rally?",
            options: [
              "No",
              "Yes",
              "Only daily",
              "Only intraday",
            ],
            correctIndex: 0,
            explanation:
              "No single candle guarantees future direction.",
          },
        ],
      },

      {
        id: "moving-averages",
        title: "Moving averages",
        description:
          "Understand SMA, EMA, trend context and lag.",
        duration: "7 min",
        level: "Intermediate",

        points: [
          "SMA",
          "EMA",
          "Trend context",
          "Crossovers",
          "Lag",
          "Dynamic levels",
        ],

        sections: [
          {
            title: "Moving averages",
            content:
              "Moving averages smooth historical prices to make broader direction easier to see.",
          },
          {
            title: "SMA",
            content:
              "A simple moving average gives equal weight to each price included in its calculation.",
          },
          {
            title: "EMA",
            content:
              "An exponential moving average gives more weight to recent prices.",
          },
          {
            title: "Trend context",
            content:
              "Price above a rising average may support a bullish trend interpretation, while price below a falling average may support a bearish one.",
          },
          {
            title: "Dynamic support and resistance",
            content:
              "Some traders watch moving averages as dynamic reaction areas, although price is never required to respect them.",
          },
          {
            title: "Lag",
            content:
              "Moving averages use historical data and therefore react after price has already changed.",
          },
          {
            title: "Crossovers",
            content:
              "Moving-average crossovers can describe changing conditions but often produce false signals in sideways markets.",
          },
        ],

        example: {
          title: "EMA example",
          content:
            "A stock remains above a rising 20 EMA during an uptrend and repeatedly pulls back near the average. That may provide trend context, but the EMA alone does not guarantee future support.",
        },

        quiz: [
          {
            question:
              "Which gives more weight to recent prices?",
            options: [
              "EMA",
              "SMA",
              "Neither",
              "Volume",
            ],
            correctIndex: 0,
            explanation:
              "The exponential moving average emphasizes newer data.",
          },
          {
            question:
              "Why are moving averages lagging?",
            options: [
              "They use historical prices",
              "They predict future prices",
              "They use no price data",
              "They only work overnight",
            ],
            correctIndex: 0,
            explanation:
              "They are calculated from past data.",
          },
          {
            question:
              "What can happen with crossovers in ranges?",
            options: [
              "Many false signals",
              "Guaranteed profit",
              "No movement",
              "Zero volume",
            ],
            correctIndex: 0,
            explanation:
              "Sideways markets can cause averages to cross repeatedly.",
          },
        ],
      },

      {
        id: "rsi-macd",
        title: "RSI and MACD",
        description:
          "Learn how momentum indicators are commonly interpreted.",
        duration: "10 min",
        level: "Intermediate",

        points: [
          "Momentum",
          "RSI",
          "Overbought",
          "Oversold",
          "MACD",
          "Divergence",
          "Limitations",
        ],

        sections: [
          {
            title: "Momentum",
            content:
              "Momentum describes the strength or speed of recent price movement.",
          },
          {
            title: "RSI",
            content:
              "The Relative Strength Index is a momentum oscillator typically ranging from 0 to 100.",
          },
          {
            title: "Overbought and oversold",
            content:
              "RSI above 70 is commonly called overbought and below 30 oversold, but these readings do not guarantee reversals.",
          },
          {
            title: "Strong trends",
            content:
              "RSI can remain elevated or depressed for extended periods during strong trends.",
          },
          {
            title: "MACD",
            content:
              "MACD uses exponential moving averages to describe changes in momentum and trend behavior.",
          },
          {
            title: "Signal line",
            content:
              "Traders often compare the MACD line with its signal line, but crossovers are not guaranteed signals.",
          },
          {
            title: "Divergence",
            content:
              "Divergence occurs when price and an indicator move differently.",
          },
          {
            title: "Indicator limitations",
            content:
              "Indicators transform historical market data. They do not contain certainty about future price movement.",
          },
        ],

        example: {
          title: "RSI example",
          content:
            "A stock enters a strong uptrend and RSI reaches 75. That does not mean price must immediately reverse; momentum can remain strong for an extended period.",
        },

        quiz: [
          {
            question:
              "Does RSI above 70 guarantee a reversal?",
            options: [
              "No",
              "Yes",
              "Only on daily charts",
              "Only on low volume",
            ],
            correctIndex: 0,
            explanation:
              "Overbought does not mean price must fall immediately.",
          },
          {
            question:
              "What does MACD help describe?",
            options: [
              "Momentum and trend behavior",
              "Company revenue",
              "Order fees",
              "Borrow availability",
            ],
            correctIndex: 0,
            explanation:
              "MACD is primarily a momentum and trend indicator.",
          },
          {
            question:
              "What is divergence?",
            options: [
              "Price and indicator behaving differently",
              "Two equal prices",
              "No volume",
              "A market order",
            ],
            correctIndex: 0,
            explanation:
              "Divergence describes disagreement between an indicator and price.",
          },
        ],
      },
    ],
  },

  {
    id: "execution",
    number: "05",
    title: "Trade Execution",
    description:
      "Turn a market idea into a structured trade with defined entry, risk and exit rules.",

    lessons: [
      {
        id: "trade-plan",
        title: "Building a trade plan",
        description:
          "Define the setup before putting money at risk.",
        duration: "8 min",
        level: "Beginner",

        points: [
          "Setup",
          "Entry",
          "Invalidation",
          "Target",
          "Position size",
          "Skip conditions",
        ],

        sections: [
          {
            title: "Why a trade plan matters",
            content:
              "A trade plan defines the important decisions before money is at risk.",
          },
          {
            title: "Define the setup",
            content:
              "The setup describes the observable market condition you are waiting for.",
          },
          {
            title: "Define entry criteria",
            content:
              "Entry criteria explain what must happen before the position is opened.",
          },
          {
            title: "Define invalidation",
            content:
              "Invalidation identifies the point where your original reason for entering is no longer valid.",
          },
          {
            title: "Define a target",
            content:
              "Targets can be based on market structure, previous levels or predefined R multiples.",
          },
          {
            title: "Calculate position size",
            content:
              "Position size should reflect your entry-to-stop distance and maximum dollar risk.",
          },
          {
            title: "Know when to skip",
            content:
              "A complete plan should also identify conditions where you will not trade.",
          },
        ],

        example: {
          title: "Trade-plan example",
          content:
            "A stock is below $50 resistance. Your plan requires a breakout and retest, uses $49.50 as invalidation and targets $51.50. With $100 risk and $0.50 risk per share, theoretical size is 200 shares.",
        },

        quiz: [
          {
            question:
              "What should be defined before entering?",
            options: [
              "Entry, invalidation, risk and management plan",
              "Only ticker symbol",
              "Desired emotional profit",
              "Previous trade result",
            ],
            correctIndex: 0,
            explanation:
              "The key trading decisions should be planned before entry.",
          },
          {
            question:
              "What is invalidation?",
            options: [
              "Where the original trade idea becomes wrong",
              "Guaranteed target",
              "Opening price",
              "Average price",
            ],
            correctIndex: 0,
            explanation:
              "Invalidation describes where your trade thesis stops making sense.",
          },
          {
            question:
              "Why calculate size after the stop?",
            options: [
              "Stop distance determines risk per share",
              "Size predicts price",
              "Stops require large positions",
              "It guarantees profit",
            ],
            correctIndex: 0,
            explanation:
              "Risk per share is needed to calculate position size.",
          },
        ],
      },

      {
        id: "entries",
        title: "Good entries vs chasing",
        description:
          "Understand how entry location changes risk.",
        duration: "7 min",
        level: "Intermediate",

        points: [
          "Confirmation",
          "Early entry",
          "Late entry",
          "Chasing",
          "Patience",
          "FOMO",
        ],

        sections: [
          {
            title: "Entry location",
            content:
              "The same idea can create very different risk depending on your entry price.",
          },
          {
            title: "Confirmation",
            content:
              "Confirmation is observable evidence that the planned condition is occurring.",
          },
          {
            title: "Entering too early",
            content:
              "Early entries can offer a better price but risk acting before the setup actually develops.",
          },
          {
            title: "Chasing",
            content:
              "Chasing occurs when a trader enters after a large move because of fear of missing out.",
          },
          {
            title: "Late entries",
            content:
              "Entering far from the original planned level can materially worsen risk-to-reward.",
          },
          {
            title: "Missing trades",
            content:
              "A missed trade is not a financial loss.",
          },
          {
            title: "Patience",
            content:
              "Waiting for your planned conditions is part of execution.",
          },
        ],

        example: {
          title: "Chasing example",
          content:
            "You planned a $40 entry with a $39.50 stop. Price jumps to $41 first. Entering at $41 with the same stop changes risk from $0.50 to $1.50 per share.",
        },

        quiz: [
          {
            question:
              "What is chasing?",
            options: [
              "Entering after price has already moved because you fear missing out",
              "Waiting for confirmation",
              "Reducing risk",
              "Using a limit order",
            ],
            correctIndex: 0,
            explanation:
              "Chasing occurs after the original planned opportunity has moved away.",
          },
          {
            question:
              "What can a late entry do?",
            options: [
              "Worsen risk-to-reward",
              "Guarantee profit",
              "Remove the stop",
              "Remove volatility",
            ],
            correctIndex: 0,
            explanation:
              "Entering farther away can increase risk or reduce remaining reward.",
          },
          {
            question:
              "Is missing a trade automatically a loss?",
            options: [
              "No",
              "Yes",
              "Only short",
              "Only intraday",
            ],
            correctIndex: 0,
            explanation:
              "No capital was lost by not entering.",
          },
        ],
      },

      {
        id: "exits",
        title: "Managing exits",
        description:
          "Use stops, targets and position management consistently.",
        duration: "9 min",
        level: "Intermediate",

        points: [
          "Stops",
          "Targets",
          "Scaling out",
          "Trailing stops",
          "Emotional exits",
          "Process",
        ],

        sections: [
          {
            title: "Why exits matter",
            content:
              "Both entry and exit decisions contribute to the final result of a trade.",
          },
          {
            title: "Stop-loss exits",
            content:
              "Stops define where planned risk ends or where the trade idea becomes invalid.",
          },
          {
            title: "Profit targets",
            content:
              "Targets identify areas where part or all of the position may be closed.",
          },
          {
            title: "Scaling out",
            content:
              "Scaling out means closing part of the position while leaving the remainder open.",
          },
          {
            title: "Trailing stops",
            content:
              "Trailing stops move as the trade develops in an attempt to protect gains while allowing additional movement.",
          },
          {
            title: "Moving stops emotionally",
            content:
              "Moving a stop farther away because you do not want to lose increases risk beyond the original plan.",
          },
          {
            title: "Taking winners too quickly",
            content:
              "Consistently cutting winners early while allowing full losses can damage expectancy.",
          },
          {
            title: "Judge process",
            content:
              "A good exit does not need to occur at the exact top or bottom.",
          },
        ],

        example: {
          title: "Exit example",
          content:
            "You enter at $80 with a $79 stop and $82 target. Moving your stop from $79 to $78 because you hope price recovers doubles the original dollar risk per share.",
        },

        quiz: [
          {
            question:
              "What is a stop primarily used for?",
            options: [
              "Defining invalidation or maximum planned risk",
              "Guaranteeing profit",
              "Increasing leverage",
              "Predicting price",
            ],
            correctIndex: 0,
            explanation:
              "Stops help define where the original plan ends.",
          },
          {
            question:
              "What is scaling out?",
            options: [
              "Closing part of a position",
              "Doubling the position",
              "Moving a stop",
              "Opening a short automatically",
            ],
            correctIndex: 0,
            explanation:
              "Scaling out gradually reduces exposure.",
          },
          {
            question:
              "Why can moving a stop farther away be dangerous?",
            options: [
              "It increases risk",
              "It guarantees lower slippage",
              "It changes the entry price",
              "It guarantees a reversal",
            ],
            correctIndex: 0,
            explanation:
              "A wider stop exposes more capital.",
          },
        ],
      },
    ],
  },

  {
    id: "psychology",
    number: "06",
    title: "Trading Psychology",
    description:
      "Understand FOMO, revenge trading and why process matters more than any individual outcome.",

    lessons: [
      {
        id: "fomo",
        title: "FOMO and chasing",
        description:
          "Recognize fear of missing out before it changes your decisions.",
        duration: "6 min",
        level: "Beginner",

        points: [
          "FOMO",
          "Urgency",
          "Chasing",
          "Missed trades",
          "Pause rules",
        ],

        sections: [
          {
            title: "What FOMO is",
            content:
              "FOMO is the fear that an opportunity will disappear unless you act immediately.",
          },
          {
            title: "Urgency",
            content:
              "Fast price movement can create the feeling that there is no time to follow your normal process.",
          },
          {
            title: "Chasing",
            content:
              "FOMO often causes traders to enter far from their planned entry.",
          },
          {
            title: "Missed trades",
            content:
              "Missing a profitable move can feel like losing money even though your account has not actually lost capital.",
          },
          {
            title: "Opportunity returns",
            content:
              "Markets continually create new opportunities. You do not need to participate in every move.",
          },
          {
            title: "Pause rules",
            content:
              "A mandatory pause before an unplanned entry can create enough time to reconsider risk and setup quality.",
          },
        ],

        example: {
          title: "FOMO example",
          content:
            "Your planned entry is $25 but price jumps to $27. Entering because you are afraid the move will continue can dramatically increase the distance to your logical stop.",
        },

        quiz: [
          {
            question:
              "What drives FOMO?",
            options: [
              "Fear of missing an opportunity",
              "Guaranteed signals",
              "Broker requirements",
              "Account interest",
            ],
            correctIndex: 0,
            explanation:
              "FOMO is driven by fear that an opportunity will disappear.",
          },
          {
            question:
              "Is missing a trade a financial loss?",
            options: [
              "No",
              "Yes",
              "Always",
              "Only if price rises",
            ],
            correctIndex: 0,
            explanation:
              "No money was lost if no position was entered.",
          },
          {
            question:
              "What can help control FOMO?",
            options: [
              "A pause rule",
              "Increasing size",
              "Removing stops",
              "Entering every move",
            ],
            correctIndex: 0,
            explanation:
              "A pause creates time to return to your process.",
          },
        ],
      },

      {
        id: "revenge",
        title: "Revenge trading",
        description:
          "Recognize the urge to immediately recover a recent loss.",
        duration: "6 min",
        level: "Beginner",

        points: [
          "Loss response",
          "Recovery mindset",
          "Risk increases",
          "Overtrading",
          "Daily limits",
          "Reset routines",
        ],

        sections: [
          {
            title: "Revenge trading",
            content:
              "Revenge trading occurs when your goal shifts from following your setup to recovering a recent loss.",
          },
          {
            title: "Loss response",
            content:
              "Frustration can create urgency to immediately return to breakeven.",
          },
          {
            title: "Increasing risk",
            content:
              "Increasing size after a loss can transform a normal drawdown into a much larger one.",
          },
          {
            title: "Overtrading",
            content:
              "Taking additional low-quality trades increases exposure to mistakes, fees and slippage.",
          },
          {
            title: "Daily limits",
            content:
              "A predefined maximum daily loss can prevent emotional trading after decision quality deteriorates.",
          },
          {
            title: "Reset routine",
            content:
              "Walking away, reviewing the previous trade or enforcing a waiting period can break the revenge-trading cycle.",
          },
        ],

        example: {
          title: "Revenge example",
          content:
            "A planned $100 loss is followed by an emotional $250-risk trade intended to recover the money. When the second trade loses, a normal loss becomes a $350 drawdown.",
        },

        quiz: [
          {
            question:
              "What is revenge trading?",
            options: [
              "Trading mainly to recover a recent loss",
              "Following your normal plan",
              "Reducing risk",
              "Reviewing results",
            ],
            correctIndex: 0,
            explanation:
              "The motivation becomes recovering money rather than taking a valid setup.",
          },
          {
            question:
              "Why is increasing size after a loss risky?",
            options: [
              "It can magnify the next loss",
              "It guarantees profit",
              "It removes volatility",
              "It improves liquidity",
            ],
            correctIndex: 0,
            explanation:
              "Larger exposure increases potential damage.",
          },
          {
            question:
              "What can a daily loss limit provide?",
            options: [
              "A predefined stopping point",
              "Guaranteed profit",
              "A market prediction",
              "Higher leverage",
            ],
            correctIndex: 0,
            explanation:
              "It creates a boundary before emotional trading escalates.",
          },
        ],
      },

      {
        id: "discipline",
        title: "Process over outcome",
        description:
          "Separate the quality of a decision from the result of one trade.",
        duration: "8 min",
        level: "Intermediate",

        points: [
          "Good decisions",
          "Bad outcomes",
          "Bad decisions",
          "Good outcomes",
          "Consistency",
          "Sample size",
        ],

        sections: [
          {
            title: "Decision versus result",
            content:
              "Trading contains uncertainty, so decision quality and financial outcome are not always aligned.",
          },
          {
            title: "Good decision, bad outcome",
            content:
              "A properly planned and executed trade can still lose money.",
          },
          {
            title: "Bad decision, good outcome",
            content:
              "An impulsive trade can occasionally make money, but the positive result does not make the process good.",
          },
          {
            title: "Review your rules",
            content:
              "Evaluate whether setup, entry, risk and exit followed your process separately from P&L.",
          },
          {
            title: "Consistency",
            content:
              "Consistent execution makes your trading data much easier to evaluate.",
          },
          {
            title: "Think in samples",
            content:
              "A single trade reveals very little. Patterns become more meaningful across many similarly executed trades.",
          },
        ],

        example: {
          title: "Process example",
          content:
            "Trade A follows every rule and loses 1R. Trade B breaks multiple rules but earns 2R. Trade B produced more money, but Trade A represents better execution.",
        },

        quiz: [
          {
            question:
              "Can a good trade decision lose money?",
            options: [
              "Yes",
              "No",
              "Only on shorts",
              "Only intraday",
            ],
            correctIndex: 0,
            explanation:
              "Uncertainty means good decisions can still produce losses.",
          },
          {
            question:
              "Can a poor decision make money?",
            options: [
              "Yes",
              "No",
              "Never",
              "Only after hours",
            ],
            correctIndex: 0,
            explanation:
              "Luck can produce favorable outcomes from poor decisions.",
          },
          {
            question:
              "Why does consistency matter?",
            options: [
              "It produces more useful performance data",
              "It guarantees profit",
              "It removes losses",
              "It predicts price",
            ],
            correctIndex: 0,
            explanation:
              "Consistent rules make comparisons more meaningful.",
          },
        ],
      },
    ],
  },

  {
    id: "journal",
    number: "07",
    title: "Journaling & Improvement",
    description:
      "Turn trading history into measurable feedback and specific improvements.",

    lessons: [
      {
        id: "journal-basics",
        title: "What to record",
        description:
          "Build journal entries that provide useful information later.",
        duration: "6 min",
        level: "Beginner",

        points: [
          "Setup",
          "Entry",
          "Exit",
          "Risk",
          "Psychology",
          "Mistakes",
          "Lessons",
        ],

        sections: [
          {
            title: "Why journal trades",
            content:
              "A journal creates a permanent record of decisions instead of relying on memory.",
          },
          {
            title: "Setup",
            content:
              "Record the strategy or setup so similar trades can be compared.",
          },
          {
            title: "Entry and exit",
            content:
              "Record prices and the reasoning behind your entry and exit.",
          },
          {
            title: "Risk",
            content:
              "Record stop location, position size, dollar risk and percentage risk.",
          },
          {
            title: "Psychology",
            content:
              "Record emotions and behaviors such as FOMO, hesitation, revenge trading and overconfidence.",
          },
          {
            title: "Mistakes",
            content:
              "A process mistake remains important even when the trade happens to make money.",
          },
          {
            title: "Lessons",
            content:
              "Write specific actions you would repeat or change the next time the situation appears.",
          },
        ],

        example: {
          title: "Journal example",
          content:
            "Setup: breakout retest. Entry: $50.20. Stop: $49.80. Risk: $80. Exit: $51.00. Psychology: felt FOMO but waited. Lesson: waiting for the retest improved entry quality.",
        },

        quiz: [
          {
            question:
              "Why record the setup?",
            options: [
              "To compare similar trades later",
              "To guarantee future profit",
              "To remove risk",
              "To predict tomorrow",
            ],
            correctIndex: 0,
            explanation:
              "Setup data makes strategy-level analysis possible.",
          },
          {
            question:
              "Should profitable rule-breaking trades be recorded as mistakes?",
            options: [
              "Yes",
              "No",
              "Never",
              "Only if short",
            ],
            correctIndex: 0,
            explanation:
              "Outcome does not erase a process mistake.",
          },
          {
            question:
              "What makes a useful lesson?",
            options: [
              "A specific action to repeat or change",
              "Only the P&L",
              "A prediction",
              "The ticker symbol",
            ],
            correctIndex: 0,
            explanation:
              "Specific lessons are easier to apply later.",
          },
        ],
      },

      {
        id: "metrics",
        title: "Metrics that matter",
        description:
          "Understand the performance statistics used throughout A Trader.",
        duration: "9 min",
        level: "Intermediate",

        points: [
          "Win rate",
          "Average win",
          "Average loss",
          "Profit factor",
          "Expectancy",
          "Sample size",
          "Segmentation",
        ],

        sections: [
          {
            title: "Win rate",
            content:
              "Win rate is the percentage of trades that finish profitably.",
          },
          {
            title: "Average win",
            content:
              "Average win describes the typical profit among winning trades.",
          },
          {
            title: "Average loss",
            content:
              "Average loss describes the typical loss among losing trades.",
          },
          {
            title: "Profit factor",
            content:
              "Profit factor is gross profit divided by gross loss.",
          },
          {
            title: "Expectancy",
            content:
              "Expectancy estimates average results by combining win frequency with the size of winners and losers.",
          },
          {
            title: "Sample size",
            content:
              "Small samples can produce unstable conclusions. More trades generally provide more reliable evidence.",
          },
          {
            title: "Segmenting results",
            content:
              "Breaking results down by strategy, tag, time or market condition can reveal patterns hidden by overall statistics.",
          },
        ],

        example: {
          title: "Win-rate example",
          content:
            "A trader winning 70% of trades can still lose money if losing trades are much larger than winners. Another trader can profit with a 45% win rate if winners are sufficiently larger.",
        },

        quiz: [
          {
            question:
              "Can win rate alone prove profitability?",
            options: [
              "No",
              "Yes",
              "Only above 50%",
              "Only intraday",
            ],
            correctIndex: 0,
            explanation:
              "Average winner and average loser matter too.",
          },
          {
            question:
              "What does profit factor compare?",
            options: [
              "Gross profit and gross loss",
              "Entry and stop",
              "Confidence and risk",
              "Volume and price",
            ],
            correctIndex: 0,
            explanation:
              "Profit factor divides gross profits by gross losses.",
          },
          {
            question:
              "Why does sample size matter?",
            options: [
              "Small samples may create misleading conclusions",
              "Large samples guarantee profit",
              "Only large accounts use statistics",
              "Sample size predicts direction",
            ],
            correctIndex: 0,
            explanation:
              "Individual results have greater influence in small samples.",
          },
        ],
      },

      {
        id: "review",
        title: "Building a review process",
        description:
          "Turn journal data into specific behavior changes.",
        duration: "8 min",
        level: "Intermediate",

        points: [
          "Daily reviews",
          "Weekly reviews",
          "Repeated mistakes",
          "Strong setups",
          "One focus",
          "Measure change",
        ],

        sections: [
          {
            title: "Why review",
            content:
              "Recording trades creates data. Reviewing those trades turns data into learning.",
          },
          {
            title: "Daily review",
            content:
              "Daily reviews can focus on whether your trades followed your plan and risk rules.",
          },
          {
            title: "Weekly review",
            content:
              "Weekly reviews allow patterns across multiple trades to become more visible.",
          },
          {
            title: "Repeated mistakes",
            content:
              "A recurring mistake across several trades may indicate a process problem worth addressing.",
          },
          {
            title: "Strong setups",
            content:
              "Look for setups that repeatedly show favorable results and good execution.",
          },
          {
            title: "One improvement at a time",
            content:
              "Choosing one specific behavior to improve makes progress easier to measure.",
          },
          {
            title: "Measure the change",
            content:
              "Continue recording the behavior to determine whether your adjustment is actually improving execution.",
          },
        ],

        example: {
          title: "Weekly-review example",
          content:
            "You review 15 trades and discover four losses were all late FOMO entries. Rather than changing your strategy, you make avoiding late entries your next improvement focus.",
        },

        quiz: [
          {
            question:
              "Why review journal data?",
            options: [
              "To turn observations into improvements",
              "To predict tomorrow",
              "To eliminate every loss",
              "To increase leverage",
            ],
            correctIndex: 0,
            explanation:
              "Review transforms data into specific actions.",
          },
          {
            question:
              "Why are repeated mistakes important?",
            options: [
              "They may reveal a recurring process problem",
              "They guarantee a bad strategy",
              "They cannot be fixed",
              "They always come from the market",
            ],
            correctIndex: 0,
            explanation:
              "Recurring mistakes are evidence of a pattern rather than an isolated event.",
          },
          {
            question:
              "Why focus on one improvement at a time?",
            options: [
              "It makes progress easier to measure",
              "Only one mistake matters",
              "It guarantees profit",
              "It increases position size",
            ],
            correctIndex: 0,
            explanation:
              "A focused feedback loop makes behavioral improvement easier to evaluate.",
          },
        ],
      },
    ],
  },
];


const STORAGE_KEY =
  "a-trader-learning-progress";


export default function LearningPage() {
  const [
    completedLessons,
    setCompletedLessons,
  ] = useState<string[]>([]);


  const [
    selectedLesson,
    setSelectedLesson,
  ] = useState<Lesson | null>(
    null,
  );


  const [
    search,
    setSearch,
  ] = useState(
    "",
  );


  useEffect(
    () => {
      const stored =
        localStorage.getItem(
          STORAGE_KEY,
        );


      if (
        !stored
      ) {
        return;
      }


      try {
        const parsed =
          JSON.parse(
            stored,
          );


        if (
          Array.isArray(
            parsed,
          )
        ) {
          setCompletedLessons(
            parsed.filter(
              (
                value,
              ) =>
                typeof value
                === "string",
            ),
          );
        }

      } catch {
        localStorage.removeItem(
          STORAGE_KEY,
        );
      }
    },
    [],
  );


  const allLessonIds =
    useMemo(
      () =>
        new Set(
          MODULES.flatMap(
            (
              module,
            ) =>
              module.lessons.map(
                (
                  lesson,
                ) =>
                  lesson.id,
              ),
          ),
        ),
      [],
    );


  const totalLessons =
    allLessonIds.size;


  const completedCount =
    completedLessons.filter(
      (
        id,
      ) =>
        allLessonIds.has(
          id,
        ),
    ).length;


  const remainingLessons =
    Math.max(
      0,
      totalLessons
      - completedCount,
    );


  const progress =
    totalLessons > 0
      ? (
          completedCount
          / totalLessons
        ) * 100
      : 0;


  const totalMinutes =
    useMemo(
      () =>
        MODULES.flatMap(
          (
            module,
          ) =>
            module.lessons,
        ).reduce(
          (
            total,
            lesson,
          ) =>
            total
            + Number.parseInt(
              lesson.duration,
              10,
            ),
          0,
        ),
      [],
    );


  const filteredModules =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();


        if (
          !query
        ) {
          return MODULES;
        }


        return MODULES
          .map(
            (
              module,
            ) => {
              const moduleMatches =
                module.title
                  .toLowerCase()
                  .includes(
                    query,
                  )
                || module.description
                  .toLowerCase()
                  .includes(
                    query,
                  );


              if (
                moduleMatches
              ) {
                return module;
              }


              const lessons =
                module.lessons.filter(
                  (
                    lesson,
                  ) =>
                    lesson.title
                      .toLowerCase()
                      .includes(
                        query,
                      )
                    || lesson.description
                      .toLowerCase()
                      .includes(
                        query,
                      )
                    || lesson.points.some(
                      (
                        point,
                      ) =>
                        point
                          .toLowerCase()
                          .includes(
                            query,
                          ),
                    ),
                );


              if (
                lessons.length
                === 0
              ) {
                return null;
              }


              return {
                ...module,
                lessons,
              };
            },
          )
          .filter(
            (
              module,
            ): module is LearningModule =>
              module !== null,
          );
      },
      [
        search,
      ],
    );


  function toggleCompleted(
    lessonId:
      string,
  ) {
    setCompletedLessons(
      (
        current,
      ) => {
        const next =
          current.includes(
            lessonId,
          )
            ? current.filter(
                (
                  id,
                ) =>
                  id
                  !== lessonId,
              )
            : [
                ...current,
                lessonId,
              ];


        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            next,
          ),
        );


        return next;
      },
    );
  }


  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Learning"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Learning center"

            title="Trading Education"

            description="Build a stronger foundation in market structure, risk, execution, technical analysis, psychology and performance review."

            status={
              <>
                <StatusBadge
                  tone={
                    progress
                    === 100
                      ? "positive"
                      : "info"
                  }

                  dot
                >
                  {
                    completedCount
                  }
                  {" / "}
                  {
                    totalLessons
                  }
                  {" completed"}
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  7 modules
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  ~
                  {
                    totalMinutes
                  }
                  {" min"}
                </StatusBadge>
              </>
            }
          />


          <div className="space-y-10">

            {/* ===========================================
                PROGRESS
            =========================================== */}

            <section>

              <SectionHeading
                eyebrow="Progress"
                title="Your curriculum"
                description="Your completed lessons are stored locally so you can continue where you left off."
              />


              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                  label="Completed"

                  value={
                    completedCount
                  }

                  detail={`${totalLessons} total lessons`}
                />


                <MetricCard
                  label="Progress"

                  value={`${progress.toFixed(
                    0,
                  )}%`}

                  detail={
                    progress
                    === 100
                      ? "Curriculum complete"
                      : "Overall course completion"
                  }
                />


                <MetricCard
                  label="Remaining"

                  value={
                    remainingLessons
                  }

                  detail={
                    remainingLessons
                    === 1
                      ? "1 lesson remaining"
                      : `${remainingLessons} lessons remaining`
                  }
                />


                <MetricCard
                  label="Course size"

                  value="7 modules"

                  detail={`${totalLessons} lessons · ~${totalMinutes} min`}
                />

              </div>


              <Card
                className="mt-4"
              >

                <div className="flex items-end justify-between gap-5">

                  <div>

                    <p className="text-sm font-semibold text-zinc-200">
                      Overall progress
                    </p>


                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Complete each lesson quiz to mark the lesson finished.
                    </p>

                  </div>


                  <p className="text-xl font-semibold text-white">
                    {
                      progress.toFixed(
                        0,
                      )
                    }
                    %
                  </p>

                </div>


                <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-900">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"

                    style={{
                      width:
                        `${Math.min(
                          100,
                          progress,
                        )}%`,
                    }}
                  />

                </div>

              </Card>

            </section>


            {/* ===========================================
                CURRICULUM
            =========================================== */}

            <section>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <SectionHeading
                  eyebrow="Curriculum"
                  title="Learn in order or explore"
                  description="Work through the curriculum sequentially or search for a specific trading concept."
                />


                <div className="w-full lg:max-w-sm">

                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
                    Search curriculum
                  </label>


                  <div className="relative">

                    <input
                      value={
                        search
                      }

                      onChange={(
                        event,
                      ) =>
                        setSearch(
                          event.target.value,
                        )
                      }

                      placeholder="Search lessons, topics..."

                      className="w-full rounded-xl border border-zinc-900 bg-zinc-950 py-3 pl-4 pr-10 text-sm text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-800 focus:border-zinc-700"
                    />


                    {search
                    && (
                      <button
                        type="button"

                        onClick={() =>
                          setSearch(
                            "",
                          )
                        }

                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600 transition hover:text-white"
                      >
                        ×
                      </button>
                    )}

                  </div>

                </div>

              </div>


              <div className="mt-6 space-y-5">

                {filteredModules.map(
                  (
                    module,
                  ) => {
                    const originalModule =
                      MODULES.find(
                        (
                          item,
                        ) =>
                          item.id
                          === module.id,
                      );


                    const moduleCompleted =
                      originalModule
                        ?.lessons.filter(
                          (
                            lesson,
                          ) =>
                            completedLessons.includes(
                              lesson.id,
                            ),
                        ).length
                      ?? 0;


                    const moduleTotal =
                      originalModule
                        ?.lessons.length
                      ?? module.lessons.length;


                    const moduleProgress =
                      moduleTotal > 0
                        ? (
                            moduleCompleted
                            / moduleTotal
                          ) * 100
                        : 0;


                    const moduleFinished =
                      moduleCompleted
                      === moduleTotal;


                    return (
                      <Card
                        key={
                          module.id
                        }

                        padding="none"

                        className="overflow-hidden"
                      >

                        <div className="border-b border-zinc-900 px-5 py-5 sm:px-6">

                          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                            <div className="flex min-w-0 gap-4">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-900 bg-black text-sm font-semibold text-blue-400">
                                {
                                  module.number
                                }
                              </div>


                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="text-lg font-semibold text-zinc-100">
                                    {
                                      module.title
                                    }
                                  </h3>


                                  {moduleFinished
                                  && (
                                    <StatusBadge
                                      tone="positive"
                                      dot
                                    >
                                      Complete
                                    </StatusBadge>
                                  )}

                                </div>


                                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                                  {
                                    module.description
                                  }
                                </p>

                              </div>

                            </div>


                            <div className="w-full shrink-0 md:w-44">

                              <div className="flex items-center justify-between text-xs">

                                <span className="text-zinc-600">
                                  {
                                    moduleCompleted
                                  }
                                  {" / "}
                                  {
                                    moduleTotal
                                  }
                                </span>


                                <span className="font-medium text-zinc-400">
                                  {
                                    moduleProgress.toFixed(
                                      0,
                                    )
                                  }
                                  %
                                </span>

                              </div>


                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">

                                <div
                                  className="h-full rounded-full bg-white transition-all"

                                  style={{
                                    width:
                                      `${moduleProgress}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </div>

                        </div>


                        <div className="divide-y divide-zinc-900">

                          {module.lessons.map(
                            (
                              lesson,
                              index,
                            ) => {
                              const completed =
                                completedLessons.includes(
                                  lesson.id,
                                );


                              return (
                                <button
                                  key={
                                    lesson.id
                                  }

                                  type="button"

                                  onClick={() =>
                                    setSelectedLesson(
                                      lesson,
                                    )
                                  }

                                  className="group flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-zinc-900/30 sm:px-6"
                                >

                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                                      completed
                                        ? "border-emerald-900/70 bg-emerald-950/30 text-emerald-400"
                                        : "border-zinc-900 bg-black text-zinc-600 group-hover:border-zinc-700 group-hover:text-zinc-300"
                                    }`}
                                  >
                                    {
                                      completed
                                        ? "✓"
                                        : index
                                          + 1
                                    }
                                  </div>


                                  <div className="min-w-0 flex-1">

                                    <div className="flex flex-wrap items-center gap-2">

                                      <h4 className="font-medium text-zinc-200 transition group-hover:text-white">
                                        {
                                          lesson.title
                                        }
                                      </h4>


                                      <StatusBadge
                                        tone={
                                          lesson.level
                                          === "Beginner"
                                            ? "neutral"
                                            : "info"
                                        }
                                      >
                                        {
                                          lesson.level
                                        }
                                      </StatusBadge>


                                      {completed
                                      && (
                                        <StatusBadge
                                          tone="positive"
                                        >
                                          Completed
                                        </StatusBadge>
                                      )}

                                    </div>


                                    <p className="mt-1.5 max-w-3xl text-sm leading-5 text-zinc-600">
                                      {
                                        lesson.description
                                      }
                                    </p>


                                    <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">

                                      {lesson.points
                                        .slice(
                                          0,
                                          3,
                                        )
                                        .map(
                                          (
                                            point,
                                          ) => (
                                            <span
                                              key={
                                                point
                                              }

                                              className="rounded-md border border-zinc-900 bg-black px-2 py-1 text-[10px] text-zinc-700"
                                            >
                                              {
                                                point
                                              }
                                            </span>
                                          ),
                                        )}

                                    </div>

                                  </div>


                                  <div className="hidden shrink-0 items-center gap-4 sm:flex">

                                    <span className="text-xs text-zinc-700">
                                      {
                                        lesson.duration
                                      }
                                    </span>


                                    <span className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-zinc-300">
                                      →
                                    </span>

                                  </div>

                                </button>
                              );
                            },
                          )}

                        </div>

                      </Card>
                    );
                  },
                )}


                {filteredModules.length
                === 0
                && (
                  <Card>

                    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-700">
                        ?
                      </div>


                      <p className="mt-4 font-medium text-zinc-300">
                        No lessons found
                      </p>


                      <p className="mt-2 text-sm text-zinc-600">
                        Try searching for another trading concept.
                      </p>


                      <button
                        type="button"

                        onClick={() =>
                          setSearch(
                            "",
                          )
                        }

                        className="mt-5 rounded-lg border border-zinc-800 bg-black px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                      >
                        Clear search
                      </button>

                    </div>

                  </Card>
                )}

              </div>

            </section>

          </div>

        </div>

      </main>


      {selectedLesson
      && (
        <LessonModal
          key={
            selectedLesson.id
          }

          lesson={
            selectedLesson
          }

          completed={
            completedLessons.includes(
              selectedLesson.id,
            )
          }

          onToggle={() =>
            toggleCompleted(
              selectedLesson.id,
            )
          }

          onClose={() =>
            setSelectedLesson(
              null,
            )
          }
        />
      )}

    </div>
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow:
    string;

  title:
    string;

  description?:
    string;
}) {
  return (
    <div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
        {
          eyebrow
        }
      </p>


      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        {
          title
        }
      </h2>


      {description
      && (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
          {
            description
          }
        </p>
      )}

    </div>
  );
}


function LessonModal({
  lesson,
  completed,
  onToggle,
  onClose,
}: {
  lesson:
    Lesson;

  completed:
    boolean;

  onToggle:
    () => void;

  onClose:
    () => void;
}) {
  const [
    answers,
    setAnswers,
  ] = useState<
    Record<
      number,
      number
    >
  >(
    {},
  );


  const quizComplete =
    lesson.quiz.every(
      (
        _,
        index,
      ) =>
        answers[
          index
        ]
        !== undefined,
    );


  const correctAnswers =
    lesson.quiz.reduce(
      (
        total,
        question,
        index,
      ) =>
        total
        + (
          answers[
            index
          ]
          === question.correctIndex
            ? 1
            : 0
        ),
      0,
    );


  const score =
    lesson.quiz.length > 0
      ? (
          correctAnswers
          / lesson.quiz.length
        ) * 100
      : 100;


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"

      onMouseDown={(
        event,
      ) => {
        if (
          event.target
          === event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">

        {/* =============================================
            MODAL HEADER
        ============================================= */}

        <div className="border-b border-zinc-900 bg-zinc-950 px-5 py-5 sm:px-7">

          <div className="flex items-start justify-between gap-5">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <StatusBadge
                  tone={
                    lesson.level
                    === "Beginner"
                      ? "neutral"
                      : "info"
                  }
                >
                  {
                    lesson.level
                  }
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    lesson.duration
                  }
                </StatusBadge>


                {completed
                && (
                  <StatusBadge
                    tone="positive"
                    dot
                  >
                    Completed
                  </StatusBadge>
                )}

              </div>


              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {
                  lesson.title
                }
              </h2>


              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                {
                  lesson.description
                }
              </p>

            </div>


            <button
              type="button"

              onClick={
                onClose
              }

              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-black text-lg text-zinc-500 transition hover:border-zinc-700 hover:text-white"
            >
              ×
            </button>

          </div>

        </div>


        {/* =============================================
            SCROLL CONTENT
        ============================================= */}

        <div className="max-h-[calc(94vh-118px)] overflow-y-auto">

          <div className="px-5 py-7 sm:px-7">

            {/* WHAT YOU WILL LEARN */}

            <section>

              <SectionHeading
                eyebrow="Lesson overview"
                title="What you'll learn"
              />


              <div className="mt-4 grid gap-2 sm:grid-cols-2">

                {lesson.points.map(
                  (
                    point,
                  ) => (
                    <div
                      key={
                        point
                      }

                      className="flex items-center gap-3 rounded-xl border border-zinc-900 bg-black px-4 py-3"
                    >

                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />


                      <span className="text-sm text-zinc-400">
                        {
                          point
                        }
                      </span>

                    </div>
                  ),
                )}

              </div>

            </section>


            {/* CONTENT */}

            <section className="mt-10">

              <SectionHeading
                eyebrow="Lesson"
                title="Core concepts"
              />


              <div className="mt-6 space-y-3">

                {lesson.sections.map(
                  (
                    section,
                    index,
                  ) => (
                    <article
                      key={
                        section.title
                      }

                      className="rounded-2xl border border-zinc-900 bg-black/40 p-5"
                    >

                      <div className="flex gap-4">

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-black text-[10px] font-semibold text-zinc-600">
                          {
                            String(
                              index
                              + 1,
                            ).padStart(
                              2,
                              "0",
                            )
                          }
                        </span>


                        <div>

                          <h3 className="font-semibold text-zinc-200">
                            {
                              section.title
                            }
                          </h3>


                          <p className="mt-2 text-sm leading-7 text-zinc-500">
                            {
                              section.content
                            }
                          </p>

                        </div>

                      </div>

                    </article>
                  ),
                )}

              </div>

            </section>


            {/* EXAMPLE */}

            <section className="mt-8">

              <Card
                className="border-blue-950 bg-blue-950/10"
              >

                <div className="flex gap-4">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-900/60 bg-blue-950/30 text-sm font-semibold text-blue-400">
                    E
                  </div>


                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-400">
                      Practical example
                    </p>


                    <h3 className="mt-2 font-semibold text-zinc-200">
                      {
                        lesson.example.title
                      }
                    </h3>


                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      {
                        lesson.example.content
                      }
                    </p>

                  </div>

                </div>

              </Card>

            </section>


            {/* QUIZ */}

            <section className="mt-10 border-t border-zinc-900 pt-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <SectionHeading
                  eyebrow="Knowledge check"
                  title="Quick quiz"
                  description="Answer every question before completing the lesson."
                />


                <StatusBadge
                  tone={
                    quizComplete
                      ? score >= 70
                        ? "positive"
                        : "warning"
                      : "neutral"
                  }
                >
                  {
                    Object.keys(
                      answers,
                    ).length
                  }
                  {" / "}
                  {
                    lesson.quiz.length
                  }
                  {" answered"}
                </StatusBadge>

              </div>


              <div className="mt-6 space-y-4">

                {lesson.quiz.map(
                  (
                    question,
                    questionIndex,
                  ) => {
                    const selectedAnswer =
                      answers[
                        questionIndex
                      ];


                    const answered =
                      selectedAnswer
                      !== undefined;


                    const correct =
                      selectedAnswer
                      === question.correctIndex;


                    return (
                      <article
                        key={
                          question.question
                        }

                        className="rounded-2xl border border-zinc-900 bg-black p-5 sm:p-6"
                      >

                        <div className="flex gap-3">

                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-zinc-950 text-xs font-semibold text-zinc-600">
                            {
                              questionIndex
                              + 1
                            }
                          </span>


                          <p className="pt-1 font-medium leading-6 text-zinc-200">
                            {
                              question.question
                            }
                          </p>

                        </div>


                        <div className="mt-5 grid gap-2">

                          {question.options.map(
                            (
                              option,
                              optionIndex,
                            ) => {
                              const selected =
                                selectedAnswer
                                === optionIndex;


                              const correctOption =
                                optionIndex
                                === question.correctIndex;


                              let classes =
                                "border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white";


                              if (
                                answered
                                && correctOption
                              ) {
                                classes =
                                  "border-emerald-900/70 bg-emerald-950/20 text-emerald-300";

                              } else if (
                                answered
                                && selected
                              ) {
                                classes =
                                  "border-red-900/70 bg-red-950/20 text-red-300";
                              }


                              return (
                                <button
                                  key={
                                    option
                                  }

                                  type="button"

                                  disabled={
                                    answered
                                  }

                                  onClick={() =>
                                    setAnswers(
                                      (
                                        current,
                                      ) => ({
                                        ...current,

                                        [questionIndex]:
                                          optionIndex,
                                      }),
                                    )
                                  }

                                  className={`rounded-xl border px-4 py-3.5 text-left text-sm transition ${classes}`}
                                >
                                  {
                                    option
                                  }
                                </button>
                              );
                            },
                          )}

                        </div>


                        {answered
                        && (
                          <div
                            className={`mt-4 rounded-xl border px-4 py-3 ${
                              correct
                                ? "border-emerald-950 bg-emerald-950/15"
                                : "border-red-950 bg-red-950/15"
                            }`}
                          >

                            <div className="flex items-center gap-2">

                              <StatusBadge
                                tone={
                                  correct
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {
                                  correct
                                    ? "Correct"
                                    : "Incorrect"
                                }
                              </StatusBadge>

                            </div>


                            <p
                              className={`mt-3 text-sm leading-6 ${
                                correct
                                  ? "text-emerald-300/80"
                                  : "text-red-300/80"
                              }`}
                            >
                              {
                                question.explanation
                              }
                            </p>

                          </div>
                        )}

                      </article>
                    );
                  },
                )}

              </div>


              {quizComplete
              && (
                <Card
                  className="mt-6"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
                        Quiz result
                      </p>


                      <p className="mt-2 text-2xl font-semibold text-white">
                        {
                          correctAnswers
                        }
                        {" / "}
                        {
                          lesson.quiz.length
                        }
                      </p>


                      <p className="mt-1 text-xs text-zinc-600">
                        {
                          score >= 70
                            ? "Lesson check completed."
                            : "Review the explanations before continuing."
                        }
                      </p>

                    </div>


                    <div className="text-left sm:text-right">

                      <p
                        className={`text-3xl font-semibold ${
                          score >= 70
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {
                          score.toFixed(
                            0,
                          )
                        }
                        %
                      </p>


                      <StatusBadge
                        tone={
                          score >= 70
                            ? "positive"
                            : "warning"
                        }

                        className="mt-2"
                      >
                        {
                          score >= 70
                            ? "Passed"
                            : "Review recommended"
                        }
                      </StatusBadge>

                    </div>

                  </div>

                </Card>
              )}

            </section>


            {/* FOOTER */}

            <div className="mt-10 flex flex-col gap-4 border-t border-zinc-900 pt-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-medium text-zinc-300">
                  {
                    completed
                      ? "Lesson completed"
                      : quizComplete
                        ? "Ready to finish"
                        : "Finish the knowledge check"
                  }
                </p>


                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  {
                    completed
                      ? "You can mark this lesson incomplete if you want to revisit it."
                      : quizComplete
                        ? "Your quiz is complete. Mark the lesson finished when you're ready."
                        : "Answer every quiz question before marking this lesson complete."
                  }
                </p>

              </div>


              <div className="flex shrink-0 gap-2">

                <button
                  type="button"

                  onClick={
                    onClose
                  }

                  className="rounded-xl border border-zinc-800 bg-black px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                >
                  Close
                </button>


                <button
                  type="button"

                  onClick={
                    onToggle
                  }

                  disabled={
                    !completed
                    && !quizComplete
                  }

                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    completed
                      ? "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      : quizComplete
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "cursor-not-allowed bg-zinc-900 text-zinc-700"
                  }`}
                >
                  {
                    completed
                      ? "Mark incomplete"
                      : quizComplete
                        ? "Complete lesson"
                        : "Complete quiz first"
                  }
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}