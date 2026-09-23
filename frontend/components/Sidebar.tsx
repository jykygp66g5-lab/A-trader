"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  api,
} from "@/lib/api";


const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "grid",
  },
  {
    name: "Scanner",
    href: "/scanner",
    icon: "scan",
  },
  {
    name: "Market Analysis",
    href: "/market",
    icon: "chart",
  },
  {
    name: "Planning",
    href: "/playbook",
    icon: "plan",
  },
  {
    name: "Journal",
    href: "/journal",
    icon: "journal",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: "analytics",
  },
  {
    name: "Replay",
    href: "/replay",
    icon: "replay",
  },
  {
    name: "AI Coach",
    href: "/ai-coach",
    icon: "ai",
  },
  {
    name: "Learning",
    href: "/learn",
    icon: "learn",
  },
] as const;


type SidebarProps = {
  active: string;
};


type IconName =
  (typeof navigation)[number]["icon"];


/* =========================================================
   NAV ICON
========================================================= */

function NavIcon({
  name,
}: {
  name: IconName;
}) {
  const common =
    "h-[18px] w-[18px] shrink-0";


  if (
    name === "grid"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </svg>
    );
  }


  if (
    name === "scan"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M7 3H4a1 1 0 0 0-1 1v3M17 3h3a1 1 0 0 1 1 1v3M7 21H4a1 1 0 0 1-1-1v-3M17 21h3a1 1 0 0 0 1-1v-3" />

        <path d="M7 13l3-3 2 2 5-5" />
      </svg>
    );
  }


  if (
    name === "chart"
    || name === "analytics"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </svg>
    );
  }


  if (
    name === "plan"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M8 4h8M9 2h6v4H9z" />

        <rect
          x="5"
          y="4"
          width="14"
          height="17"
          rx="2"
        />

        <path d="M8 10h8M8 14h8M8 18h5" />
      </svg>
    );
  }


  if (
    name === "journal"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22z" />

        <path d="M5 4.5V22M9 7h6M9 11h6" />
      </svg>
    );
  }


  if (
    name === "replay"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" />

        <path d="M4 4v4.6h4.6M10 9l5 3-5 3z" />
      </svg>
    );
  }


  if (
    name === "ai"
  ) {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect
          x="5"
          y="7"
          width="14"
          height="12"
          rx="3"
        />

        <path d="M9 12h.01M15 12h.01M9 16h6M12 3v4" />
      </svg>
    );
  }


  return (
    <svg
      className={common}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" />
    </svg>
  );
}


/* =========================================================
   BRAND
========================================================= */

function Brand({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);


  useEffect(
    () => {
      let cancelled = false;


      async function loadUnreadCount() {
        try {
          const response = await api(
            "/alerts/notifications/unread-count",
          );


          if (!response.ok) {
            return;
          }


          const data =
            await response.json();


          if (!cancelled) {
            setUnreadCount(
              data.unread_count ?? 0,
            );
          }
        } catch {
          // Notification count should never break navigation.
        }
      }


      void loadUnreadCount();


      const interval =
        window.setInterval(
          () => {
            void loadUnreadCount();
          },
          30000,
        );


      return () => {
        cancelled = true;

        window.clearInterval(
          interval,
        );
      };
    },
    [],
  );


  return (
    <div className="flex w-full min-w-0 items-center gap-3">

      <Link
        href="/dashboard"
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm transition group-hover:border-zinc-700">

          <span className="text-sm font-bold tracking-tight text-white">
            A
          </span>

        </div>


        {!compact
        && (
          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <span className="text-[15px] font-semibold tracking-tight text-white">
                A Trader
              </span>


              <span className="rounded-md border border-blue-900/60 bg-blue-950/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                Beta
              </span>

            </div>


            <p className="mt-0.5 text-[11px] text-zinc-600">
              Trading workspace
            </p>

          </div>
        )}

      </Link>


      {!compact
      && (
        <Link
          href="/alerts#notifications"

          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }

          title="Notifications"

          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          <svg
            className="h-[17px] w-[17px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>


          {unreadCount > 0
          && (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[#080808] bg-blue-500 px-1 text-[9px] font-bold leading-none text-white">
              {
                unreadCount > 99
                  ? "99+"
                  : unreadCount
              }
            </span>
          )}

        </Link>
      )}

    </div>
  );
}


