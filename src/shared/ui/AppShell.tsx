import clsx from "clsx";
import { useEffect } from "react";
import { NavLink, Outlet } from "react-router";
import { SignInPage } from "../../features/session/components/SignInPage";
import { can, isOperator, useSession, useSignOut } from "../lib/session";
import { live } from "../realtime/liveConnection";
import { useLiveStatus } from "../realtime/useLive";
import { EmptyState } from "./EmptyState";

const navigation: {
  to: string;
  label: string;
  end: boolean;
  permission?: string;
}[] = [
  { to: "/", label: "Live feed", end: true },
  { to: "/anomalies", label: "Anomalies", end: false },
  { to: "/incidents", label: "Incidents", end: false },
  { to: "/accounts", label: "Accounts", end: false },
  { to: "/trading", label: "Trading", end: false },
  { to: "/risk", label: "Risk", end: false },
  { to: "/casino", label: "Casino", end: false },
  { to: "/finance", label: "Finance", end: false, permission: "payments.read" },
  { to: "/reports", label: "Reports", end: false, permission: "reports.read" },
  { to: "/settings", label: "Settings", end: false, permission: "config.read" },
  {
    to: "/roles",
    label: "Roles",
    end: false,
    permission: "identity.roles.read",
  },
  { to: "/faults", label: "Fault injection", end: false },
];

const statusText = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline",
} as const;

export function AppShell() {
  const session = useSession();
  const signOut = useSignOut();
  const signedIn = !!session.data;

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    live.start();
    return () => void live.stop();
  }, [signedIn]);

  if (session.isPending) {
    return <p className="p-(--spacing-gutter) text-text-muted">Loading…</p>;
  }

  if (!session.data) {
    return <SignInPage />;
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-(--z-index-toast) focus:p-2"
      >
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className="flex flex-col border-b border-border bg-surface-sunken p-4 md:border-b-0 md:border-r"
      >
        <p className="mb-6 font-mono text-sm tracking-widest text-accent">
          SWIFTBETS OPS
        </p>
        <ul className="flex flex-wrap gap-2 md:flex-col">
          {navigation
            .filter((item) => can(session.data, item.permission))
            .map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "block rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent",
                      isActive
                        ? "bg-surface-raised text-text"
                        : "text-text-muted hover:text-text",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
        <div className="mt-6 space-y-3 text-sm md:mt-auto">
          <LiveIndicator />
          <p className="truncate text-text-muted" title={session.data.subject}>
            {session.data.roles.join(", ")}
          </p>
          <button
            type="button"
            onClick={() => signOut.mutate()}
            className="rounded-md border border-border px-3 py-1.5 text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main id="main" className="min-w-0 p-(--spacing-gutter)">
        {isOperator(session.data) ? (
          <Outlet />
        ) : (
          <EmptyState title="Operators only">
            This dashboard needs an operator account.
          </EmptyState>
        )}
      </main>
    </div>
  );
}

function LiveIndicator() {
  const status = useLiveStatus();
  return (
    <p className="flex items-center gap-2" role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className={clsx(
          "size-2 rounded-full",
          status === "live"
            ? "bg-positive"
            : status === "offline"
              ? "bg-negative"
              : "bg-warning",
        )}
      />
      <span>{statusText[status]}</span>
    </p>
  );
}
