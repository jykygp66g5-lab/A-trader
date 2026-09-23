"use client";

import AlertCard from "./AlertCard";
import EmptyAlerts from "./EmptyAlerts";

import type {
  Alert,
} from "@/lib/alerts/types";


type AlertListProps = {
  alerts: Alert[];

  loading: boolean;

  onToggle: (
    alert: Alert,
  ) => Promise<unknown>;

  onDelete: (
    alertId: number,
  ) => Promise<void>;
};


export default function AlertList({
  alerts,
  loading,
  onToggle,
  onDelete,
}: AlertListProps) {
  if (
    loading
  ) {
    return (
      <div className="flex min-h-56 items-center justify-center text-sm text-zinc-600">
        Loading alerts…
      </div>
    );
  }


  if (
    alerts.length === 0
  ) {
    return (
      <EmptyAlerts />
    );
  }


  return (
    <div className="space-y-3">
      {
        alerts.map(
          (alert) => (
            <AlertCard
              key={
                alert.id
              }
              alert={
                alert
              }
              onToggle={
                onToggle
              }
              onDelete={
                onDelete
              }
            />
          ),
        )
      }
    </div>
  );
}
