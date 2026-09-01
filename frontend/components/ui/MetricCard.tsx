import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function MetricCard({
  label,
  value,
  detail,
  icon,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-900 bg-zinc-950/70 p-5 transition-colors hover:border-zinc-800 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          {label}
        </p>

        {icon && (
          <div className="text-zinc-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>

      {detail && (
        <div className="mt-2 text-xs leading-5 text-zinc-500">
          {detail}
        </div>
      )}
    </div>
  );
}