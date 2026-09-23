import MetricCard from "@/components/ui/MetricCard";

import {
  formatVolume,
  getRsiDescription,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type TechnicalDataSectionProps = {
  analysis: MarketAnalysis;
};


export default function TechnicalDataSection({
  analysis,
}: TechnicalDataSectionProps) {
  return (
    <section>

      <SectionHeading
        eyebrow="Technical structure"
        title="Market data"
        description="Important structural and momentum measurements behind the analysis."
      />


      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

        <MetricCard
          label="52-week high"
          value={`$${analysis.high_52w.toFixed(2)}`}
          detail={`${analysis.distance_from_52w_high_percent.toFixed(2)}% from high`}
        />


        <MetricCard
          label="52-week low"
          value={`$${analysis.low_52w.toFixed(2)}`}
          detail={`${analysis.distance_from_52w_low_percent.toFixed(2)}% from low`}
        />


        <MetricCard
          label="Latest volume"
          value={
            formatVolume(
              analysis.volume,
            )
          }
          detail={`${analysis.volume_ratio.toFixed(2)}× 20-day average`}
        />


        <MetricCard
          label="20-day avg volume"
          value={
            formatVolume(
              analysis.average_volume_20d,
            )
          }
          detail="Average participation"
        />


        <MetricCard
          label="Support"
          value={`$${analysis.support.toFixed(2)}`}
          detail="Recent technical floor"
        />


        <MetricCard
          label="Resistance"
          value={`$${analysis.resistance.toFixed(2)}`}
          detail="Recent technical ceiling"
        />


        <MetricCard
          label="20-day SMA"
          value={`$${analysis.sma_20.toFixed(2)}`}
          detail={`${analysis.distance_from_sma_20 >= 0 ? "+" : ""}${analysis.distance_from_sma_20.toFixed(2)}% from price`}
        />


        <MetricCard
          label="50-day SMA"
          value={`$${analysis.sma_50.toFixed(2)}`}
          detail={`${analysis.distance_from_sma_50 >= 0 ? "+" : ""}${analysis.distance_from_sma_50.toFixed(2)}% from price`}
        />


        <MetricCard
          label="200-day SMA"
          value={`$${analysis.sma_200.toFixed(2)}`}
          detail={`${analysis.distance_from_sma_200 >= 0 ? "+" : ""}${analysis.distance_from_sma_200.toFixed(2)}% from price`}
        />


        <MetricCard
          label="RSI"
          value={
            analysis.rsi.toFixed(
              2,
            )
          }
          detail={
            getRsiDescription(
              analysis.rsi,
            )
          }
        />


        <MetricCard
          label="MACD"
          value={
            analysis.macd.toFixed(
              4,
            )
          }
          detail={`Histogram ${analysis.macd_histogram >= 0 ? "+" : ""}${analysis.macd_histogram.toFixed(4)}`}
        />


        <MetricCard
          label="ATR 14"
          value={`$${analysis.atr_14.toFixed(2)}`}
          detail="Average daily range"
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