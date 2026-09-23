"use client";

import Sidebar from "@/components/Sidebar";
import AlertCreator from "@/components/alerts/AlertCreator";
import AlertList from "@/components/alerts/AlertList";
import NotificationCenter from "@/components/alerts/NotificationCenter";
import PushNotificationControl from "@/components/alerts/PushNotificationControl";
import PageHeader from "@/components/layout/PageHeader";
import PageSectionNav from "@/components/ui/PageSectionNav";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

import useAlerts from "@/hooks/alerts/useAlerts";
import {
  useNotifications,
} from "@/hooks/alerts/useNotifications";

import type {
  Alert,
} from "@/lib/alerts/types";




const ALERT_SECTIONS = [
  { id: "alert-management", label: "Alerts" },
  { id: "delivery", label: "Delivery" },
  { id: "notifications", label: "Notifications" },
] as const;

export default function AlertsPage() {
  const {
    alerts,
    activeCount,
    loading,
    saving,
    error,
    loadAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
  } = useAlerts();


  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();


  /* =======================================================
     PAUSE / RESUME
  ======================================================= */

  async function handleToggle(
    alert: Alert,
  ) {
    await updateAlert(
      alert.id,
      {
        is_active:
          !alert.is_active,
      },
    );
  }


  /* =======================================================
     REFRESH PAGE DATA
  ======================================================= */

  async function handleRefresh() {
    await Promise.all([
      loadAlerts(),
      refreshNotifications(),
    ]);
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar
        active="Alerts"
      />


      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Market monitoring"

            title="Alerts"

            description="Track the market conditions that matter to you and receive notifications when your configured conditions are triggered."

            status={
              <>
                <StatusBadge
                  tone={
                    activeCount > 0
                      ? "positive"
                      : "neutral"
                  }

                  dot={
                    activeCount > 0
                  }
                >
                  {
                    activeCount === 1
                      ? "1 active alert"
                      : `${activeCount} active alerts`
                  }
                </StatusBadge>


                <a
                  href="#notifications"
                  aria-label="Jump to notifications"
                  className="inline-flex cursor-pointer transition hover:opacity-80"
                >
                  <StatusBadge
                    tone={
                      unreadCount > 0
                        ? "info"
                        : "neutral"
                    }
                  >
                    {
                      unreadCount === 1
                        ? "1 unread notification"
                        : `${unreadCount} unread notifications`
                    }
                  </StatusBadge>
                </a>
              </>
            }

            actions={
              <button
                type="button"

                onClick={
                  () =>
                    void handleRefresh()
                }

                disabled={
                  loading
                  || notificationsLoading
                }

                className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refresh
              </button>
            }
          />


          <PageSectionNav sections={ALERT_SECTIONS} />


          <div className="space-y-8">

            {
              error
              && (
                <div className="rounded-xl border border-red-950 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                  {
                    error
                  }
                </div>
              )
            }


            {/* =============================================
                ALERT MANAGEMENT
            ============================================= */}

            <div id="alert-management" className="scroll-mt-28 grid gap-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">

              <Card
                title="Create an alert"

                description="Choose a symbol, condition and threshold. A-Trader will establish the current value as the baseline before watching for a crossing."

                className="self-start"
              >
                <AlertCreator
                  saving={
                    saving
                  }

                  onCreate={
                    createAlert
                  }
                />
              </Card>


              <Card
                title="Your alerts"

                description="Pause, resume or remove the market conditions you are tracking."

                action={
                  <span className="text-xs text-zinc-600">
                    {
                      activeCount
                    } active
                  </span>
                }
              >
                <AlertList
                  alerts={
                    alerts
                  }

                  loading={
                    loading
                  }

                  onToggle={
                    handleToggle
                  }

                  onDelete={
                    deleteAlert
                  }
                />
              </Card>

            </div>


            {/* =============================================
                NOTIFICATION DELIVERY
            ============================================= */}

            <div id="delivery" className="scroll-mt-28">
            <Card
              title="Notification delivery"

              description="Choose whether A-Trader can send market alerts directly to this device."
            >
              <PushNotificationControl />
            </Card>
            </div>


            {/* =============================================
                NOTIFICATION CENTER
            ============================================= */}

            <div
              id="notifications"
              className="scroll-mt-28"
            >
              <Card
                className="overflow-hidden"
                padding="none"
              >
                <NotificationCenter
                notifications={
                  notifications
                }

                unreadCount={
                  unreadCount
                }

                loading={
                  notificationsLoading
                }

                error={
                  notificationsError
                }

                onRefresh={
                  refreshNotifications
                }

                onRead={
                  markAsRead
                }

                onReadAll={
                  markAllAsRead
                }
                />
              </Card>
            </div>


            {/* =============================================
                DISCLAIMER
            ============================================= */}

            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 px-5 py-4">

              <p className="text-xs leading-5 text-zinc-600">
                Alerts are monitoring tools based on market data and
                configured conditions. They are not guarantees of market
                movement, execution, profitability, or investment advice.
                Market data and notifications may be delayed, interrupted,
                or unavailable.
              </p>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
