import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { actions, scopes, useIssueManualResult, type Action, type Fixture, type Scope } from '../api/trading';

const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';
const actionLabels: Record<Action, string> = { settle: 'Settle', void: 'Void', override: 'Override', timeVoid: 'Void bets placed after' };
const refusals: Record<string, string> = {
  reason_required: 'Give a reason for the result.',
  scope_incomplete: 'A market result needs a market; a coupon result needs a coupon id.',
  winner_invalid: 'Settle and override need a winning selection on the market; void needs none.',
  void_from_invalid: 'Give a cut-off time in the past.',
  market_not_found: 'That fixture or market is not on offer.',
};

/** A trader's manual result. Settlement applies it above any feed result and rejects it for a cashed-out coupon. */
export function ManualResultForm({ fixture }: { fixture: Fixture | null }) {
  const issue = useIssueManualResult();
  const [scope, setScope] = useState<Scope>('market');
  const [action, setAction] = useState<Action>('void');
  const [marketId, setMarketId] = useState('');
  const [couponId, setCouponId] = useState('');
  const [winner, setWinner] = useState('');
  const [voidFrom, setVoidFrom] = useState('');
  const [reason, setReason] = useState('');
  const market = fixture?.markets.find((m) => m.marketId === marketId) ?? fixture?.markets[0];
  const needsWinner = action === 'settle' || action === 'override';
  const error = issue.error instanceof ApiError ? (refusals[issue.error.code] ?? issue.error.message) : issue.error ? 'That did not work. Try again.' : null;

  if (!fixture) {
    return (
      <section aria-labelledby="manual-title" className="rounded-md border border-border p-4 text-sm">
        <h2 id="manual-title" className="text-lg font-semibold">
          Manual result
        </h2>
        <p className="mt-1 text-text-muted">Choose a fixture to result it by hand.</p>
      </section>
    );
  }

  const submit = () =>
    issue.mutate({
      scope,
      action,
      fixtureId: fixture.fixtureId,
      marketId: scope === 'market' ? (market?.marketId ?? null) : null,
      couponId: scope === 'coupon' ? couponId.trim() : null,
      winningSelectionId: needsWinner ? winner || null : null,
      reason: reason.trim(),
      voidFrom: action === 'timeVoid' && voidFrom ? new Date(voidFrom).toISOString() : null,
    });

  return (
    <section aria-labelledby="manual-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
      <h2 id="manual-title" className="text-lg font-semibold">
        Manual result: {fixture.homeTeam} v {fixture.awayTeam}
      </h2>
      <label className="block text-text-muted">
        Scope
        <select className={field} value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
          {scopes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {scope === 'market' ? (
        <label className="block text-text-muted">
          Market
          <select className={field} value={market?.marketId ?? ''} onChange={(e) => setMarketId(e.target.value)}>
            {fixture.markets.map((m) => (
              <option key={m.marketId} value={m.marketId}>
                {m.marketId}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {scope === 'coupon' ? (
        <label className="block text-text-muted">
          Coupon id
          <input className={field} value={couponId} onChange={(e) => setCouponId(e.target.value)} />
        </label>
      ) : null}
      <label className="block text-text-muted">
        Action
        <select className={field} value={action} onChange={(e) => setAction(e.target.value as Action)}>
          {actions.map((a) => (
            <option key={a} value={a}>
              {actionLabels[a]}
            </option>
          ))}
        </select>
      </label>
      {needsWinner ? (
        <label className="block text-text-muted">
          Winning selection
          <select className={field} value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="">Choose…</option>
            {(market ?? fixture.markets[0])?.selections.map((s) => (
              <option key={s.selectionId} value={s.selectionId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {action === 'timeVoid' ? (
        <label className="block text-text-muted">
          Void bets placed at or after
          <input type="datetime-local" className={field} value={voidFrom} onChange={(e) => setVoidFrom(e.target.value)} />
        </label>
      ) : null}
      <label className="block text-text-muted">
        Reason
        <input className={field} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} />
      </label>
      {error ? (
        <p role="alert" className="text-negative">
          {error}
        </p>
      ) : null}
      {issue.isSuccess ? <p role="status" className="text-positive">Result issued. Settlement applies it within seconds.</p> : null}
      <button type="button" className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={!reason.trim() || issue.isPending} onClick={submit}>
        Issue result
      </button>
    </section>
  );
}
