"use client";

import {
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";


type CoachPattern = {
  title: string;
  evidence: string;
  impact: string;
};


type CoachReport = {
  summary: string;

  strengths:
    CoachPattern[];

  weaknesses:
    CoachPattern[];

  recommendations:
    string[];

  next_focus:
    string;

  sample_size_warning:
    string;
};


type CoachState =
  | "idle"
  | "loading"
  | "complete"
  | "error";


export default function AICoachPage() {
  const [
    report,
    setReport,
  ] = useState<
    CoachReport | null
  >(
    null,
  );


  const [
    state,
    setState,
  ] = useState<
    CoachState
  >(
    "idle",
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  const [
    analyzedAt,
    setAnalyzedAt,
  ] = useState<
    Date | null
  >(
    null,
  );


  const loading =
    state === "loading";


  async function runAnalysis() {
    try {
      setState(
        "loading",
      );

      setError(
        "",
      );


      const response =
        await api(
          "/ai-coach/analyze",
          {
            method:
              "POST",
          },
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          typeof details?.detail
          === "string"
            ? details.detail
            : "The AI Coach could not analyze your trades.",
        );
      }


      const data:
        CoachReport =
        await response
          .json();


      setReport(
        data,
      );


      setAnalyzedAt(
        new Date(),
      );


      setState(
        "complete",
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );


      setState(
        "error",
      );
    }
  }


  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="AI Coach"
      />


      <main className="min-w-0 flex-1">

        <header className="border-b border-zinc-800 px-6 py-7 lg:px-10">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <p className="text-sm text-blue-400">
                AI performance coach
              </p>


              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Turn your journal into better decisions.
              </h1>


              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Review execution, risk,
                R-multiples, confidence,
                psychology, strategies and
                Playbook usage to find
                repeatable patterns in your
                own trading history.
              </p>

            </div>


            <button
              type="button"

              onClick={() =>
                void runAnalysis()
              }

              disabled={
                loading
              }

              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {
                loading
                  ? "Analyzing..."
                  : report
                    ? "Run analysis again"
                    : "Run analysis"
              }
            </button>

          </div>

        </header>


        <div className="space-y-6 p-6 lg:p-10">

          {error && (
            <div className="rounded-2xl border border-red-900/70 bg-red-950/20 p-5">

              <div className="flex gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-900 bg-red-950/50 text-sm font-semibold text-red-300">
                  !
                </div>


                <div>

                  <p className="text-sm font-medium text-red-400">
                    Analysis failed
                  </p>


                  <p className="mt-2 text-sm leading-6 text-red-200/80">
                    {
                      error
                    }
                  </p>

                </div>

              </div>

            </div>
          )}


          {!report
            && !loading
            && (
              <CoachLanding
                onRun={() =>
                  void runAnalysis()
                }
              />
            )}


          {loading && (
            <CoachLoading />
          )}


          {report
            && !loading
            && (
              <>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                  <CoachInfoCard
                    label="Analysis"
                    value="Journal review"
                    detail="Based only on your recorded trades"
                  />


                  <CoachInfoCard
                    label="Strengths found"
                    value={
                      report.strengths
                        .length
                        .toString()
                    }
                    detail="Potential positive patterns"
                  />


                  <CoachInfoCard
                    label="Weaknesses found"
                    value={
                      report.weaknesses
                        .length
                        .toString()
                    }
                    detail="Areas requiring attention"
                  />


                  <CoachInfoCard
                    label="Recommendations"
                    value={
                      report.recommendations
                        .length
                        .toString()
                    }
                    detail={
                      analyzedAt
                        ? `Updated ${analyzedAt.toLocaleTimeString(
                            "en-CA",
                            {
                              hour:
                                "numeric",

                              minute:
                                "2-digit",
                            },
                          )}`
                        : "Latest coach report"
                    }
                  />

                </section>


                {report.sample_size_warning
                  && (
                    <section className="rounded-2xl border border-amber-900/70 bg-amber-950/20 p-5">

                      <div className="flex gap-4">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-800 bg-amber-950/50 text-amber-300">
                          !
                        </div>


                        <div>

                          <p className="text-sm font-medium text-amber-400">
                            Sample-size note
                          </p>


                          <p className="mt-2 max-w-4xl text-sm leading-7 text-amber-100/80">
                            {
                              report
                                .sample_size_warning
                            }
                          </p>

                        </div>

                      </div>

                    </section>
                  )}


                <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                    <div className="max-w-4xl">

                      <p className="text-sm text-blue-400">
                        Coach summary
                      </p>


                      <h2 className="mt-1 text-2xl font-semibold">
                        What your journal is showing
                      </h2>


                      <p className="mt-4 text-sm leading-7 text-zinc-300">
                        {
                          report.summary
                        }
                      </p>

                    </div>


                    <div className="shrink-0 rounded-xl border border-zinc-800 bg-black px-4 py-3">

                      <p className="text-xs uppercase tracking-wide text-zinc-600">
                        Analysis type
                      </p>


                      <p className="mt-1 text-sm font-medium text-zinc-300">
                        Process-based
                      </p>

                    </div>

                  </div>

                </section>


                <section>

                  <SectionHeading
                    eyebrow="Patterns"
                    title="What your trading history is revealing"
                    description="The coach separates positive patterns from repeated issues so you can focus on evidence instead of individual outcomes."
                  />


                  <div className="mt-5 grid gap-6 xl:grid-cols-2">

                    <PatternSection
                      tone="positive"

                      eyebrow="Strengths"

                      title="What appears to be working"

                      emptyText="No reliable strength has been identified yet."

                      patterns={
                        report.strengths
                      }
                    />


                    <PatternSection
                      tone="negative"

                      eyebrow="Weaknesses"

                      title="What needs attention"

                      emptyText="No reliable weakness has been identified yet."

                      patterns={
                        report.weaknesses
                      }
                    />

                  </div>

                </section>


                <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">

                  <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                    <p className="text-sm text-blue-400">
                      Recommendations
                    </p>


                    <h2 className="mt-1 text-xl font-semibold">
                      Process improvements
                    </h2>


                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      These should be concrete
                      changes you can apply and
                      review in future sessions.
                    </p>


                    <div className="mt-6 space-y-3">

                      {report.recommendations.length
                        === 0
                        ? (
                          <EmptyCard
                            text="No recommendations were generated."
                          />
                        )
                        : report.recommendations.map(
                            (
                              recommendation,
                              index,
                            ) => (
                              <div
                                key={`${recommendation}-${index}`}

                                className="group flex gap-4 rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-700"
                              >

                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                                  {
                                    index + 1
                                  }
                                </span>


                                <p className="pt-1 text-sm leading-7 text-zinc-300">
                                  {
                                    recommendation
                                  }
                                </p>

                              </div>
                            ),
                          )}

                    </div>

                  </article>


                  <article className="rounded-2xl border border-blue-900/70 bg-blue-950/20 p-6">

                    <p className="text-sm text-blue-400">
                      Next focus
                    </p>


                    <h2 className="mt-1 text-xl font-semibold">
                      One thing to prioritize
                    </h2>


                    <p className="mt-4 text-sm leading-7 text-zinc-200">
                      {
                        report.next_focus
                      }
                    </p>


                    <div className="mt-6 rounded-xl border border-blue-900/50 bg-black/40 p-4">

                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Before your next trade
                      </p>


                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        Read this focus before
                        entering a position, then
                        review whether you followed
                        it when journaling the trade.
                      </p>

                    </div>

                  </article>

                </section>


                <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                  <SectionHeading
                    eyebrow="What the coach considers"
                    title="Your analysis gets stronger as your journal improves"
                    description="The newest journal fields give the coach more context for separating a bad trade from a valid loss."
                  />


                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    <AnalysisDimension
                      title="Risk & R"
                      description="Stop loss, planned reward-to-risk and actual R result."
                    />


                    <AnalysisDimension
                      title="Execution"
                      description="Entry, exit, direction, setup and repeated trade tags."
                    />


                    <AnalysisDimension
                      title="Psychology"
                      description="Confidence, FOMO, revenge trading and journal notes."
                    />


                    <AnalysisDimension
                      title="Playbook"
                      description="Whether defined setups are being followed consistently."
                    />

                  </div>

                </section>


                <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-sm text-blue-400">
                        Refresh your analysis
                      </p>


                      <h2 className="mt-1 text-lg font-semibold">
                        Your report evolves with your journal.
                      </h2>


                      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                        Add trades with stops,
                        targets, Playbook setups,
                        tags and psychology notes,
                        then run the coach again.
                      </p>

                    </div>


                    <button
                      type="button"

                      onClick={() =>
                        void runAnalysis()
                      }

                      disabled={
                        loading
                      }

                      className="shrink-0 rounded-xl border border-zinc-700 bg-black px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
                    >
                      Run analysis again
                    </button>

                  </div>

                </section>

              </>
            )}

        </div>

      </main>

    </div>
  );
}


