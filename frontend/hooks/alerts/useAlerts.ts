"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  api,
} from "@/lib/api";

import type {
  Alert,
  AlertListResponse,
  CreateAlertInput,
  UpdateAlertInput,
} from "@/lib/alerts/types";


function getErrorMessage(
  data: unknown,
  fallback: string,
) {
  if (
    typeof data === "object"
    && data !== null
    && "detail" in data
    && typeof (
      data as {
        detail?: unknown;
      }
    ).detail === "string"
  ) {
    return (
      data as {
        detail: string;
      }
    ).detail;
  }

  return fallback;
}


export default function useAlerts() {
  const [
    alerts,
    setAlerts,
  ] = useState<Alert[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  const loadAlerts =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const response =
            await api(
              "/alerts",
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              getErrorMessage(
                data,
                "Unable to load alerts.",
              ),
            );
          }

          const result =
            data as AlertListResponse;

          setAlerts(
            result.alerts,
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError
              instanceof Error
              ? caughtError.message
              : "Unable to load alerts.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );


  useEffect(
    () => {
      void loadAlerts();
    },
    [
      loadAlerts,
    ],
  );


  const createAlert =
    useCallback(
      async (
        input:
          CreateAlertInput,
      ) => {
        setSaving(
          true,
        );

        setError(
          null,
        );

        try {
          const response =
            await api(
              "/alerts",
              {
                method: "POST",

                body:
                  JSON.stringify(
                    input,
                  ),
              },
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              getErrorMessage(
                data,
                "Unable to create alert.",
              ),
            );
          }

          const alert =
            data as Alert;

          setAlerts(
            (
              currentAlerts,
            ) => [
              alert,
              ...currentAlerts,
            ],
          );

          return alert;
        } catch (
          caughtError
        ) {
          const message =
            caughtError
              instanceof Error
              ? caughtError.message
              : "Unable to create alert.";

          setError(
            message,
          );

          throw caughtError;
        } finally {
          setSaving(
            false,
          );
        }
      },
      [],
    );


  const updateAlert =
    useCallback(
      async (
        alertId: number,
        input:
          UpdateAlertInput,
      ) => {
        setError(
          null,
        );

        const response =
          await api(
            `/alerts/${alertId}`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  input,
                ),
            },
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          const message =
            getErrorMessage(
              data,
              "Unable to update alert.",
            );

          setError(
            message,
          );

          throw new Error(
            message,
          );
        }

        const updatedAlert =
          data as Alert;

        setAlerts(
          (
            currentAlerts,
          ) =>
            currentAlerts.map(
              (alert) =>
                alert.id
                  === alertId
                  ? updatedAlert
                  : alert,
            ),
        );

        return updatedAlert;
      },
      [],
    );


  const deleteAlert =
    useCallback(
      async (
        alertId: number,
      ) => {
        setError(
          null,
        );

        const response =
          await api(
            `/alerts/${alertId}`,
            {
              method:
                "DELETE",
            },
          );

        if (
          !response.ok
        ) {
          let message =
            "Unable to delete alert.";

          try {
            const data =
              await response.json();

            message =
              getErrorMessage(
                data,
                message,
              );
          } catch {
            // Keep fallback.
          }

          setError(
            message,
          );

          throw new Error(
            message,
          );
        }

        setAlerts(
          (
            currentAlerts,
          ) =>
            currentAlerts.filter(
              (alert) =>
                alert.id
                !== alertId,
            ),
        );
      },
      [],
    );


  const activeCount =
    alerts.filter(
      (alert) =>
        alert.is_active,
    ).length;


  return {
    alerts,

    activeCount,

    loading,

    saving,

    error,

    loadAlerts,

    createAlert,

    updateAlert,

    deleteAlert,
  };
}
