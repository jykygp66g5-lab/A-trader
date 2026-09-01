import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  title,
  description,
  action,
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-900 bg-zinc-950/70 ${paddingClasses[padding]} ${className}`}
    >
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-zinc-100">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}