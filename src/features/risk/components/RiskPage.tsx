import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatMoney, formatTime, shortId } from '../../../shared/lib/format';
import { useDeltas, useLiveInvalidation } from '../../../shared/realtime/useLive';
import { feedTypes, toFeedRow, type FeedRow } from '../../live-feed/model/feed';
import { useTradingFixtures } from '../../trading/api/trading';
import { fixturesKey, useFixtureRisk, useRiskAlerts, useSetCap } from '../api/risk';
import { applyLiability, type FixtureRisk, type LiabilityChanged } from '../model/liability';

/** The service default cap, used for a fixture first seen on the live stream before the API has listed it. */
const defaultCapMinor = 100_000_000;
const rand = (minorUnits: number) => formatMoney({ minorUnits, currency: 'ZAR' });
const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';

/** Trader view: open liability per fixture updating live, exposure caps, pattern alerts and the latest bets. */
export function RiskPage() {
  const queryClient = useQueryClient();
  const fixtures = useFixtureRisk();
  const alerts = useRiskAlerts();
  const offer = useTradingFixtures();
  const names = new Map((offer.data ?? []).map((f) => [f.fixtureId, `${f.homeTeam} v ${f.awayTeam}`]));
  const [bets, setBets] = useState<FeedRow[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  useDeltas(['liability-changed'], (delta) =>
    queryClient.setQueryData<FixtureRisk[]>(fixturesKey, (rows) => applyLiability(rows ?? [], delta.payload as LiabilityChanged, defaultCapMinor)),
  );
  useLiveInvalidation(['risk-alert'], ['risk', 'alerts']);
  useDeltas(feedTypes, (delta) => {
    const row = toFeedRow(delta);
    if (row?.type === 'coupon-placed') setBets((current) => [row, ...current].slice(0, 12));
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Risk</h1>
      <section aria-labelledby="liability-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
        <h2 id="liability-title" className="text-lg font-semibold">
          Liability by fixture
        </h2>
        {fixtures.isSuccess && fixtures.data.length === 0 ? <p className="text-text-muted">No open liability yet.</p> : null}
        <table className="w-full text-left">
          <thead className="text-text-muted">
            <tr>
              <th className="py-1">Fixture</th>
              <th>Worst case</th>
              <th>Biggest outcome</th>
              <th>Cap</th>
              <th>State</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {fixtures.data?.map((f) => (
              <FixtureRow key={f.fixtureId} fixture={f} name={names.get(f.fixtureId)} editing={editing === f.fixtureId} onEdit={() => setEditing(editing === f.fixtureId ? null : f.fixtureId)} />
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="alerts-title" className="space-y-2 rounded-md border border-border p-4 text-sm">
          <h2 id="alerts-title" className="text-lg font-semibold">
            Alerts
          </h2>
          {alerts.isSuccess && alerts.data.length === 0 ? <p className="text-text-muted">No betting patterns flagged.</p> : null}
          <ul className="space-y-2">
            {alerts.data?.map((a) => (
              <li key={a.alertId} className="rounded-md bg-surface-raised p-2">
                <p className="font-semibold">
                  {a.kind === 'repeatedBet' ? 'Repeated bet' : 'Correlated stake'} · {names.get(a.fixtureId) ?? a.fixtureId}
                  {a.selectionId ? ` · ${a.selectionId}` : ''} · {rand(a.totalStakeMinor)}
                </p>
                <p className="text-text-muted">
                  {a.summary} {formatTime(a.raisedAt)} · customers {a.punterIds.map(shortId).join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="bets-title" className="space-y-2 rounded-md border border-border p-4 text-sm">
          <h2 id="bets-title" className="text-lg font-semibold">
            Latest bets
          </h2>
          {bets.length === 0 ? <p className="text-text-muted">Bets appear here as they are placed.</p> : null}
          <ul className="space-y-1">
            {bets.map((b) => (
              <li key={b.key} className="flex justify-between gap-2">
                <span>
                  {formatTime(b.at)} · {shortId(b.couponId)} · {b.detail}
                </span>
                <span>{formatMoney({ minorUnits: b.amountMinor, currency: b.currency })}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function FixtureRow({ fixture, name, editing, onEdit }: { fixture: FixtureRisk; name: string | undefined; editing: boolean; onEdit: () => void }) {
  const top = fixture.outcomes[0];
  return (
    <>
      <tr className="border-t border-border">
        <td className="py-1">
          <span className="font-medium">{name ?? fixture.fixtureId}</span>
          {name ? <span className="block text-xs text-text-muted">{fixture.fixtureId}</span> : null}
        </td>
        <td>{rand(fixture.worstCaseMinor)}</td>
        <td>{top ? `${top.selectionId} · ${top.coupons} coupon${top.coupons === 1 ? '' : 's'}` : '-'}</td>
        <td>
          {fixture.capMinor === 0 ? 'Suspended by trader' : rand(fixture.capMinor)}
          {fixture.capOverridden ? ' (set)' : ''}
        </td>
        <td className={fixture.suspended ? 'font-semibold text-negative' : 'text-positive'}>{fixture.suspended ? 'Suspended' : 'Open'}</td>
        <td>
          <button type="button" className="text-accent underline" onClick={onEdit} aria-expanded={editing}>
            Cap
          </button>
        </td>
      </tr>
      {editing ? (
        <tr>
          <td colSpan={6}>
            <CapForm fixtureId={fixture.fixtureId} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CapForm({ fixtureId }: { fixtureId: string }) {
  const setCap = useSetCap();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const rands = Number.parseFloat(amount);
  const valid = reason.trim().length > 0;
  const error = setCap.error instanceof ApiError ? setCap.error.message : setCap.error ? 'That did not work. Try again.' : null;
  const send = (capMinor: number | null) => setCap.mutate({ fixtureId, capMinor, reason: reason.trim() });

  return (
    <div className="grid gap-2 py-2 sm:grid-cols-[1fr_2fr_auto_auto_auto] sm:items-end">
      <label className="block text-text-muted">
        Cap (R)
        <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label className="block text-text-muted">
        Reason
        <input className={field} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <button type="button" className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={!valid || !(rands > 0) || setCap.isPending} onClick={() => send(Math.round(rands * 100))}>
        Set cap
      </button>
      <button type="button" className="rounded-md bg-negative px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={!valid || setCap.isPending} onClick={() => send(0)}>
        Suspend
      </button>
      <button type="button" className="rounded-md border border-border px-3 py-2 disabled:opacity-50" disabled={!valid || setCap.isPending} onClick={() => send(null)}>
        Default
      </button>
      {error ? (
        <p role="alert" className="text-negative sm:col-span-5">
          {error}
        </p>
      ) : null}
      {setCap.isSuccess ? (
        <p role="status" className="text-positive sm:col-span-5">
          {setCap.data.suspended ? `${fixtureId} is suspended.` : `${fixtureId} is open, capped at ${rand(setCap.data.capMinor)}.`}
        </p>
      ) : null}
    </div>
  );
}
