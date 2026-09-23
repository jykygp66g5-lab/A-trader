"use client";

import { useMemo, useState } from "react";

import type {
  Alert,
  CreateAlertInput,
} from "@/lib/alerts/types";


type SetupTrackingButtonProps = {
  symbol: string;
  alerts: Alert[];
  saving?: boolean;
  onCreate: (
    input: CreateAlertInput,
  ) => Promise<unknown>;
  onDelete: (
    alertId: number,
  ) => Promise<unknown>;
};


export default function SetupTrackingButton({
  symbol,
  alerts,
  saving = false,
  onCreate,
  onDelete,
}: SetupTrackingButtonProps) {
  const [
    changing,
    setChanging,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const normalizedSymbol = (
    symbol
    .trim()
    .toUpperCase()
  );

  const trackingAlert = useMemo(
    () =>
      alerts.find(
        (alert) =>
          alert.symbol.toUpperCase()
            === normalizedSymbol
          && alert.alert_type
            === "potential_entry"
          && alert.is_active,
      ),
    [
      alerts,
      normalizedSymbol,
    ],
  );

  const isTracking = Boolean(
    trackingAlert,
  );

  async function handleClick() {
    if (
      changing
      || saving
      || !normalizedSymbol
    ) {
      return;
    }

    setChanging(true);
    setError(null);

    try {
      if (trackingAlert) {
        await onDelete(
          trackingAlert.id,
        );
      } else {
        await onCreate({
          symbol: normalizedSymbol,
          alert_type:
            "potential_entry",
          threshold: null,
          frequency:
            "every_occurrence",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update setup tracking.",
      );
    } finally {
      setChanging(false);
    }
  }

  const busy = (
    changing
    || saving
  );

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={isTracking}
        className={[
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
          isTracking
            ? "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15"
            : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800",
          busy
            ? "cursor-not-allowed opacity-60"
            : "",
        ].join(" ")}
      >
        {busy ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Updating
          </>
        ) : isTracking ? (
          <>
            <span aria-hidden="true">
              ✓
            </span>
            Tracking
          </>
        ) : (
          <>
            <span aria-hidden="true">
              ♢
            </span>
            Track setup
          </>
        )}
      </button>

      {error ? (
        <p className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
