"use client";

import Link from "next/link";

import type {
  Notification,
} from "@/hooks/alerts/useNotifications";


function formatNotificationTime(
  value: string,
) {
  const date =
    new Date(value);

  const now =
    new Date();

  const difference =
    now.getTime()
    - date.getTime();

  const minutes =
    Math.floor(
      difference / 60000,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );
}


export default function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (
    notificationId: number,
  ) => Promise<unknown>;
}) {
  const content = (
    <div
      className={`group relative rounded-xl border p-4 transition ${
        notification.is_read
          ? "border-zinc-900 bg-black/20"
          : "border-blue-900/50 bg-blue-950/10"
      }`}
    >
      <div className="flex gap-3">

        <div className="pt-1.5">
          <span
            className={`block h-2 w-2 rounded-full ${
              notification.is_read
                ? "bg-zinc-800"
                : "bg-blue-500"
            }`}
          />
        </div>


        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-start justify-between gap-2">

            <div className="min-w-0">

              {notification.symbol
              && (
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                  {notification.symbol}
                </p>
              )}


              <p className="text-sm font-medium text-zinc-100">
                {notification.title}
              </p>

            </div>


            <span className="shrink-0 text-[11px] text-zinc-600">
              {formatNotificationTime(
                notification.created_at,
              )}
            </span>

          </div>


          <p className="mt-1.5 text-sm leading-6 text-zinc-500">
            {notification.message}
          </p>


          {notification.trigger_value !== null
          && (
            <p className="mt-2 text-xs text-zinc-600">
              Trigger value:{" "}
              <span className="font-medium text-zinc-400">
                {notification.trigger_value.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  },
                )}
              </span>
            </p>
          )}

        </div>

      </div>
    </div>
  );


  if (
    notification.target_url
  ) {
    return (
      <Link
        href={
          notification.target_url
        }
        onClick={() => {
          if (
            !notification.is_read
          ) {
            void onRead(
              notification.id,
            );
          }
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }


  return (
    <button
      type="button"
      onClick={() => {
        if (
          !notification.is_read
        ) {
          void onRead(
            notification.id,
          );
        }
      }}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}