function CoachLanding({
  onRun,
}: {
  onRun:
    () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">

      <div className="p-8 text-center lg:p-12">

        <p className="text-sm text-blue-400">
          Personalized journal analysis
        </p>


        <h2 className="mt-2 text-3xl font-semibold">
          Find the patterns you cannot see trade by trade.
        </h2>


        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
          A Trader reviews your own
          journal history and looks for
          repeated behavior across
          execution, strategy, risk,
          R-multiples, confidence and
          psychology.
        </p>


        <button
          type="button"

          onClick={
            onRun
          }

          className="mt-7 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Analyze my trades
        </button>

      </div>


      <div className="grid border-t border-zinc-800 md:grid-cols-2 xl:grid-cols-4">

        <CoachCapability
          title="Execution patterns"

          description="Compare entries, exits and repeated behaviors across trades."
        />


        <CoachCapability
          title="Risk quality"

          description="Review stop usage, R-multiples and planned reward-to-risk."
        />


        <CoachCapability
          title="Psychology"

          description="Connect confidence and emotional tags with actual outcomes."
        />


        <CoachCapability
          title="Playbook discipline"

          description="See whether your established setups are producing consistent execution."
        />

      </div>

    </section>
  );
}


function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;

  title: string;

  description: string;
}) {
  return (
    <div>

      <p className="text-sm text-blue-400">
        {
          eyebrow
        }
      </p>


      <h2 className="mt-1 text-xl font-semibold">
        {
          title
        }
      </h2>


      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
        {
          description
        }
      </p>

    </div>
  );
}


