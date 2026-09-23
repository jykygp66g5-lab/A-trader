import type {
  ReactNode,
} from "react";

import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  formatOptionalPercent,
  formatOptionalPrice,
  getActionTone,
  getRatioClass,
  getRiskClass,
  getRsiDescription,
  getScoreClass,
  getSignalTone,
} from "@/lib/market/formatters";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type MarketSummarySectionProps = {
  analysis: MarketAnalysis;
};


export default function MarketSummarySection({
  analysis,
}: MarketSummarySectionProps) {
  return (
    <section>

      <SectionHeading
        eyebrow="Breakdown"
        title="Market summary"
        description="A compact view of structure, momentum and setup quality."
      />


      <div className="mt-4 grid gap-4 xl:grid-cols-3">

        <SummaryCard
          title="Structure"
          badge={
            <StatusBadge
              tone={
                getSignalTone(
                  analysis.signal,
                )
              }
            >
              {analysis.signal}
            </StatusBadge>
          }
        >

          <SummaryRow
            label="Trend score"
            value={`${analysis.trend_score}/100`}
            valueClass={
              getScoreClass(
                analysis.trend_score,
              )
            }
          />


          <SummaryRow
            label="Price vs SMA 20"
            value={`${analysis.distance_from_sma_20 >= 0 ? "+" : ""}${analysis.distance_from_sma_20.toFixed(2)}%`}
          />


          <SummaryRow
            label="Price vs SMA 50"
            value={`${analysis.distance_from_sma_50 >= 0 ? "+" : ""}${analysis.distance_from_sma_50.toFixed(2)}%`}
          />


          <SummaryRow
            label="Price vs SMA 200"
            value={`${analysis.distance_from_sma_200 >= 0 ? "+" : ""}${analysis.distance_from_sma_200.toFixed(2)}%`}
          />


          <SummaryRow
            label="5-day performance"
            value={
              formatOptionalPercent(
                analysis.performance_5d_percent,
              )
            }
          />


          <SummaryRow
            label="20-day performance"
            value={
              formatOptionalPercent(
                analysis.performance_20d_percent,
              )
            }
          />


          <SummaryRow
            label="60-day performance"
            value={
              formatOptionalPercent(
                analysis.performance_60d_percent,
              )
            }
          />

        </SummaryCard>


        <SummaryCard
          title="Current momentum"
          badge={
            <StatusBadge
              tone={
                analysis.intraday_score >= 60
                  ? "positive"
                  : analysis.intraday_score >= 45
                    ? "warning"
                    : "negative"
              }
            >
              {analysis.intraday_trend}
            </StatusBadge>
          }
        >

          <SummaryRow
            label="Intraday score"
            value={`${analysis.intraday_score}/100`}
            valueClass={
              getScoreClass(
                analysis.intraday_score,
              )
            }
          />


          <SummaryRow
            label="RSI"
            value={`${analysis.rsi.toFixed(1)} · ${getRsiDescription(
              analysis.rsi,
            )}`}
          />


          <SummaryRow
            label="MACD histogram"
            value={`${analysis.macd_histogram >= 0 ? "+" : ""}${analysis.macd_histogram.toFixed(4)}`}
          />


          <SummaryRow
            label="Volume ratio"
            value={`${analysis.volume_ratio.toFixed(2)}×`}
          />


          <SummaryRow
            label="Intraday change"
            value={
              formatOptionalPercent(
                analysis.intraday_change_percent,
              )
            }
          />


          <SummaryRow
            label="Recent momentum"
            value={
              formatOptionalPercent(
                analysis.intraday_recent_momentum_percent,
              )
            }
          />


          <SummaryRow
            label="Intraday volume"
            value={
              analysis.intraday_volume_ratio === null
                ? "—"
                : `${analysis.intraday_volume_ratio.toFixed(2)}×`
            }
          />

        </SummaryCard>


        <SummaryCard
          title="Setup quality"
          badge={
            <StatusBadge
              tone={
                getActionTone(
                  analysis.action_state,
                )
              }
            >
              {analysis.action_state}
            </StatusBadge>
          }
        >

          <SummaryRow
            label="Opportunity"
            value={`${analysis.opportunity_score}/100`}
            valueClass={
              getScoreClass(
                analysis.opportunity_score,
              )
            }
          />


          <SummaryRow
            label="Aggressive"
            value={`${analysis.aggressive_score}/100`}
            valueClass={
              getScoreClass(
                analysis.aggressive_score,
              )
            }
          />


          <SummaryRow
            label="Reward / Risk"
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


          <SummaryRow
            label="Target"
            value={
              formatOptionalPrice(
                analysis.target_price,
              )
            }
            valueClass="text-emerald-400"
          />


          <SummaryRow
            label="Invalidation"
            value={
              formatOptionalPrice(
                analysis.invalidation_price,
              )
            }
            valueClass="text-red-400"
          />


          <SummaryRow
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


          <SummaryRow
            label="Best fit"
            value={
              analysis.trade_horizon
            }
          />

        </SummaryCard>

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


function SummaryCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>

      <div className="flex items-center justify-between gap-3">

        <h3 className="font-semibold text-zinc-200">
          {title}
        </h3>

        {badge}

      </div>


      <div className="mt-5 space-y-3">
        {children}
      </div>

    </Card>
  );
}


function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <span
        className={`text-right text-sm font-medium ${
          valueClass
          ?? "text-zinc-300"
        }`}
      >
        {value}
      </span>

    </div>
  );
}