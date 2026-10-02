import clsx from 'clsx';
import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatTime } from '../../../shared/lib/format';
import { useSetMarketStatus, useTradingFixtures } from '../api/trading';
import { ManualResultForm } from './ManualResultForm';
import { TradingEvents } from './TradingEvents';

const button = 'rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50';
const marketLabels: Record<string, string> = { matchResult: 'Match result', totalGoalsOverUnder25: 'Total goals 2.5' };
const statusTone: Record<string, string> = { open: 'text-positive', suspended: 'text-warning', closed: 'text-text-muted' };

/** Suspend and resume markets, issue manual results, and watch suspensions and rejections as they happen. */
export function TradingPage() {
  const fixtures = useTradingFixtures();
  const status = useSetMarketStatus();
  const [selected, setSelected] = useState<string | null>(null);
  const fixture = fixtures.data?.find((f) => f.fixtureId === selected) ?? null;
  const error = status.error instanceof ApiError ? status.error.message : status.error ? 'That did not work. Try again.' : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Trading</h1>
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="markets-title" className="space-y-3">
          <h2 id="markets-title" className="text-lg font-semibold">
            Markets
          </h2>
          {fixtures.isPending ? <p className="text-text-muted">Loading markets…</p> : null}
          <ul className="space-y-2">
            {fixtures.data?.map((f) => (
              <li key={f.fixtureId} className={clsx('rounded-md border p-3', selected === f.fixtureId ? 'border-accent' : 'border-border')}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <button type="button" className="text-left font-medium hover:underline" onClick={() => setSelected(f.fixtureId)} aria-pressed={selected === f.fixtureId}>
                    {f.homeTeam} v {f.awayTeam}
                  </button>
                  <span className="font-mono text-xs text-text-muted">
                    {f.fixtureId} · {f.status} · {formatTime(f.kickoffAt)}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {f.markets.map((m) => {
                    const label = marketLabels[m.type] ?? m.type;
                    return (
                      <li key={m.marketId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          {label} <span className={clsx('font-semibold', statusTone[m.status])}>{m.status}</span>
                        </span>
                        <span className="flex gap-2">
                          {m.status === 'open' ? (
                            <button type="button" className={button} disabled={status.isPending} aria-label={`Suspend ${label} for ${f.homeTeam} v ${f.awayTeam}`} onClick={() => status.mutate({ fixtureId: f.fixtureId, marketId: m.marketId, suspend: true })}>
                              Suspend
                            </button>
                          ) : null}
                          {m.status === 'suspended' ? (
                            <button type="button" className={button} disabled={status.isPending} aria-label={`Resume ${label} for ${f.homeTeam} v ${f.awayTeam}`} onClick={() => status.mutate({ fixtureId: f.fixtureId, marketId: m.marketId, suspend: false })}>
                              Resume
                            </button>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-6">
          <ManualResultForm fixture={fixture} />
          <TradingEvents />
        </div>
      </div>
    </div>
  );
}
