import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatMoney, shortId } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { driftLabel, providers, useApprovalQueue, useDecideWithdrawal, useLatestRun, useRunReconciliation, type WithdrawalView } from '../api/finance';

const button = 'rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50';
const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';

const refusals: Record<string, string> = {
  invalid_state: 'That withdrawal has already been decided.',
  payment_not_found: 'That withdrawal no longer exists.',
  reason_required: 'Say why the withdrawal is rejected.',
  forbidden: 'Your role cannot do that.',
};

const problem = (error: unknown) => (error instanceof ApiError ? (refusals[error.code] ?? error.message) : error ? 'That did not work. Try again.' : null);
const money = (minorUnits: number, currency: string) => formatMoney({ minorUnits, currency });

/** Withdrawals waiting for an operator, and the daily provider-against-ledger runs. The server enforces every rule. */
export function FinancePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Finance</h1>
      <ApprovalQueue />
      <section aria-labelledby="reconciliation-title" className="space-y-4">
        <h2 id="reconciliation-title" className="text-lg font-semibold">
          Reconciliation
        </h2>
        {providers.map((provider) => (
          <ProviderRun key={provider} provider={provider} />
        ))}
      </section>
    </div>
  );
}

function ApprovalQueue() {
  const queue = useApprovalQueue();
  const decide = useDecideWithdrawal();
  const error = problem(decide.error) ?? problem(queue.error);
  return (
    <section aria-labelledby="queue-title" className="space-y-3">
      <h2 id="queue-title" className="text-lg font-semibold">
        Withdrawals to approve
      </h2>
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}
      {queue.data && queue.data.length === 0 ? <EmptyState title="Nothing to approve">Withdrawals above the review threshold appear here.</EmptyState> : null}
      <ul className="space-y-3">
        {queue.data?.map((w) => <QueueItem key={w.withdrawalId} withdrawal={w} busy={decide.isPending} onDecide={(approve, reason) => decide.mutate({ withdrawalId: w.withdrawalId, approve, reason })} />)}
      </ul>
    </section>
  );
}

function QueueItem({ withdrawal, busy, onDecide }: { withdrawal: WithdrawalView; busy: boolean; onDecide: (approve: boolean, reason?: string) => void }) {
  const [reason, setReason] = useState('');
  const label = `${money(withdrawal.amount, withdrawal.currency)} for ${shortId(withdrawal.userId)}`;
  return (
    <li className="space-y-2 rounded-md border border-border p-3 text-sm">
      <p className="flex flex-wrap gap-2">
        <span className="font-medium">{money(withdrawal.amount, withdrawal.currency)}</span>
        <span className="text-text-muted">customer {shortId(withdrawal.userId)}</span>
        <span className="text-text-muted">asked {new Date(withdrawal.createdAt).toLocaleString('en-ZA', { hour12: false })}</span>
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <button type="button" className={button} disabled={busy} aria-label={`Approve ${label}`} onClick={() => onDecide(true)}>
          Approve
        </button>
        <label className="min-w-48 flex-1 text-text-muted">
          Why reject
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} className={field} />
        </label>
        <button type="button" className={button} disabled={busy || !reason.trim()} aria-label={`Reject ${label}`} onClick={() => onDecide(false, reason.trim())}>
          Reject
        </button>
      </div>
    </li>
  );
}

function ProviderRun({ provider }: { provider: string }) {
  const run = useLatestRun(provider);
  const rerun = useRunReconciliation(provider);
  const error = problem(rerun.error) ?? problem(run.error);
  return (
    <article aria-label={`${provider} reconciliation`} className="space-y-2 rounded-md border border-border p-3 text-sm">
      <header className="flex flex-wrap items-center gap-3">
        <h3 className="font-semibold capitalize">{provider}</h3>
        {run.data ? (
          <span className={run.data.drifts.length ? 'text-negative' : 'text-positive'}>
            {run.data.drifts.length ? `${run.data.drifts.length} drift${run.data.drifts.length === 1 ? '' : 's'} on ${run.data.day}` : `Balanced on ${run.data.day}`}
          </span>
        ) : run.data === null ? (
          <span className="text-text-muted">No run yet</span>
        ) : null}
        <button type="button" className={`${button} ml-auto`} disabled={rerun.isPending} onClick={() => rerun.mutate()}>
          Run yesterday again
        </button>
      </header>
      {error ? (
        <p role="alert" className="text-negative">
          {error}
        </p>
      ) : null}
      {run.data && run.data.drifts.length > 0 ? (
        <table className="w-full text-left">
          <thead className="text-text-muted">
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Drift</th>
              <th scope="col" className="text-right">Provider</th>
              <th scope="col" className="text-right">Ledger</th>
            </tr>
          </thead>
          <tbody>
            {run.data.drifts.map((d) => (
              <tr key={`${d.reference}-${String(d.kind)}`} className="border-t border-border">
                <td className="font-mono">{d.reference}</td>
                <td>{driftLabel(d.kind)}</td>
                <td className="text-right">{d.providerAmount === null ? '—' : money(d.providerAmount, d.currency)}</td>
                <td className="text-right">{d.ledgerAmount === null ? '—' : money(d.ledgerAmount, d.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </article>
  );
}
