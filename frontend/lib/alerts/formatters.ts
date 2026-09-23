import {
  getAlertTypeOption,
} from "./constants";

import type {
  Alert,
} from "./types";


export function formatAlertThreshold(
  alert: Alert,
) {
  if (
    alert.threshold === null
  ) {
    return "—";
  }

  if (
    alert.alert_type ===
      "price_above"
    || alert.alert_type ===
      "price_below"
  ) {
    return `$${alert.threshold.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  }

  return `${alert.threshold.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    },
  )}%`;
}


export function formatAlertType(
  alert: Alert,
) {
  return (
    getAlertTypeOption(
      alert.alert_type,
    )?.shortLabel
    ?? alert.alert_type
  );
}


export function formatAlertFrequency(
  frequency: Alert["frequency"],
) {
  if (
    frequency === "once"
  ) {
    return "Once";
  }

  if (
    frequency === "once_per_day"
  ) {
    return "Once per day";
  }

  return "Every occurrence";
}


export function formatAlertDate(
  value: string | null,
) {
  if (!value) {
    return "Never";
  }

  const date = new Date(
    value,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}