/* =========================================================
   NAVIGATION LIST
========================================================= */

function NavigationList({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">

      {navigation.map(
        (
          item,
        ) => {
          const selected =
            active
            === item.name;


          return (
            <Link
              key={
                item.name
              }

              href={
                item.href
              }

              onClick={
                onNavigate
              }

              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                selected
                  ? "bg-zinc-100 font-medium text-black shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-100"
              }`}
            >

              <span
                className={
                  selected
                    ? "text-black"
                    : "text-zinc-600 transition-colors group-hover:text-zinc-300"
                }
              >
                <NavIcon
                  name={
                    item.icon
                  }
                />
              </span>


              <span className="min-w-0 flex-1 truncate">
                {
                  item.name
                }
              </span>


              {selected
              && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}

            </Link>
          );
        },
      )}

    </nav>
  );
}


/* =========================================================
   ACCOUNT CARD
========================================================= */

function AccountCard() {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/70 p-3.5">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-black text-xs font-semibold text-zinc-300">
          MB
        </div>


        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-medium text-zinc-200">
            Maddox Butler
          </p>


          <p className="mt-0.5 text-[11px] text-zinc-600">
            Demo account
          </p>

        </div>


        <span
          className="h-2 w-2 rounded-full bg-emerald-400"
          title="Online"
        />

      </div>

    </div>
  );
}


/* =========================================================
   MENU ICON
========================================================= */

function MenuIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >

      {open
      ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      )

      : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}

    </svg>
  );
}


/* =========================================================
   SIDEBAR
========================================================= */

export default function Sidebar({
  active,
}: SidebarProps) {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(
    false,
  );


  return (
    <>

      {/* ===================================================
          MOBILE NAVIGATION
      =================================================== */}

      <div className="w-0 shrink-0 lg:hidden">

        <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-900 bg-[#080808]/95 px-4 backdrop-blur-xl sm:px-6">

          <Brand />


          <button
            type="button"

            onClick={() =>
              setMobileOpen(
                (
                  current,
                ) =>
                  !current,
              )
            }

            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }

            aria-expanded={
              mobileOpen
            }

            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <MenuIcon
              open={
                mobileOpen
              }
            />
          </button>

        </header>


        <div className="h-16" />


        {mobileOpen
        && (
          <>

            <button
              type="button"

              aria-label="Close navigation"

              onClick={() =>
                setMobileOpen(
                  false,
                )
              }

              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />


            <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,340px)] flex-col border-l border-zinc-900 bg-[#080808] shadow-2xl">

              <div className="flex h-16 items-center justify-between border-b border-zinc-900 px-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                    Navigation
                  </p>


                  <p className="mt-1 text-sm font-medium text-zinc-300">
                    {
                      active
                    }
                  </p>

                </div>


                <button
                  type="button"

                  onClick={() =>
                    setMobileOpen(
                      false,
                    )
                  }

                  aria-label="Close navigation"

                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                >
                  <MenuIcon
                    open
                  />
                </button>

              </div>


              <div className="flex-1 overflow-y-auto px-3 py-5">

                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Workspace
                </p>


                <NavigationList
                  active={
                    active
                  }

                  onNavigate={() =>
                    setMobileOpen(
                      false,
                    )
                  }
                />

              </div>


              <div className="border-t border-zinc-900 p-4">
                <AccountCard />
              </div>

            </aside>

          </>
        )}

      </div>


      {/* ===================================================
          DESKTOP SIDEBAR
      =================================================== */}

      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-zinc-900 bg-[#080808] lg:flex lg:flex-col">

        <div className="border-b border-zinc-900 px-5 py-5">
          <Brand />
        </div>


        <div className="flex-1 overflow-y-auto px-3 py-5">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
            Workspace
          </p>


          <NavigationList
            active={
              active
            }
          />

        </div>


        <div className="border-t border-zinc-900 p-4">
          <AccountCard />
        </div>

      </aside>

    </>
  );
}