import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { can, useSession } from '../../../shared/lib/session';
import { findStaff, useRoles, useSetPermission, useSetStaffRoles } from '../api/roles';

const staffRoles = ['Trader', 'Ops', 'Admin'];
const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';

/** What each staff role may do, and who holds which role. Changes reach staff at their next sign-in. */
export function RolesPage() {
  const roles = useRoles();
  const setPermission = useSetPermission();
  const writable = can(useSession().data, 'identity.roles.write');
  const error = setPermission.error instanceof ApiError ? setPermission.error.message : setPermission.error ? 'That did not work. Try again.' : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Roles</h1>
      <section aria-labelledby="matrix-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
        <h2 id="matrix-title" className="text-lg font-semibold">
          Permissions by role
        </h2>
        <p className="text-text-muted">Changes apply when each person next signs in.</p>
        {error ? (
          <p role="alert" className="text-negative">
            {error}
          </p>
        ) : null}
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-text-muted">
              <tr>
                <th className="py-1">Permission</th>
                {staffRoles.map((r) => (
                  <th key={r} className="text-center">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.data?.permissions.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-1">
                    <span className="block">{p.allows}</span>
                    <span className="text-xs text-text-muted">{p.name}</span>
                  </td>
                  {staffRoles.map((r) => {
                    const granted = roles.data?.roles.find((x) => x.role === r)?.permissions.includes(p.name) ?? false;
                    return (
                      <td key={r} className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`${r}: ${p.allows}`}
                          checked={granted}
                          disabled={!writable || setPermission.isPending}
                          onChange={(e) =>
                            setPermission.mutate({
                              role: r,
                              permission: p.name,
                              granted: e.target.checked,
                            })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {writable ? <StaffRoles /> : null}
    </div>
  );
}

function StaffRoles() {
  const [email, setEmail] = useState('');
  const [staff, setStaff] = useState<{
    userId: string;
    email: string | null;
    roles: string[];
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const save = useSetStaffRoles();
  const error = save.error instanceof ApiError ? save.error.message : save.error ? 'That did not work. Try again.' : null;

  const lookUp = async () => {
    setLookupError(null);
    try {
      setStaff(await findStaff(email.trim()));
    } catch (e) {
      setStaff(null);
      setLookupError(e instanceof ApiError ? e.message : 'That did not work. Try again.');
    }
  };

  return (
    <section aria-labelledby="staff-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
      <h2 id="staff-title" className="text-lg font-semibold">
        Staff roles
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-64 flex-1 text-text-muted">
          Staff email or username
          <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 font-semibold disabled:opacity-50"
          disabled={email.trim().length < 3}
          onClick={() => void lookUp()}
        >
          Find
        </button>
      </div>
      {lookupError ? (
        <p role="alert" className="text-negative">
          {lookupError}
        </p>
      ) : null}
      {staff ? (
        <div className="space-y-2">
          <p>{staff.email ?? staff.userId}</p>
          <div className="flex gap-4">
            {staffRoles.map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={staff.roles.includes(r)}
                  onChange={(e) =>
                    setStaff({
                      ...staff,
                      roles: e.target.checked ? [...staff.roles, r] : staff.roles.filter((x) => x !== r),
                    })
                  }
                />
                {r}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                userId: staff.userId,
                roles: staff.roles.filter((r) => staffRoles.includes(r)),
              })
            }
          >
            Save roles
          </button>
          {error ? (
            <p role="alert" className="text-negative">
              {error}
            </p>
          ) : null}
          {save.isSuccess ? (
            <p role="status" className="text-positive">
              Saved. They get the new roles at their next sign-in.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
