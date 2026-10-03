import type { ReactNode } from "react";
import { can, useSession } from "../lib/session";
import { EmptyState } from "./EmptyState";

/** A screen for one permission: without it the screen is not shown, even when its address is typed in. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const session = useSession();
  if (!can(session.data, permission)) {
    return (
      <EmptyState title="No access">
        Your role does not include this screen. Ask an administrator if you need
        it.
      </EmptyState>
    );
  }
  return children;
}
