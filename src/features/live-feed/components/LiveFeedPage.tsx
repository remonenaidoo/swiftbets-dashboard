import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { formatMoney, formatTime, shortId } from '../../../shared/lib/format';
import { useDeltas } from '../../../shared/realtime/useLive';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { addToTotals, emptyTotals, feedTypes, toFeedRow, type FeedRow, type FeedTotals } from '../model/feed';

const MaxRows = 100;
const FlushMs = 250;

const typeLabel: Record<FeedRow['type'], string> = {
  'coupon-placed': 'Placed',
  'coupon-rejected': 'Rejected',
  'coupon-settled': 'Settled',
  'payout-completed': 'Paid',
};

const typeTone: Record<FeedRow['type'], string> = {
  'coupon-placed': 'text-accent',
  'coupon-rejected': 'text-negative',
  'coupon-settled': 'text-warning',
  'payout-completed': 'text-positive',
};

export function LiveFeedPage() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [totals, setTotals] = useState<FeedTotals>(emptyTotals);
  const [paused, setPaused] = useState(false);
  const pending = useRef<FeedRow[]>([]);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useDeltas(feedTypes, (delta) => {
    const row = toFeedRow(delta);
    if (row) {
      pending.current.push(row);
    }
  });

  // Under load the feed receives hundreds of deltas a second; batching keeps rendering at four frames a second.
  useEffect(() => {
    const timer = setInterval(() => {
      const batch = pending.current;
      if (batch.length === 0) {
        return;
      }
      pending.current = [];
      setTotals((current) => batch.reduce(addToTotals, current));
      if (!pausedRef.current) {
        setRows((current) => [...batch.reverse(), ...current].slice(0, MaxRows));
      }
    }, FlushMs);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Live feed</h1>
          <p className="text-sm text-text-muted">Placements, settlements and payouts as they happen, since this page opened.</p>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          {paused ? 'Resume list' : 'Pause list'}
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Placed" value={totals.placed.toLocaleString('en-ZA')} />
        <Stat label="Rejected" value={totals.rejected.toLocaleString('en-ZA')} />
        <Stat label="Settled" value={totals.settled.toLocaleString('en-ZA')} />
        <Stat label="Paid out" value={formatMoney({ minorUnits: totals.paidMinor, currency: 'ZAR' })} />
      </dl>

      {rows.length === 0 ? (
        <EmptyState title="Waiting for activity">Place a bet from the app or run the load generator to see it here.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Most recent {MaxRows} events</caption>
            <thead className="bg-surface-sunken text-text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Time</th>
                <th scope="col" className="px-3 py-2 font-medium">Event</th>
                <th scope="col" className="px-3 py-2 font-medium">Coupon</th>
                <th scope="col" className="px-3 py-2 font-medium">Detail</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono tabular-nums text-text-muted">{formatTime(row.at)}</td>
                  <td className={clsx('px-3 py-1.5 font-medium', typeTone[row.type])}>{typeLabel[row.type]}</td>
                  <td className="px-3 py-1.5 font-mono" title={row.couponId}>{shortId(row.couponId)}</td>
                  <td className="px-3 py-1.5 text-text-muted">{row.detail}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                    {row.amountMinor ? formatMoney({ minorUnits: row.amountMinor, currency: row.currency }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
