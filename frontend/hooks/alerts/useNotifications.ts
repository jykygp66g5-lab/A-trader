"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { api } from "@/lib/api";


export type Notification = {
  id: number;
  alert_id: number | null;
  notification_type: string;
  symbol: string | null;
  title: string;
  message: string;
  trigger_value: number | null;
  target_url: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};


type NotificationListResponse = {
  notifications: Notification[];
  count: number;
  unread_count: number;
};


export function useNotifications() {
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


  const loadNotifications = useCallback(
    async () => {
      try {
        setError(null);

        const response = await api(
          "/alerts/notifications/list?limit=50",
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load notifications.",
          );
        }

        const data =
          (await response.json()) as NotificationListResponse;

        setNotifications(
          data.notifications,
        );

        setUnreadCount(
          data.unread_count,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );


  const markAsRead = useCallback(
    async (
      notificationId: number,
    ) => {
      const response = await api(
        `/alerts/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to mark notification as read.",
        );
      }

      const updated =
        (await response.json()) as Notification;

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id === updated.id
                ? updated
                : notification,
          ),
      );

      setUnreadCount(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      );

      return updated;
    },
    [],
  );


  const markAllAsRead = useCallback(
    async () => {
      const response = await api(
        "/alerts/notifications/read-all",
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to mark notifications as read.",
        );
      }

      const now =
        new Date().toISOString();

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              is_read: true,
              read_at:
                notification.read_at
                ?? now,
            }),
          ),
      );

      setUnreadCount(0);
    },
    [],
  );


  useEffect(
    () => {
      void loadNotifications();
    },
    [loadNotifications],
  );


  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh:
      loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
