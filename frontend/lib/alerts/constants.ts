import type {
  AlertFrequency,
  AlertType,
} from "./types";


export type AlertTypeOption = {
  value: AlertType;

  label: string;

  shortLabel: string;

  description: string;

  thresholdLabel: string;

  thresholdPrefix?: string;

  thresholdSuffix?: string;
};


export const ALERT_TYPE_OPTIONS:
  AlertTypeOption[] = [
    {
      value: "price_above",
      label: "Price crosses above",
      shortLabel: "Price Above",
      description:
        "Notify me when the price crosses above a level.",
      thresholdLabel: "Price level",
      thresholdPrefix: "$",
    },

    {
      value: "price_below",
      label: "Price crosses below",
      shortLabel: "Price Below",
      description:
        "Notify me when the price crosses below a level.",
      thresholdLabel: "Price level",
      thresholdPrefix: "$",
    },

    {
      value: "percent_change_above",
      label: "% change crosses above",
      shortLabel: "% Change Above",
      description:
        "Notify me when the daily move crosses above a percentage.",
      thresholdLabel: "Percentage",
      thresholdSuffix: "%",
    },

    {
      value: "percent_change_below",
      label: "% change crosses below",
      shortLabel: "% Change Below",
      description:
        "Notify me when the daily move crosses below a percentage.",
      thresholdLabel: "Percentage",
      thresholdSuffix: "%",
    },
  ];


export const ALERT_FREQUENCY_OPTIONS:
  {
    value: AlertFrequency;
    label: string;
    description: string;
  }[] = [
    {
      value: "once",
      label: "Once",
      description:
        "Trigger once, then automatically deactivate.",
    },

    {
      value: "once_per_day",
      label: "Once per day",
      description:
        "Allow up to one notification per day.",
    },

    {
      value: "every_occurrence",
      label: "Every occurrence",
      description:
        "Trigger again after the condition resets and crosses again.",
    },
  ];


export function getAlertTypeOption(
  alertType: AlertType,
) {
  return ALERT_TYPE_OPTIONS.find(
    (option) =>
      option.value === alertType,
  );
}
