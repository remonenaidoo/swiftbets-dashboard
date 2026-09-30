import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { useInjectFault, useSpend } from '../api/faults';

const drills = [
  { id: 'stuck-coupon', title: 'Stuck coupon', body: 'The settler drops its next three settlements, so evaluated coupons never settle until the reconciler notices.' },
  { id: 'wallet-outage', title: 'Wallet outage', body: 'The wallet refuses its next 3,000 calls. Payouts climb the retry ladder and drain once it recovers.' },
  { id: 'poison-message', title: 'Poison message', body: 'A malformed result is published. It must be parked on the dead-letter queue while the partition keeps flowing.' },
  { id: 'duplicate-settlement', title: 'Duplicate settlement', body: 'A real settlement is re-published under a new event id. Payout must not pay it twice.' },
] as const;

export function FaultsPage() {
  const inject = useInjectFault();
  const spend = useSpend();
  const [results, setResults] = useState<Record<string, string>>({});

  const run = (fault: string) =>
    inject.mutate(fault, {
      onSuccess: (result) => setResults((current) => ({ ...current, [fault]: result.injected })),
      onError: (error) => setResults((current) => ({ ...current, [fault]: error instanceof ApiError ? `Failed: ${error.message}` : 'Failed.' })),
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Fault injection</h1>
          <p className="text-sm text-text-muted">Each drill triggers a real failure path. Watch Anomalies and Incidents while it plays out.</p>
        </div>
        <p className="text-sm text-text-muted" aria-live="polite">
          Steward model spend this month: {spend.data ? `USD ${spend.data.monthToDateUsd.toFixed(2)}` : '…'}
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {drills.map((drill) => (
          <li key={drill.id} className="flex flex-col rounded-lg border border-border bg-surface-raised p-4">
            <h2 className="font-semibold">{drill.title}</h2>
            <p className="mt-1 flex-1 text-sm text-text-muted">{drill.body}</p>
            <button
              type="button"
              disabled={inject.isPending && inject.variables === drill.id}
              onClick={() => run(drill.id)}
              className="mt-4 self-start rounded-md bg-accent-strong px-3 py-1.5 text-sm font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
            >
              Inject {drill.title.toLowerCase()}
            </button>
            {results[drill.id] ? (
              <p role="status" className="mt-3 font-mono text-xs break-all">
                {results[drill.id]}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
