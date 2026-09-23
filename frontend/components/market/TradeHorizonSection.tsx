import Card from "@/components/ui/Card";

import {
  getHorizonClass,
  getScoreClass,
  scoreWidth,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type TradeHorizonSectionProps = {
  analysis: MarketAnalysis;
};


export default function TradeHorizonSection({
  analysis,
}: TradeHorizonSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">

      <Card
        title="Best trade fit"
        description="The holding period that currently aligns best with the technical structure."
      >

        <div className="mt-2">

          <span
            className={`inline-flex rounded-xl border px-3 py-1.5 text-sm font-semibold ${getHorizonClass(
              analysis.trade_horizon,
            )}`}
          >
            {analysis.trade_horizon}
          </span>


          <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
            {analysis.trade_duration}
          </p>


          <div className="mt-6 rounded-xl border border-zinc-900 bg-black p-4">

            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
              Secondary fit
            </p>

            <p className="mt-2 font-semibold text-zinc-300">
              {analysis.secondary_horizon}
            </p>

          </div>

        </div>

      </Card>


      <Card
        title="Trade horizon fit"
        description="How well the current setup matches different holding periods."
      >

        <div className="grid gap-3 sm:grid-cols-2">

          <HorizonScore
            label="Intraday"
            score={
              analysis.intraday_fit_score
            }
          />

          <HorizonScore
            label="Short term"
            score={
              analysis.short_term_fit_score
            }
          />

          <HorizonScore
            label="Swing"
            score={
              analysis.swing_fit_score
            }
          />

          <HorizonScore
            label="Long term"
            score={
              analysis.long_term_fit_score
            }
          />

        </div>

      </Card>

    </section>
  );
}


function HorizonScore({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const valid =
    Number.isFinite(
      score,
    );

  const width =
    scoreWidth(
      score,
    );


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <div className="flex items-center justify-between gap-4">

        <p className="text-sm font-medium text-zinc-400">
          {label}
        </p>

        <p
          className={`text-sm font-semibold ${
            valid
              ? getScoreClass(
                  score,
                )
              : "text-zinc-600"
          }`}
        >
          {
            valid
              ? `${score}/100`
              : "—"
          }
        </p>

      </div>


      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">

        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{
            width: `${width}%`,
          }}
        />

      </div>

    </div>
  );
}