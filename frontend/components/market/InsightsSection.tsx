import type {
  ReactNode,
} from "react";

import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type InsightsSectionProps = {
  analysis: MarketAnalysis;
};


export default function InsightsSection({
  analysis,
}: InsightsSectionProps) {
  return (
    <section>

      <SectionHeading
        eyebrow="Interpretation"
        title="What is driving the setup?"
        description="Positive factors explain the setup score while warnings highlight conditions that could weaken it."
      />


      <div className="mt-4 grid gap-4 xl:grid-cols-2">

        <Card
          title="Positive factors"
          action={
            <StatusBadge tone="positive">
              {analysis.reasons.length}
              {" signal"}
              {analysis.reasons.length === 1 ? "" : "s"}
            </StatusBadge>
          }
        >

          {
            analysis.reasons.length > 0
              ? (
                  <div className="space-y-2">

                    {analysis.reasons.map(
                      (
                        reason,
                        index,
                      ) => (
                        <InsightRow
                          key={`${reason}-${index}`}
                          tone="positive"
                        >
                          {reason}
                        </InsightRow>
                      ),
                    )}

                  </div>
                )
              : (
                  <EmptyInsight>
                    No positive factors were returned.
                  </EmptyInsight>
                )
          }

        </Card>


        <Card
          title="Warnings"
          action={
            <StatusBadge
              tone={
                analysis.warnings.length > 0
                  ? "warning"
                  : "neutral"
              }
            >
              {analysis.warnings.length}
              {" warning"}
              {analysis.warnings.length === 1 ? "" : "s"}
            </StatusBadge>
          }
        >

          {
            analysis.warnings.length > 0
              ? (
                  <div className="space-y-2">

                    {analysis.warnings.map(
                      (
                        warning,
                        index,
                      ) => (
                        <InsightRow
                          key={`${warning}-${index}`}
                          tone="warning"
                        >
                          {warning}
                        </InsightRow>
                      ),
                    )}

                  </div>
                )
              : (
                  <EmptyInsight>
                    No major warnings were returned.
                  </EmptyInsight>
                )
          }

        </Card>

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


function InsightRow({
  tone,
  children,
}: {
  tone:
    | "positive"
    | "warning";

  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-900 bg-black px-4 py-3">

      <span
        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
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


function EmptyInsight({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-900 bg-black/30 px-4 py-6 text-center text-sm text-zinc-600">
      {children}
    </div>
  );
}