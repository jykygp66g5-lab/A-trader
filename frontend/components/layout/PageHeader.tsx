import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  status?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  status,
}: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        
        {/* LEFT SIDE */}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              {eyebrow}
            </p>
          )}

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
              {description}
            </p>
          )}

          {status && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {status}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      <div className="mt-7 border-b border-zinc-900" />
    </header>
  );
}