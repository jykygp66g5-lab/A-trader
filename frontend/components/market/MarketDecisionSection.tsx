import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  formatOptionalPrice,
  getActionTone,
  getRatioClass,
  getRiskClass,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type MarketDecisionSectionProps = {
  analysis: MarketAnalysis;
};


export default function MarketDecisionSection({
  analysis,
}: MarketDecisionSectionProps) {
  const reasons =
    analysis.reasons.slice(
      0,
      3,
    );

  const warnings =
    analysis.warnings.slice(
      0,
      3,
    );


  return (
    <section>

      <div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
          Setup
        </p>


        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white">
          What matters right now.
        </h2>


        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          A-Trader condenses the technical picture into the levels,
          strengths and risks most relevant to the current setup.
        </p>

      </div>


      <div className="mt-5 grid gap-4 sm:mt-6 xl:grid-cols-[0.9fr_1.1fr]">

        {/* ===============================================
            TRADE PLAN
        =============================================== */}

        <Card>

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-600">
                Technical plan
              </p>


              <h3 className="mt-2 text-lg font-semibold text-white">
                Key levels
              </h3>

            </div>


            <StatusBadge
              tone={
                getActionTone(
                  analysis.action_state,
                )
              }
            >
              {analysis.action_state}
            </StatusBadge>

          </div>


          <div className="mt-6 grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 min-[420px]:gap-x-8 min-[420px]:gap-y-6">

            <DecisionMetric
              label="Target"
              value={
                formatOptionalPrice(
                  analysis.target_price,
                )
              }
              valueClass="text-emerald-400"
            />


            <DecisionMetric
              label="Invalidation"
              value={
                formatOptionalPrice(
                  analysis.invalidation_price,
                )
              }
              valueClass="text-red-400"
            />


            <DecisionMetric
              label="Reward / risk"
              value={
                analysis.reward_risk_ratio === null
                  ? "—"
                  : `${analysis.reward_risk_ratio.toFixed(2)}:1`
              }
              valueClass={
                getRatioClass(
                  analysis.reward_risk_ratio,
                )
              }
            />


            <DecisionMetric
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


          <div className="mt-7 border-t border-white/5 pt-5">

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
              Best fit
            </p>


            <p className="mt-2 text-lg font-medium text-zinc-200">
              {analysis.trade_horizon}
            </p>


            <p className="mt-1 text-sm text-zinc-600">
              {analysis.trade_duration}
            </p>

          </div>

        </Card>


        {/* ===============================================
            WHY
        =============================================== */}

        <Card>

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-600">
              Interpretation
            </p>


            <h3 className="mt-2 text-lg font-semibold text-white">
              Why A-Trader sees it this way
            </h3>


            <p className="mt-2 text-sm leading-6 text-zinc-600">
              The strongest supporting factors and the most important
              conditions working against the setup.
            </p>

          </div>


          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <div>

              <div className="flex items-center justify-between gap-3">

                <p className="text-xs font-medium text-zinc-400">
                  Supporting
                </p>


                <span className="text-xs text-zinc-700">
                  {analysis.reasons.length}
                </span>

              </div>


              <div className="mt-3 space-y-3">

                {reasons.length > 0 ? (
                  reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <DecisionReason
                        key={`${reason}-${index}`}
                        tone="positive"
                      >
                        {reason}
                      </DecisionReason>
                    ),
                  )
                ) : (
                  <p className="text-sm text-zinc-600">
                    No major supporting factors.
                  </p>
                )}

              </div>

            </div>


            <div>

              <div className="flex items-center justify-between gap-3">

                <p className="text-xs font-medium text-zinc-400">
                  Working against
                </p>


                <span className="text-xs text-zinc-700">
                  {analysis.warnings.length}
                </span>

              </div>


              <div className="mt-3 space-y-3">

                {warnings.length > 0 ? (
                  warnings.map(
                    (
                      warning,
                      index,
                    ) => (
                      <DecisionReason
                        key={`${warning}-${index}`}
                        tone="warning"
                      >
                        {warning}
                      </DecisionReason>
                    ),
                  )
                ) : (
                  <p className="text-sm text-zinc-600">
                    No major warnings.
                  </p>
                )}

              </div>

            </div>

          </div>

        </Card>

      </div>

    </section>
  );
}


/* =========================================================
   METRIC
========================================================= */

function DecisionMetric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-700">
        {label}
      </p>


      <p
        className={`mt-2 break-words text-lg font-semibold tracking-[-0.02em] sm:text-xl ${
          valueClass
          ?? "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   REASON
========================================================= */

function DecisionReason({
  tone,
  children,
}: {
  tone:
    | "positive"
    | "warning";

  children: string;
}) {
  return (
    <div className="flex gap-3 border-t border-white/5 pt-3 first:border-0 first:pt-0">

      <span
        className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
          tone === "positive"
            ? "bg-emerald-400"
            : "bg-amber-400"
        }`}
      />


      <p className="text-sm leading-6 text-zinc-400">
        {children}
      </p>

    </div>
  );
}