function CoachInfoCard({
  label,
  value,
  detail,
}: {
  label: string;

  value: string;

  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

      <p className="text-sm text-zinc-500">
        {
          label
        }
      </p>


      <p className="mt-2 text-2xl font-semibold">
        {
          value
        }
      </p>


      <p className="mt-2 text-xs leading-5 text-zinc-600">
        {
          detail
        }
      </p>

    </article>
  );
}


function PatternSection({
  tone,
  eyebrow,
  title,
  emptyText,
  patterns,
}: {
  tone:
    | "positive"
    | "negative";

  eyebrow: string;

  title: string;

  emptyText: string;

  patterns:
    CoachPattern[];
}) {
  const isPositive =
    tone === "positive";


  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <p
        className={`text-sm ${
          isPositive
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {
          eyebrow
        }
      </p>


      <h2 className="mt-1 text-xl font-semibold">
        {
          title
        }
      </h2>


      <div className="mt-5 space-y-4">

        {patterns.length === 0
          ? (
            <EmptyCard
              text={
                emptyText
              }
            />
          )
          : patterns.map(
              (
                item,
                index,
              ) => (
                <div
                  key={`${item.title}-${index}`}

                  className={`rounded-xl border p-5 ${
                    isPositive
                      ? "border-emerald-900/60 bg-emerald-950/15"
                      : "border-red-900/60 bg-red-950/15"
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isPositive
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-red-950 text-red-400"
                      }`}
                    >
                      {
                        index + 1
                      }
                    </span>


                    <h3
                      className={`font-semibold ${
                        isPositive
                          ? "text-emerald-300"
                          : "text-red-300"
                      }`}
                    >
                      {
                        item.title
                      }
                    </h3>

                  </div>


                  <div className="mt-5 grid gap-5 lg:grid-cols-2">

                    <div>

                      <p className="text-xs uppercase tracking-wide text-zinc-600">
                        Journal evidence
                      </p>


                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {
                          item.evidence
                        }
                      </p>

                    </div>


                    <div>

                      <p className="text-xs uppercase tracking-wide text-zinc-600">
                        Why it matters
                      </p>


                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {
                          item.impact
                        }
                      </p>

                    </div>

                  </div>

                </div>
              ),
            )}

      </div>

    </article>
  );
}


function CoachCapability({
  title,
  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div className="border-b border-zinc-800 p-5 text-left last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">

      <p className="text-sm font-medium text-zinc-200">
        {
          title
        }
      </p>


      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {
          description
        }
      </p>

    </div>
  );
}


function AnalysisDimension({
  title,
  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">

      <p className="text-sm font-medium text-zinc-200">
        {
          title
        }
      </p>


      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {
          description
        }
      </p>

    </div>
  );
}


function EmptyCard({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-5 text-sm text-zinc-500">
      {
        text
      }
    </div>
  );
}


function CoachLoading() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="flex items-center gap-4">

        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />


        <div>

          <p className="font-semibold">
            Reviewing your journal...
          </p>


          <p className="mt-1 text-sm text-zinc-500">
            Comparing execution,
            strategies, R-multiples,
            Playbook setups, confidence
            and psychology.
          </p>

        </div>

      </div>


      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {
          Array.from({
            length:
              4,
          }).map(
            (
              _,
              index,
            ) => (
              <div
                key={
                  index
                }

                className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-black"
              />
            ),
          )
        }

      </div>


      <div className="mt-6 grid gap-6 xl:grid-cols-2">

        <div className="h-72 animate-pulse rounded-xl border border-zinc-800 bg-black" />


        <div className="h-72 animate-pulse rounded-xl border border-zinc-800 bg-black" />

      </div>

    </section>
  );
}