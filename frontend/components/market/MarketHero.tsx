import SetupTrackingButton from "@/components/alerts/SetupTrackingButton";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  getActionTone,
  getRiskClass,
  getScoreClass,
} from "@/lib/market/formatters";

import type {
  Alert,
  CreateAlertInput,
} from "@/lib/alerts/types";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type MarketHeroProps = {
  analysis:
    MarketAnalysis;

  alerts:
    Alert[];

  alertSaving:
    boolean;

  onCreateAlert: (
    input: CreateAlertInput,
  ) => Promise<unknown>;

  onDeleteAlert: (
    alertId: number,
  ) => Promise<unknown>;

  watchlisted: boolean;

  watchlistLoading: boolean;

  watchlistSaving: boolean;

  onToggleWatchlist: (
    symbol: string,
  ) => Promise<void>;
};


export default function MarketHero({
  analysis,
  alerts,
  alertSaving,
  onCreateAlert,
  onDeleteAlert,
  watchlisted,
  watchlistLoading,
  watchlistSaving,
  onToggleWatchlist,
}: MarketHeroProps) {
  return (
    <Card>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <p className="text-sm font-semibold text-zinc-300">
                {
                  analysis.symbol
                }
              </p>


              <StatusBadge
                tone={
                  getActionTone(
                    analysis.action_state,
                  )
                }
                className="h-9 border-violet-500/25 bg-violet-500/[0.08] px-3.5 text-[12px] font-semibold text-zinc-100 shadow-[0_0_18px_rgba(139,92,246,0.06)]"
                dot
              >
                {
                  analysis.action_state
                }
              </StatusBadge>

            </div>


            <div className="flex flex-wrap items-start gap-2">

              <SetupTrackingButton
                symbol={
                  analysis.symbol
                }
                alerts={
                  alerts
                }
                saving={
                  alertSaving
                }
                onCreate={
                  onCreateAlert
                }
                onDelete={
                  onDeleteAlert
                }
              />


              <button
                type="button"

                disabled={
                  watchlistLoading
                  || watchlistSaving
                }

                onClick={() => {
                  void onToggleWatchlist(
                    analysis.symbol,
                  );
                }}

                className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  watchlisted
                    ? "border-violet-500/30 bg-violet-500/[0.08] text-zinc-100 hover:bg-violet-500/[0.12]"
                    : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-violet-500/25 hover:bg-violet-500/[0.05] hover:text-white"
                }`}
              >
                {
                  watchlistLoading
                    ? "Loading…"
                    : watchlistSaving
                      ? "Saving…"
                      : watchlisted
                        ? "★ Watchlisted"
                        : "☆ Watchlist"
                }
              </button>

            </div>

          </div>


          <div className="mt-4 flex flex-wrap items-baseline gap-4">

            <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              $
              {
                analysis.price
                  .toFixed(
                    2,
                  )
              }
            </p>


            <p
              className={`text-base font-semibold ${
                analysis.change_percent
                >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {
                analysis.change_percent
                >= 0
                  ? "+"
                  : ""
              }

              {
                analysis.change_percent
                  .toFixed(
                    2,
                  )
              }%
            </p>

          </div>


          <p className="mt-3 text-sm text-zinc-600">
            Previous close $
            {
              analysis.previous_close
                .toFixed(
                  2,
                )
            }
          </p>

        </div>


        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">

          <HeroMetric
            label="Opportunity"

            value={`${analysis.opportunity_score}/100`}

            valueClass={
              getScoreClass(
                analysis.opportunity_score,
              )
            }
          />


          <HeroMetric
            label="Trend"

            value={`${analysis.trend_score}/100`}

            valueClass={
              getScoreClass(
                analysis.trend_score,
              )
            }
          />


          <HeroMetric
            label="Intraday"

            value={`${analysis.intraday_score}/100`}

            valueClass={
              getScoreClass(
                analysis.intraday_score,
              )
            }
          />


          <HeroMetric
            label="Risk"

            value={
              analysis.risk_level
            }

            valueClass={
              getRiskClass(
                analysis.risk_level,
              )
            }
          />

        </div>

      </div>

    </Card>
  );
}


/* =========================================================
   HERO METRIC
========================================================= */

function HeroMetric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-2 text-sm font-semibold ${
          valueClass
          ?? "text-white"
        }`}
      >
        {
          value
        }
      </p>

    </div>
  );
}