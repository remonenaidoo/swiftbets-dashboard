import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatMoney } from '../../../shared/lib/format';
import { useReconcile, useReconciliations } from '../api/casino';

const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';
const providers = [
  { id: 'sim-seamless', name: 'Simulator (seamless wallet)' },
  { id: 'sim-transfer', name: 'Simulator (transfer wallet)' },
];

/** Daily provider reconciliation: our ledger against the provider's report, with drift flagged. */
export function ReconciliationPanel() {
  const [providerId, setProviderId] = useState(providers[0].id);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const runs = useReconciliations(providerId);
  const reconcile = useReconcile();
  const error = reconcile.error instanceof ApiError ? reconcile.error.message : reconcile.error ? 'That did not work. Try again.' : null;

  return (
    <section aria-labelledby="recon-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
      <h2 id="recon-title" className="text-lg font-semibold">
        Provider reconciliation
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-text-muted">
          Provider
          <select className={field} value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-text-muted">
          Business date
          <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-negative">
          {error}
        </p>
      ) : null}
      <button type="button" className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={!/^\d{4}-\d{2}-\d{2}$/.test(date) || reconcile.isPending} onClick={() => reconcile.mutate({ providerId, date })}>
        Reconcile now
      </button>
      <table className="w-full text-left">
        <thead className="text-text-muted">
          <tr>
            <th className="py-1">Date</th>
            <th>Ours</th>
            <th>Provider</th>
            <th>Missing (ours / theirs)</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {runs.data?.map((r) => (
            <tr key={r.runId} className="border-t border-border">
              <td className="py-1">{r.businessDate}</td>
              <td>{formatMoney({ minorUnits: r.ourNet, currency: r.currency })}</td>
              <td>{formatMoney({ minorUnits: r.providerNet, currency: r.currency })}</td>
              <td>
                {r.missingOnOurSide} / {r.missingOnProviderSide}
              </td>
              <td className={r.status === 'drift' ? 'font-semibold text-negative' : 'text-positive'}>{r.status === 'drift' ? `Drift ${formatMoney({ minorUnits: r.drift, currency: r.currency })}` : 'Matched'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {runs.isSuccess && runs.data.length === 0 ? <p className="text-text-muted">No reconciliations for this provider yet.</p> : null}
    </section>
  );
}
