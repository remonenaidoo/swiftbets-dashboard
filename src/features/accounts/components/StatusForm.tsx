import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { useChangeStatus, type AccountProfile, type AccountStatus } from '../api/accounts';

const options: { value: AccountStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
  { value: 'selfExcluded', label: 'Self-excluded' },
];

const refusals: Record<string, string> = {
  self_exclusion_locked: 'A self-exclusion can only end when its period has run.',
  status_changed: 'Someone changed this account meanwhile. Reload and try again.',
  forbidden: 'Your role cannot change account status.',
};

/** Every change needs a reason; it is recorded with the operator's id. Leaving active signs every device out. */
export function StatusForm({ account, email }: { account: AccountProfile; email: string }) {
  const current = (account.status.charAt(0).toLowerCase() + account.status.slice(1)) as AccountStatus;
  const [status, setStatus] = useState<AccountStatus>(current);
  const [reason, setReason] = useState('');
  const change = useChangeStatus(email);
  const unchanged = status === current;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    change.mutate({ userId: account.userId, status, reason: reason.trim() }, { onSuccess: () => setReason('') });
  };

  const error = change.error instanceof ApiError ? (refusals[change.error.code] ?? change.error.message) : change.isError ? 'Could not change the status.' : null;

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Change account status">
      <label className="block text-sm text-text-muted">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)} className="mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-text-muted">
        Reason (recorded with your name)
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text" />
      </label>
      {status !== 'active' && !unchanged ? <p className="text-sm text-warning">Every device on this account is signed out immediately.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}
      {change.isSuccess ? (
        <p role="status" className="text-sm text-positive">
          Status changed.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={unchanged || reason.trim().length === 0 || change.isPending}
        className="rounded-md bg-accent-strong px-4 py-2 font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {change.isPending ? 'Saving…' : 'Change status'}
      </button>
    </form>
  );
}
