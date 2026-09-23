"use client";

import NotificationItem from "./NotificationItem";

import type {
  Notification,
} from "@/hooks/alerts/useNotifications";


export default function NotificationCenter({
  notifications,
  unreadCount,
  loading,
  error,
  onRefresh,
  onRead,
  onReadAll,
}: {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onRead: (
    notificationId: number,
  ) => Promise<unknown>;
  onReadAll: () => Promise<void>;
}) {
  return (
    <div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 px-5 py-4">

        <div>

          <div className="flex items-center gap-2">

            <h2 className="text-sm font-semibold text-zinc-100">
              Notifications
            </h2>


            {unreadCount > 0
            && (
              <span className="rounded-full border border-blue-900/60 bg-blue-950/30 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                {unreadCount} unread
              </span>
            )}

          </div>


          <p className="mt-1 text-xs text-zinc-600">
            Triggered alerts and market activity.
          </p>

        </div>


        <div className="flex items-center gap-2">

          {unreadCount > 0
          && (
            <button
              type="button"
              onClick={() =>
                void onReadAll()
              }
              className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              Mark all read
            </button>
          )}


          <button
            type="button"
            onClick={() =>
              void onRefresh()
            }
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            Refresh
          </button>

        </div>

      </div>


      <div className="p-4">

        {loading
        ? (
          <div className="py-10 text-center text-sm text-zinc-600">
            Loading notifications...
          </div>
        )

        : error
        ? (
          <div className="rounded-xl border border-red-950 bg-red-950/10 px-4 py-4 text-sm text-red-300">
            {error}
          </div>
        )

        : notifications.length === 0
        ? (
          <div className="py-12 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
              <span className="text-lg">
                ✓
              </span>
            </div>


            <p className="mt-4 text-sm font-medium text-zinc-300">
              You're all caught up
            </p>


            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-600">
              When one of your active alerts triggers,
              it will appear here.
            </p>

          </div>
        )

        : (
          <div className="space-y-2">
            {notifications.map(
              (
                notification,
              ) => (
                <NotificationItem
                  key={
                    notification.id
                  }
                  notification={
                    notification
                  }
                  onRead={
                    onRead
                  }
                />
              ),
            )}
          </div>
        )}

      </div>

    </div>
  );
}
