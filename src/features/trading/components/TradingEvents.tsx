import { useState } from 'react';
import { formatTime } from '../../../shared/lib/format';
import { useDeltas } from '../../../shared/realtime/useLive';

interface StatusChange {
  fixtureId: string;
  marketId: string;
  status: string;
  source: string;
  operatorId: string | null;
  changedAt: string;
}

interface Rejection {
  manualResultId: string;
  couponId: string;
  code: string;
  message: string;
  rejectedAt: string;
}

type TradingEvent = { kind: 'status'; at: string; change: StatusChange } | { kind: 'rejected'; at: string; rejection: Rejection };

const rejectionText: Record<string, string> = { coupon_cashed_out: 'coupon cashed out - its settlement is final' };

/** Live trading log: suspensions and resumes, and every manual result settlement refused, with why. */
export function TradingEvents() {
  const [events, setEvents] = useState<TradingEvent[]>([]);
  const add = (event: TradingEvent) => setEvents((current) => [event, ...current].slice(0, 50));

  useDeltas(['market-status-changed', 'manual-result-rejected'], (delta) => {
    if (delta.type === 'market-status-changed') {
      const change = delta.payload as StatusChange;
      add({ kind: 'status', at: change.changedAt, change });
    } else {
      const rejection = delta.payload as Rejection;
      add({ kind: 'rejected', at: rejection.rejectedAt, rejection });
    }
  });

  return (
    <section aria-labelledby="events-title" className="space-y-2 rounded-md border border-border p-4 text-sm">
      <h2 id="events-title" className="text-lg font-semibold">
        Trading log
      </h2>
      {events.length === 0 ? <p className="text-text-muted">Suspensions and rejected results appear here live.</p> : null}
      <ol className="space-y-1" aria-live="polite">
        {events.map((e, i) =>
          e.kind === 'status' ? (
            <li key={`${e.at}-${i}`}>
              <span className="font-mono text-xs text-text-muted">{formatTime(e.at)}</span> {e.change.marketId} {e.change.status} ({e.change.source})
            </li>
          ) : (
            <li key={`${e.at}-${i}`} className="font-semibold text-negative">
              <span className="font-mono text-xs">{formatTime(e.at)}</span> Rejected for coupon {e.rejection.couponId.slice(0, 8)}: {rejectionText[e.rejection.code] ?? e.rejection.message}
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
