"use client";

import Link from "next/link";

import {
  formatAlertDate,
  formatAlertFrequency,
  formatAlertThreshold,
  formatAlertType,
} from "@/lib/alerts/formatters";

import type {
  Alert,
} from "@/lib/alerts/types";


type AlertCardProps = {
  alert: Alert;

  onToggle: (
    alert: Alert,
  ) => Promise<unknown>;

  onDelete: (
    alertId: number,
  ) => Promise<void>;
};


export default function AlertCard({
  alert,
  onToggle,
  onDelete,
}: AlertCardProps) {
  return (
    <article className="rounded-xl border border-zinc-900 bg-black/60 p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={
                `/market?symbol=${encodeURIComponent(
                  alert.symbol,
                )}`
              }
              className="text-lg font-semibold tracking-tight text-white transition hover:text-blue-400"
            >
              {
                alert.symbol
              }
            </Link>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                alert.is_active
                  ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500"
              }`}
            >
              {
                alert.is_active
                  ? "Active"
                  : "Paused"
              }
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-zinc-300">
              {
                formatAlertType(
                  alert,
                )
              }
            </span>

            <span className="text-zinc-800">
              •
            </span>

            <span className="text-sm font-semibold text-white">
              {
                formatAlertThreshold(
                  alert,
                )
              }
            </span>

            <span className="text-zinc-800">
              •
            </span>

            <span className="text-xs text-zinc-500">
              {
                formatAlertFrequency(
                  alert.frequency,
                )
              }
            </span>
          </div>
        </div>


        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={
              () =>
                void onToggle(
                  alert,
                )
            }
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            {
              alert.is_active
                ? "Pause"
                : "Resume"
            }
          </button>

          <button
            type="button"
            onClick={
              () => {
                if (
                  window.confirm(
                    `Delete the ${alert.symbol} alert?`,
                  )
                ) {
                  void onDelete(
                    alert.id,
                  );
                }
              }
            }
            className="rounded-lg border border-red-950 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      </div>


      <div className="mt-5 grid gap-3 border-t border-zinc-900 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Last checked
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {
              formatAlertDate(
                alert.last_checked_at,
              )
            }
          </p>
        </div>


        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Last triggered
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {
              formatAlertDate(
                alert.last_triggered_at,
              )
            }
          </p>
        </div>


        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Trigger count
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {
              alert.trigger_count
            }
          </p>
        </div>
      </div>
    </article>
  );
}
