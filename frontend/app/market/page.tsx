"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import PageSectionNav from "@/components/ui/PageSectionNav";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import MarketSearch from "@/components/market/MarketSearch";
import MarketHero from "@/components/market/MarketHero";
import OpportunitySection from "@/components/market/OpportunitySection";
import TradePlanSection from "@/components/market/TradePlanSection";
import TradeHorizonSection from "@/components/market/TradeHorizonSection";
import TechnicalDataSection from "@/components/market/TechnicalDataSection";
import MarketSummarySection from "@/components/market/MarketSummarySection";
import InsightsSection from "@/components/market/InsightsSection";
import MarketDisclaimer from "@/components/market/MarketDisclaimer";

import ChartControls from "@/components/market/chart/ChartControls";

import ChartOverlays, {
  type OverlayVisibility,
} from "@/components/market/chart/ChartOverlays";

import PatternControls, {
  type PatternVisibility,
} from "@/components/market/chart/PatternControls";

import TechnicalChart from "@/components/market/chart/TechnicalChart";

import useAlerts from "@/hooks/alerts/useAlerts";
import useMarketAnalysis from "@/hooks/market/useMarketAnalysis";
import useMarketHistory from "@/hooks/market/useMarketHistory";
import type {
  MarketAnalysis,
} from "@/lib/market/types";

/* =========================================================
   DEFAULT CHART SETTINGS
========================================================= */

const DEFAULT_OVERLAYS: OverlayVisibility = {
  support: true,
  resistance: true,

  target: true,
  invalidation: true,

  sma20: false,
  sma50: true,
  sma200: true,

  ema9: false,
  ema20: false,

  volume: true,
};


const DEFAULT_PATTERNS: PatternVisibility = {
  breakouts: true,
  breakdowns: true,

  doubleBottoms: true,
  doubleTops: true,

  movingAverageCrosses: true,

  pivots: false,
};


/* =========================================================
   PAGE
========================================================= */



const MARKET_SECTIONS = [
  { id: "opportunity", label: "Opportunity" },
  { id: "horizon", label: "Horizon" },
  { id: "plan", label: "Plan" },
  { id: "chart", label: "Chart" },
  { id: "technical", label: "Technical" },
  { id: "summary", label: "Summary" },
  { id: "insights", label: "Insights" },
] as const;

export default function MarketPage() {
  return (
    <Suspense
      fallback={
        <MarketPageFallback />
      }
    >
      <MarketPageContent />
    </Suspense>
  );
}


/* =========================================================
   CONTENT
========================================================= */

