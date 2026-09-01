import type { ReactNode } from "react";

type StatusTone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  neutral:
    "border-zinc-800 bg-zinc-900/70 text-zinc-400",

  positive:
    "border-emerald-900/60 bg-emerald-950/30 text-emerald-400",

  negative:
    "border-red-900/60 bg-red-950/30 text-red-400",

  warning:
    "border-amber-900/60 bg-amber-950/30 text-amber-400",

  info:
    "border-blue-900/60 bg-blue-950/30 text-blue-400",
};

const dotClasses: Record<StatusTone, string> = {
  neutral: "bg-zinc-500",
  positive: "bg-emerald-400",
  negative: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

export default function StatusBadge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`}
        />
      )}

      {children}
    </span>
  );
}