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
      className={`
        group
        rounded-2xl
        border
        border-white/[0.22]
        bg-[#070809]
        p-5
        shadow-[0_10px_30px_rgba(0,0,0,0.22)]
        transition-all
        duration-200
        hover:border-white/[0.32]
        hover:bg-[#090A0B]
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.19em]
            text-zinc-300
          "
        >
          {label}
        </p>

        {icon && (
          <div className="text-zinc-500">
            {icon}
          </div>
        )}
      </div>

      <div
        className="
          mt-3
          text-[26px]
          font-bold
          leading-none
          tracking-[-0.035em]
          text-white
        "
      >
        {value}
      </div>

      {detail && (
        <div
          className="
            mt-3
            text-[13px]
            leading-5
            text-zinc-400
          "
        >
          {detail}
        </div>
      )}
    </div>
  );
}
