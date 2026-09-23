export type AlertType =
  | "price_above"
  | "price_below"
  | "percent_change_above"
  | "percent_change_below"
  | "potential_entry";


export type AlertFrequency =
  | "once"
  | "once_per_day"
  | "every_occurrence";


export type Alert = {
  id: number;

  symbol: string;

  alert_type: AlertType;

  threshold: number | null;

  frequency: AlertFrequency;

  is_active: boolean;

  created_at: string;

  updated_at: string;

  last_checked_at: string | null;

  last_triggered_at: string | null;

  last_observed_value: number | null;

  trigger_count: number;
};


export type AlertListResponse = {
  alerts: Alert[];

  count: number;

  active_count: number;
};


export type CreateAlertInput = {
  symbol: string;

  alert_type: AlertType;

  threshold: number | null;

  frequency: AlertFrequency;
};


export type UpdateAlertInput = {
  threshold?: number;

  frequency?: AlertFrequency;

  is_active?: boolean;
};
