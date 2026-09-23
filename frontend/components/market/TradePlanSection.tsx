import Card from "@/components/ui/Card";

import {
  formatOptionalPercent,
  formatOptionalPrice,
  getRatioClass,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type TradePlanSectionProps = {
  analysis: MarketAnalysis;
};


export default function TradePlanSection({
  analysis,
}: TradePlanSectionProps) {
  return (
    <Card
      title="Technical trade plan"
      description="Model-generated technical levels and estimated reward-to-risk."
    >

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <TradePlanMetric
          label="Target"

          value={
            formatOptionalPrice(
              analysis.target_price,
            )
          }

          detail={
            analysis.target_source
            ?? "No technical target"
          }

          secondary={
            formatOptionalPercent(
              analysis.potential_upside_percent,
              true,
            )
          }

          tone="positive"
        />


        <TradePlanMetric
          label="Current"

          value={`$${analysis.price.toFixed(2)}`}

          detail="Current market price"

          secondary={
            formatOptionalPercent(
              analysis.change_percent,
            )
          }

          tone={
            analysis.change_percent
            >= 0
              ? "positive"
              : "negative"
          }
        />


        <TradePlanMetric
          label="Invalidation"

          value={
            formatOptionalPrice(
              analysis.invalidation_price,
            )
          }

          detail={
            analysis.invalidation_source
            ?? "No invalidation level"
          }

          secondary={
            analysis.potential_downside_percent
            === null
              ? "—"
              : `-${Math.abs(
                  analysis.potential_downside_percent,
                ).toFixed(2)}%`
          }

          tone="negative"
        />


        <TradePlanMetric
          label="Reward / Risk"

          value={
            analysis.reward_risk_ratio
            === null
              ? "—"
              : `${analysis.reward_risk_ratio.toFixed(2)}:1`
          }

          detail={`Risk level: ${analysis.risk_level}`}

          valueClass={
            getRatioClass(
              analysis.reward_risk_ratio,
            )
          }
        />

      </div>

    </Card>
  );
}


function TradePlanMetric({
  label,
  value,
  detail,
  secondary,
  tone = "neutral",
  valueClass,
}: {
  label: string;
  value: string;
  detail: string;
  secondary?: string;

  tone?:
    | "neutral"
    | "positive"
    | "negative";

  valueClass?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : "text-zinc-400";


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>


      <p
        className={`mt-3 text-xl font-semibold ${
          valueClass
          ?? (
            tone === "neutral"
              ? "text-white"
              : toneClass
          )
        }`}
      >
        {value}
      </p>


      <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-600">
        {detail}
      </p>


      {secondary && (
        <p className={`mt-3 text-sm font-semibold ${toneClass}`}>
          {secondary}
        </p>
      )}

    </div>
  );
}