function MarketPageContent() {
  const searchParams =
    useSearchParams();


  const [
    symbol,
    setSymbol,
  ] = useState(
    "AAPL",
  );


  const [
    overlayVisibility,
    setOverlayVisibility,
  ] = useState<OverlayVisibility>(
    DEFAULT_OVERLAYS,
  );


  const [
    patternVisibility,
    setPatternVisibility,
  ] = useState<PatternVisibility>(
    DEFAULT_PATTERNS,
  );


  const lastUrlSymbolRef =
    useRef<string | null>(
      null,
    );


  /* =======================================================
     MARKET HISTORY
  ======================================================= */

  const history =
    useMarketHistory();


  /* =======================================================
     MARKET ANALYSIS
  ======================================================= */

  const handleAnalysisStart =
    useCallback(
      (
        ticker: string,
      ) => {
        setSymbol(
          ticker,
        );


        history.resetHistory();
      },
      [
        history.resetHistory,
      ],
    );


  const handleAnalysisSuccess =
  useCallback(
    async (
      marketAnalysis: MarketAnalysis,
    ) => {
      await history.loadHistoryForSymbol(
        marketAnalysis.symbol,
      );
    },
    [
      history.loadHistoryForSymbol,
    ],
  );

  const handleAnalysisError =
    useCallback(
      () => {
        history.resetHistory();
      },
      [
        history.resetHistory,
      ],
    );


  const {
    analysis,
    loading,
    refreshing,
    error,
    setError,
    analyzeSymbol,
  } = useMarketAnalysis({
    onAnalysisStart:
      handleAnalysisStart,

    onAnalysisSuccess:
      handleAnalysisSuccess,

    onAnalysisError:
      handleAnalysisError,
  });


  const {
    alerts,
    saving: alertSaving,
    createAlert,
    deleteAlert,
  } = useAlerts();


  /* =======================================================
     URL SYMBOL
  ======================================================= */

  const requestedSymbol =
    searchParams
      .get(
        "symbol",
      )
      ?.trim()
      .toUpperCase()
    ?? "";


  useEffect(
    () => {
      if (
        !requestedSymbol
      ) {
        return;
      }


      if (
        lastUrlSymbolRef.current
        === requestedSymbol
      ) {
        return;
      }


      lastUrlSymbolRef.current =
        requestedSymbol;


      setSymbol(
        requestedSymbol,
      );


      void analyzeSymbol(
        requestedSymbol,
      );
    },
    [
      requestedSymbol,
      analyzeSymbol,
    ],
  );


  /* =======================================================
     SEARCH
  ======================================================= */

  const handleAnalyze =
    (
      event:
        FormEvent,
    ) => {
      event.preventDefault();


      const ticker =
        symbol
          .trim()
          .toUpperCase();


      lastUrlSymbolRef.current =
        ticker;


      void analyzeSymbol(
        ticker,
      );
    };


  const handleQuickSymbol =
    (
      ticker: string,
    ) => {
      const normalized =
        ticker
          .trim()
          .toUpperCase();


      lastUrlSymbolRef.current =
        normalized;


      setSymbol(
        normalized,
      );


      void analyzeSymbol(
        normalized,
      );
    };


  /* =======================================================
     RANGE
  ======================================================= */

  const handleRangeChange =
    (
      next:
        Parameters<
          typeof history.changeRange
        >[1],
    ) => {
      if (
        !analysis
      ) {
        return;
      }


      setError(
        "",
      );


      void history
        .changeRange(
          analysis.symbol,
          next,
        )
        .catch(
          (
            err,
          ) => {
            setError(
              err instanceof Error
                ? err.message
                : "Could not change chart range.",
            );
          },
        );
    };


  /* =======================================================
     INTERVAL
  ======================================================= */

  const handleIntervalChange =
    (
      next:
        Parameters<
          typeof history.changeInterval
        >[1],
    ) => {
      if (
        !analysis
      ) {
        return;
      }


      setError(
        "",
      );


      void history
        .changeInterval(
          analysis.symbol,
          next,
        )
        .catch(
          (
            err,
          ) => {
            setError(
              err instanceof Error
                ? err.message
                : "Could not change candle interval.",
            );
          },
        );
    };


  /* =======================================================
     OLDER HISTORY
  ======================================================= */

  const handleNeedMore =
    useCallback(
      () => {
        if (
          !analysis
        ) {
          return;
        }


        void history.loadOlderHistory(
          analysis.symbol,
        );
      },
      [
        analysis,
        history.loadOlderHistory,
      ],
    );


  /* =======================================================
     AUTO INTERVAL
  ======================================================= */

  const handleVisibleRangeChange =
    useCallback(
      (
        visibleDays: number,
        range:
          Parameters<
            typeof history.handleVisibleRangeChange
          >[2],
      ) => {
        if (
          !analysis
        ) {
          return;
        }


        void history.handleVisibleRangeChange(
          analysis.symbol,
          visibleDays,
          range,
        );
      },
      [
        analysis,
        history.handleVisibleRangeChange,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Market Analysis"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Market intelligence"

            title="Market Analyzer"

            description="Analyze market structure, current momentum, setup quality and technical reward-to-risk while exploring price action directly on an interactive chart."

            status={
              analysis
                ? (
                    <>
                      <StatusBadge
                        tone={
                          refreshing
                            ? "info"
                            : "positive"
                        }

                        dot
                      >
                        {
                          refreshing
                            ? "Updating market data"
                            : "Live analysis"
                        }
                      </StatusBadge>


                      <StatusBadge
                        tone="neutral"
                      >
                        Refreshes every 15s
                      </StatusBadge>
                    </>
                  )

                : (
                    <StatusBadge
                      tone="neutral"
                    >
                      Ready for analysis
                    </StatusBadge>
                  )
            }
          />


          <PageSectionNav sections={MARKET_SECTIONS} />


          <div className="space-y-8">

            {/* ===========================================
                SEARCH
            =========================================== */}

            <MarketSearch
              symbol={
                symbol
              }

              analysis={
                analysis
              }

              loading={
                loading
              }

              historyLoading={
                history.historyLoading
              }

              onSymbolChange={
                setSymbol
              }

              onSubmit={
                handleAnalyze
              }

              onQuickSymbol={
                handleQuickSymbol
              }
            />


            {/* ===========================================
                ERROR
            =========================================== */}

            {
              error
              && (
                <div className="rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
                  {error}
                </div>
              )
            }


            {/* ===========================================
                EMPTY
            =========================================== */}

            {
              !analysis
              && !loading
              && (
                <Card>

                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
                      ↗
                    </div>


                    <p className="mt-4 text-lg font-semibold text-zinc-200">
                      Search a market symbol to begin
                    </p>


                    <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600">
                      A-Trader will analyze technical structure,
                      current momentum, support and resistance,
                      trade horizon, technical levels and
                      historical price action.
                    </p>

                  </div>

                </Card>
              )
            }


            {/* ===========================================
                INITIAL LOADING
            =========================================== */}

            {
              loading
              && !analysis
              && (
                <Card>

                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                    <span className="relative flex h-3 w-3">

                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />

                      <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-400" />

                    </span>


                    <p className="mt-5 font-medium text-zinc-300">
                      Analyzing {symbol}…
                    </p>


                    <p className="mt-2 text-sm text-zinc-600">
                      Loading technical analysis and chart history.
                    </p>

                  </div>

                </Card>
              )
            }


            {/* ===========================================
                ANALYSIS
            =========================================== */}

            {
              analysis
              && (
                <>

                  <MarketHero
                    analysis={
                      analysis
                    }

                    alerts={
                      alerts
                    }

                    alertSaving={
                      alertSaving
                    }

                    onCreateAlert={
                      createAlert
                    }

                    onDeleteAlert={
                      deleteAlert
                    }
                  />


                  <div id="opportunity" className="scroll-mt-28">
                  <OpportunitySection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  <div id="horizon" className="scroll-mt-28">
                  <TradeHorizonSection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  <div id="plan" className="scroll-mt-28">
                  <TradePlanSection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  {/* =====================================
                      CHART
                  ===================================== */}

                  <section id="chart" className="scroll-mt-28">

                    <div>

                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                        Price action
                      </p>


                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                        Interactive technical chart
                      </h2>


                      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
                        Explore price action, moving averages,
                        technical levels and automatically detected
                        chart patterns. Auto mode adapts the candle
                        interval as you zoom.
                      </p>

                    </div>


                    <Card
                      className="mt-4"
                    >

                      <div className="flex flex-col gap-5">

                        {/* =================================
                            CHART STATUS
                        ================================= */}

                        <div className="flex flex-wrap items-center gap-2">

                          <StatusBadge
                            tone={
                              history.chartPerformance
                              >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {
                              history.chartPerformance
                              >= 0
                                ? "+"
                                : ""
                            }

                            {
                              history.chartPerformance
                                .toFixed(
                                  2,
                                )
                            }%
                          </StatusBadge>


                          <StatusBadge
                            tone="neutral"
                          >
                            {history.chartRange}
                          </StatusBadge>


                          <StatusBadge
                            tone="neutral"
                          >
                            {
                              history.actualInterval
                              === "1wk"
                                ? "1W"
                                : history.actualInterval
                                    .toUpperCase()
                            }
                            {" candles"}
                          </StatusBadge>


                          {
                            history.intervalMode
                            === "auto"
                            && (
                              <StatusBadge
                                tone="info"
                              >
                                Auto interval
                              </StatusBadge>
                            )
                          }

                        </div>


                        {/* =================================
                            RANGE + INTERVAL
                        ================================= */}

                        <ChartControls
                          range={
                            history.chartRange
                          }

                          intervalMode={
                            history.intervalMode
                          }

                          activeInterval={
                            history.actualInterval
                          }

                          loading={
                            history.historyLoading
                          }

                          onRangeChange={
                            handleRangeChange
                          }

                          onIntervalChange={
                            handleIntervalChange
                          }
                        />


                        {/* =================================
                            OVERLAYS
                        ================================= */}

                        <ChartOverlays
                          visibility={
                            overlayVisibility
                          }

                          onChange={
                            setOverlayVisibility
                          }
                        />


                        {/* =================================
                            PATTERNS
                        ================================= */}

                        <PatternControls
                          visibility={
                            patternVisibility
                          }

                          onChange={
                            setPatternVisibility
                          }
                        />


                        <p className="text-xs leading-5 text-zinc-700">
                          Pattern detection is based on historical
                          price structure and can produce false or
                          incomplete signals. Moving averages shown
                          on the chart are calculated from the
                          currently displayed candle interval.
                        </p>


                        {/* =================================
                            CHART
                        ================================= */}

                        {
                          history.historyLoading
                          && history.historyData.length
                          === 0
                            ? (
                                <div className="flex h-[440px] items-center justify-center rounded-xl border border-zinc-900 bg-black text-sm text-zinc-600">
                                  Loading market history…
                                </div>
                              )

                            : history.historyData.length
                              > 0
                              ? (
                                  <TechnicalChart
                                    key={`${analysis.symbol}-${history.actualInterval}`}

                                    data={
                                      history.historyData
                                    }

                                    interval={
                                      history.actualInterval
                                    }

                                    analysis={
                                      analysis
                                    }

                                    overlays={
                                      overlayVisibility
                                    }

                                    patterns={
                                      patternVisibility
                                    }

                                    hasMore={
                                      history.hasMoreHistory
                                    }

                                    loadingMore={
                                      history.loadingMore
                                    }

                                    restoreRange={
                                      history.restoreRange
                                    }

                                    onNeedMore={
                                      handleNeedMore
                                    }

                                    onVisibleRangeChange={
                                      handleVisibleRangeChange
                                    }
                                  />
                                )

                              : (
                                  <div className="flex h-[440px] items-center justify-center rounded-xl border border-zinc-900 bg-black text-sm text-zinc-600">
                                    No chart data available.
                                  </div>
                                )
                        }

                      </div>

                    </Card>

                  </section>


                  <div id="technical" className="scroll-mt-28">
                  <TechnicalDataSection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  <div id="summary" className="scroll-mt-28">
                  <MarketSummarySection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  <div id="insights" className="scroll-mt-28">
                  <InsightsSection
                    analysis={
                      analysis
                    }
                  />
                  </div>


                  <MarketDisclaimer />

                </>
              )
            }

          </div>

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function MarketPageFallback() {
  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Market Analysis"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Market intelligence"
            title="Market Analyzer"
            description="Loading market analysis…"
            status={
              <StatusBadge
                tone="neutral"
              >
                Loading
              </StatusBadge>
            }
          />


          <Card>

            <div className="flex min-h-64 items-center justify-center text-sm text-zinc-600">
              Loading Market Analyzer…
            </div>

          </Card>

        </div>

      </main>

    </div>
  );
}