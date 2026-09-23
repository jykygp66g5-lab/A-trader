"use client";

import {
  FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import PageSectionNav from "@/components/ui/PageSectionNav";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";

import ReplayChart from "@/components/replay/ReplayChart";

import ReplayTradePanel, {
  type ReplayTradeMarker,
} from "@/components/replay/ReplayTradePanel";

import {
  loadReplaySession,
  type ReplayBar,
  type ReplayInterval,
  type ReplaySession,
} from "@/lib/replay";


/* =========================================================
   HELPERS
========================================================= */

function formatReplayPrice(
  value:
    number
    | null,
) {
  if (
    value === null
  ) {
    return "—";
  }


  return `$${value.toFixed(
    2,
  )}`;
}


function formatReplayTime(
  value:
    string
    | null,
) {
  if (
    !value
  ) {
    return "Waiting for first candle";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }


  return date.toLocaleTimeString(
    "en-CA",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   PAGE
========================================================= */



const REPLAY_SECTIONS = [
  { id: "setup", label: "Setup" },
  { id: "overview", label: "Overview" },
  { id: "chart", label: "Chart" },
  { id: "execution", label: "Execution" },
  { id: "info", label: "Info" },
] as const;

export default function ReplayPage() {
  const [
    symbol,
    setSymbol,
  ] = useState(
    "AAPL",
  );


  const [
    sessionDate,
    setSessionDate,
  ] = useState(
    "",
  );


  const [
    interval,
    setInterval,
  ] = useState<
    ReplayInterval
  >(
    "5m",
  );


  const [
    session,
    setSession,
  ] = useState<
    ReplaySession | null
  >(
    null,
  );


  const [
    visibleBars,
    setVisibleBars,
  ] = useState<
    ReplayBar[]
  >(
    [],
  );


  const [
    tradeMarkers,
    setTradeMarkers,
  ] = useState<
    ReplayTradeMarker[]
  >(
    [],
  );


  const [
    hasOpenPosition,
    setHasOpenPosition,
  ] = useState(
    false,
  );


  const [
    loading,
    setLoading,
  ] = useState(
    false,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  /* =======================================================
     CALLBACKS
  ======================================================= */

  const handleProgressChange =
    useCallback(
      (
        bars:
          ReplayBar[],
      ) => {
        setVisibleBars(
          bars,
        );
      },
      [],
    );


  const handleTradeMarker =
    useCallback(
      (
        marker:
          ReplayTradeMarker,
      ) => {
        setTradeMarkers(
          (
            current,
          ) => [
            ...current,
            marker,
          ],
        );
      },
      [],
    );


  /* =======================================================
     LIVE REPLAY METRICS
  ======================================================= */

  const replayOpen =
    visibleBars.length > 0
      ? visibleBars[
          0
        ].open
      : null;


  const replayHigh =
    useMemo(
      () => {
        if (
          visibleBars.length
          === 0
        ) {
          return null;
        }


        return Math.max(
          ...visibleBars.map(
            (
              bar,
            ) =>
              bar.high,
          ),
        );
      },
      [
        visibleBars,
      ],
    );


  const replayLow =
    useMemo(
      () => {
        if (
          visibleBars.length
          === 0
        ) {
          return null;
        }


        return Math.min(
          ...visibleBars.map(
            (
              bar,
            ) =>
              bar.low,
          ),
        );
      },
      [
        visibleBars,
      ],
    );


  const replayCurrent =
    visibleBars.length > 0
      ? visibleBars[
          visibleBars.length
          - 1
        ].close
      : null;


  const replayCurrentTime =
    visibleBars.length > 0
      ? visibleBars[
          visibleBars.length
          - 1
        ].date
      : null;


  const progressPercent =
    session
    && session.total_bars
    > 0
      ? Math.round(
          (
            visibleBars.length
            / session.total_bars
          )
          * 100,
        )
      : 0;


  const sessionMove =
    replayOpen
    !== null
    && replayCurrent
    !== null
    && replayOpen
    !== 0
      ? (
          (
            replayCurrent
            - replayOpen
          )
          / replayOpen
        )
        * 100
      : null;


  /* =======================================================
     LOAD SESSION
  ======================================================= */

  async function handleLoadReplay(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    try {
      setLoading(
        true,
      );


      setError(
        "",
      );


      setVisibleBars(
        [],
      );


      setTradeMarkers(
        [],
      );


      setHasOpenPosition(
        false,
      );


      const result =
        await loadReplaySession({
          symbol,
          sessionDate,
          interval,
        });


      setSession(
        result,
      );

    } catch (
      err
    ) {
      setSession(
        null,
      );


      setVisibleBars(
        [],
      );


      setTradeMarkers(
        [],
      );


      setHasOpenPosition(
        false,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Could not load replay.",
      );

    } finally {
      setLoading(
        false,
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Replay"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Practice mode"

            title="Market Replay"

            description="Replay historical sessions candle by candle without seeing future price action. Practice execution, test trade ideas and review decisions in a controlled environment."

            status={
              <>
                <StatusBadge
                  tone={
                    session
                      ? "positive"
                      : "neutral"
                  }

                  dot={
                    Boolean(
                      session,
                    )
                  }
                >
                  {
                    session
                      ? "Replay active"
                      : "Replay ready"
                  }
                </StatusBadge>


                {session
                && (
                  <StatusBadge
                    tone="neutral"
                  >
                    {
                      session.symbol
                    }
                    {" · "}
                    {
                      session.interval
                    }
                  </StatusBadge>
                )}


                {hasOpenPosition
                && (
                  <StatusBadge
                    tone="warning"
                  >
                    Position open
                  </StatusBadge>
                )}
              </>
            }
          />


          <PageSectionNav sections={REPLAY_SECTIONS} />


          <div className="space-y-8">

            {/* ===========================================
                ERROR
            =========================================== */}

            {error
            && (
              <div className="rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
                {
                  error
                }
              </div>
            )}


            {/* ===========================================
                REPLAY SETUP
            =========================================== */}

            <section id="setup" className="scroll-mt-28">

              <SectionHeading
                eyebrow="Session setup"
                title="Choose a historical session"
                description="Select the symbol, trading date and candle interval you want to practice."
              />


              <Card
                className="mt-4"
              >

                <form
                  onSubmit={
                    handleLoadReplay
                  }

                  className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
                >

                  <FieldLabel
                    label="Symbol"
                  >

                    <input
                      value={
                        symbol
                      }

                      onChange={(
                        event,
                      ) =>
                        setSymbol(
                          event.target.value
                            .toUpperCase(),
                        )
                      }

                      placeholder="AAPL"

                      className="replay-input uppercase"
                    />

                  </FieldLabel>


                  <FieldLabel
                    label="Replay date"
                  >

                    <input
                      type="date"

                      value={
                        sessionDate
                      }

                      onChange={(
                        event,
                      ) =>
                        setSessionDate(
                          event.target.value,
                        )
                      }

                      className="replay-input"
                    />

                  </FieldLabel>


                  <FieldLabel
                    label="Candle interval"
                  >

                    <select
                      value={
                        interval
                      }

                      onChange={(
                        event,
                      ) => {
                        const value =
                          event.target.value;


                        setInterval(
                          value as ReplayInterval,
                        );
                      }}

                      className="replay-input"
                    >

                      <option value="1m">
                        1 minute
                      </option>

                      <option value="5m">
                        5 minutes
                      </option>

                      <option value="15m">
                        15 minutes
                      </option>

                      <option value="30m">
                        30 minutes
                      </option>

                      <option value="1h">
                        1 hour
                      </option>

                      <option value="1d">
                        1 day
                      </option>

                    </select>

                  </FieldLabel>


                  <div className="flex items-end">

                    <button
                      type="submit"

                      disabled={
                        loading
                      }

                      className="min-h-[46px] w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
                    >
                      {
                        loading
                          ? "Loading..."
                          : session
                            ? "Load new session"
                            : "Start replay"
                      }
                    </button>

                  </div>

                </form>


                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-900 pt-5">

                  <StatusBadge
                    tone="neutral"
                  >
                    No future candles
                  </StatusBadge>


                  <StatusBadge
                    tone="neutral"
                  >
                    Historical data
                  </StatusBadge>


                  <StatusBadge
                    tone="neutral"
                  >
                    Manual execution
                  </StatusBadge>

                </div>

              </Card>

            </section>


            {/* ===========================================
                EMPTY STATE
            =========================================== */}

            {!session
            && !loading
            && (
              <Card>

                <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-900 bg-black text-lg text-zinc-600">
                    ▶
                  </div>


                  <p className="mt-5 text-xl font-semibold text-zinc-300">
                    No replay loaded
                  </p>


                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">
                    Select a ticker, historical date and candle interval.
                    Replay will reveal price action progressively so you
                    can make decisions without seeing what happens next.
                  </p>

                </div>

              </Card>
            )}


            {/* ===========================================
                SESSION
            =========================================== */}

            {session
            && (
              <>

                {/* =======================================
                    SESSION OVERVIEW
                ======================================= */}

                <section id="overview" className="scroll-mt-28">

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <SectionHeading
                      eyebrow="Active session"
                      title={`${session.symbol} replay`}
                      description={`${session.session_date} · ${session.interval} candles · ${session.total_bars} historical bars available`}
                    />


                    <div className="flex flex-wrap items-center gap-2">

                      <StatusBadge
                        tone="info"
                      >
                        {
                          visibleBars.length
                        }
                        {" / "}
                        {
                          session.total_bars
                        }
                        {" revealed"}
                      </StatusBadge>


                      <StatusBadge
                        tone={
                          hasOpenPosition
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {
                          hasOpenPosition
                            ? "Rewind locked"
                            : "Rewind available"
                        }
                      </StatusBadge>

                    </div>

                  </div>


                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">

                    <MetricCard
                      label="Open"

                      value={
                        formatReplayPrice(
                          replayOpen,
                        )
                      }

                      detail="First revealed candle"
                    />


                    <MetricCard
                      label="High so far"

                      value={
                        formatReplayPrice(
                          replayHigh,
                        )
                      }

                      detail="Highest revealed price"
                    />


                    <MetricCard
                      label="Low so far"

                      value={
                        formatReplayPrice(
                          replayLow,
                        )
                      }

                      detail="Lowest revealed price"
                    />


                    <MetricCard
                      label="Current"

                      value={
                        formatReplayPrice(
                          replayCurrent,
                        )
                      }

                      detail={
                        formatReplayTime(
                          replayCurrentTime,
                        )
                      }
                    />


                    <MetricCard
                      label="Session move"

                      value={
                        sessionMove
                        === null
                          ? "—"
                          : (
                              <span
                                className={
                                  sessionMove
                                  > 0
                                    ? "text-emerald-400"
                                    : sessionMove
                                      < 0
                                      ? "text-red-400"
                                      : "text-zinc-300"
                                }
                              >
                                {
                                  sessionMove
                                  > 0
                                    ? "+"
                                    : ""
                                }
                                {
                                  sessionMove.toFixed(
                                    2,
                                  )
                                }
                                %
                              </span>
                            )
                      }

                      detail="From replay open"
                    />


                    <MetricCard
                      label="Progress"

                      value={`${progressPercent}%`}

                      detail={`${visibleBars.length} candles revealed`}
                    />

                  </div>


                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-900">

                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"

                      style={{
                        width:
                          `${Math.min(
                            100,
                            Math.max(
                              0,
                              progressPercent,
                            ),
                          )}%`,
                      }}
                    />

                  </div>

                </section>


                {/* =======================================
                    CHART
                ======================================= */}

                <section id="chart" className="scroll-mt-28">

                  <SectionHeading
                    eyebrow="Replay chart"
                    title="Price action"
                    description="Advance through the session one candle at a time and make decisions using only the information that would have been available at that moment."
                  />


                  <Card
                    className="mt-4"
                  >

                    <ReplayChart
                      bars={
                        session.bars
                      }

                      interval={
                        session.interval
                      }

                      symbol={
                        session.symbol
                      }

                      tradeMarkers={
                        tradeMarkers
                      }

                      rewindLocked={
                        hasOpenPosition
                      }

                      onProgressChange={
                        handleProgressChange
                      }
                    />

                  </Card>

                </section>


                {/* =======================================
                    EXECUTION PANEL
                ======================================= */}

                <section id="execution" className="scroll-mt-28">

                  <SectionHeading
                    eyebrow="Practice execution"
                    title="Simulated trade"
                    description="Use the currently revealed market price to practice entries, exits and trade management during the replay."
                  />


                  <Card
                    className="mt-4"
                  >

                    <ReplayTradePanel
                      symbol={
                        session.symbol
                      }

                      currentPrice={
                        replayCurrent
                      }

                      currentTime={
                        replayCurrentTime
                      }

                      sessionKey={`${session.symbol}-${session.session_date}-${session.interval}`}

                      onPositionChange={
                        setHasOpenPosition
                      }

                      onMarker={
                        handleTradeMarker
                      }
                    />

                  </Card>

                </section>


                {/* =======================================
                    SESSION INFORMATION
                ======================================= */}

                <section id="info" className="scroll-mt-28">

                  <SectionHeading
                    eyebrow="Session state"
                    title="Replay information"
                  />


                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                    <InfoCard
                      label="Ticker"
                      value={
                        session.symbol
                      }
                      detail="Historical symbol"
                    />


                    <InfoCard
                      label="Session date"
                      value={
                        session.session_date
                      }
                      detail="Historical trading session"
                    />


                    <InfoCard
                      label="Interval"
                      value={
                        session.interval
                      }
                      detail="Replay candle resolution"
                    />


                    <InfoCard
                      label="Trade markers"
                      value={
                        tradeMarkers.length
                          .toString()
                      }
                      detail="Recorded replay actions"
                    />

                  </div>

                </section>

              </>
            )}

          </div>

        </div>

      </main>


      <style jsx global>{`
        .replay-input {
          width: 100%;
          min-height: 46px;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background: #000;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition:
            border-color 150ms ease,
            background-color 150ms ease;
        }

        .replay-input:hover {
          border-color: rgb(63 63 70);
        }

        .replay-input:focus {
          border-color: rgb(82 82 91);
          background: rgb(9 9 11);
        }

        .replay-input::placeholder {
          color: rgb(63 63 70);
        }

        select.replay-input {
          cursor: pointer;
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

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


/* =========================================================
   FIELD LABEL
========================================================= */

function FieldLabel({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
        {
          label
        }
      </span>


      {
        children
      }

    </label>
  );
}


/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
  detail,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <Card>

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p className="mt-3 text-lg font-semibold text-zinc-200">
        {
          value
        }
      </p>


      <p className="mt-2 text-xs leading-5 text-zinc-600">
        {
          detail
        }
      </p>

    </Card>
  );
}