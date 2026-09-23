"use client";

import {
  usePushNotifications,
} from "@/hooks/alerts/usePushNotifications";


export default function PushNotificationControl() {
  const {
    supported,
    permission,
    enabled,
    loading,
    saving,
    error,
    enable,
    disable,
  } = usePushNotifications();


  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />

        <span className="text-sm text-zinc-500">
          Checking notification status...
        </span>
      </div>
    );
  }


  if (!supported) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">
          Browser notifications unavailable
        </p>

        <p className="text-xs leading-5 text-zinc-600">
          This browser does not currently support the notification
          features required by A-Trader.
        </p>
      </div>
    );
  }


  if (permission === "denied") {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-amber-300">
          Notifications are blocked
        </p>

        <p className="text-xs leading-5 text-zinc-500">
          Allow notifications for A-Trader in your browser settings,
          then reload this page.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div className="min-w-0">
          <div className="flex items-center gap-2">

            <span
              className={[
                "h-2 w-2 rounded-full",
                enabled
                  ? "bg-emerald-400"
                  : "bg-zinc-600",
              ].join(" ")}
            />

            <p className="text-sm font-medium text-zinc-200">
              {
                enabled
                  ? "Browser notifications enabled"
                  : "Browser notifications disabled"
              }
            </p>

          </div>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {
              enabled
                ? "A-Trader can notify this device when a tracked market condition is triggered."
                : "Enable notifications to receive A-Trader alerts even when you are not actively viewing the app."
            }
          </p>
        </div>


        <button
          type="button"

          onClick={
            () =>
              void (
                enabled
                  ? disable()
                  : enable()
              )
          }

          disabled={saving}

          className={[
            "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
            enabled
              ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
              : "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15",
            saving
              ? "cursor-not-allowed opacity-60"
              : "",
          ].join(" ")}
        >
          {
            saving
              ? "Updating..."
              : enabled
                ? "Disable"
                : "Enable notifications"
          }
        </button>

      </div>


      {
        error
        && (
          <div className="rounded-lg border border-red-950 bg-red-950/20 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )
      }
    </div>
  );
}
