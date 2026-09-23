import MetricCard from "@/components/ui/MetricCard";

import {
  getScoreClass,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type OpportunitySectionProps = {
  analysis: MarketAnalysis;
};


export default function OpportunitySection({
  analysis,
}: OpportunitySectionProps) {
  return (
    <section>

      <SectionHeading
        eyebrow="Setup quality"
        title="Current opportunity"
        description="Trend strength, current session behavior and entry quality are kept separate so a strong company does not automatically mean a strong entry."
      />


      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          label="Opportunity"

          value={
            <span
              className={
                getScoreClass(
                  analysis.opportunity_score,
                )
              }
            >
              {analysis.opportunity_score}/100
            </span>
          }

          detail="Quality of the setup right now"
        />


        <MetricCard
          label="Trend"

          value={
            <span
              className={
                getScoreClass(
                  analysis.trend_score,
                )
              }
            >
              {analysis.trend_score}/100
            </span>
          }

          detail={
            analysis.price
            >= analysis.sma_50
              ? "Price is above the 50-day structure"
              : "Price is below the 50-day structure"
          }
        />


        <MetricCard
          label="Intraday"

          value={
            <span
              className={
                getScoreClass(
                  analysis.intraday_score,
                )
              }
            >
              {analysis.intraday_score}/100
            </span>
          }

          detail={
            analysis.intraday_trend
          }
        />


        <MetricCard
          label="Aggressive"

          value={
            <span
              className={
                getScoreClass(
                  analysis.aggressive_score,
                )
              }
            >
              {analysis.aggressive_score}/100
            </span>
          }

          detail="Momentum and upside-weighted score"
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
  description?: string;
}) {
  return (
    <div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>

      {description && (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
          {description}
        </p>
      )}

    </div>
  );
}