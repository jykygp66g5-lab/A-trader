"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  API_URL,
  api,
} from "@/lib/api";


type PushStatus = {
  enabled: boolean;
  subscription_count: number;
};


function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4,
    );

  const base64 = (
    base64String
    + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  const outputArray =
    new Uint8Array(
      rawData.length,
    );

  for (
    let i = 0;
    i < rawData.length;
    i += 1
  ) {
    outputArray[i] =
      rawData.charCodeAt(i);
  }

  return outputArray;
}


export function usePushNotifications() {
  const [supported, setSupported] =
    useState(false);

  const [permission, setPermission] =
    useState<NotificationPermission>(
      "default",
    );

  const [enabled, setEnabled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const refreshStatus =
    useCallback(async () => {
      const browserSupported =
        typeof window !== "undefined"
        && "serviceWorker" in navigator
        && "PushManager" in window
        && "Notification" in window;

      setSupported(
        browserSupported,
      );

      if (!browserSupported) {
        setLoading(false);
        return;
      }

      setPermission(
        Notification.permission,
      );

      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
          );

        const browserSubscription =
          await registration
            .pushManager
            .getSubscription();

        setEnabled(
          Boolean(
            browserSubscription,
          ),
        );
      } catch (err) {
        console.error(
          "Could not inspect push subscription:",
          err,
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);


  const enable =
    useCallback(async () => {
      if (!supported) {
        setError(
          "Push notifications are not supported in this browser.",
        );
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const permissionResult =
          await Notification
            .requestPermission();

        setPermission(
          permissionResult,
        );

        if (
          permissionResult
          !== "granted"
        ) {
          throw new Error(
            "Notification permission was not granted.",
          );
        }

        const registration =
          await navigator
            .serviceWorker
            .ready;

        const keyResponse =
          await fetch(
            `${API_URL}/push/public-key`,
          );

        if (!keyResponse.ok) {
          throw new Error(
            "Could not load the push public key.",
          );
        }

        const keyData:
          { public_key: string } =
          await keyResponse.json();

        let subscription =
          await registration
            .pushManager
            .getSubscription();

        if (!subscription) {
          subscription =
            await registration
              .pushManager
              .subscribe({
                userVisibleOnly: true,
                applicationServerKey:
                  urlBase64ToUint8Array(
                    keyData.public_key,
                  ),
              });
        }

        const json =
          subscription.toJSON();

        if (
          !json.endpoint
          || !json.keys?.p256dh
          || !json.keys?.auth
        ) {
          throw new Error(
            "Browser returned an incomplete push subscription.",
          );
        }

        const response =
          await api(
            "/push/subscribe",
            {
              method: "POST",
              body: JSON.stringify({
                endpoint:
                  json.endpoint,
                keys: {
                  p256dh:
                    json.keys.p256dh,
                  auth:
                    json.keys.auth,
                },
                user_agent:
                  navigator.userAgent,
              }),
            },
          );

        if (!response.ok) {
          const body =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            body?.detail
            || "Could not save push subscription.",
          );
        }

        const status:
          PushStatus =
          await response.json();

        setEnabled(
          status.enabled,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not enable notifications.",
        );
      } finally {
        setSaving(false);
      }
    }, [supported]);


  const disable =
    useCallback(async () => {
      if (!supported) return;

      setSaving(true);
      setError(null);

      try {
        const registration =
          await navigator
            .serviceWorker
            .ready;

        const subscription =
          await registration
            .pushManager
            .getSubscription();

        if (subscription) {
          const endpoint =
            subscription.endpoint;

          const response =
            await api(
              `/push/subscribe?endpoint=${
                encodeURIComponent(
                  endpoint,
                )
              }`,
              {
                method: "DELETE",
              },
            );

          if (!response.ok) {
            throw new Error(
              "Could not remove push subscription.",
            );
          }

          await subscription
            .unsubscribe();
        }

        setEnabled(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not disable notifications.",
        );
      } finally {
        setSaving(false);
      }
    }, [supported]);


  return {
    supported,
    permission,
    enabled,
    loading,
    saving,
    error,
    enable,
    disable,
    refreshStatus,
  };
}
