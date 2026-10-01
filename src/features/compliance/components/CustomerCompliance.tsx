import { ApiError } from '../../../shared/lib/apiError';
import { formatMoney, humanise } from '../../../shared/lib/format';
import { useCustomerCompliance } from '../api/compliance';

const when = (iso: string) => new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });

/** What compliance holds for one customer: limits with any pending change, active blocks and session settings. */
export function CustomerCompliance({ userId }: { userId: string }) {
  const compliance = useCustomerCompliance(userId);
  if (compliance.error instanceof ApiError && compliance.error.status === 403) {
    return <p className="text-sm text-text-muted">Your role cannot read responsible-gambling settings.</p>;
  }
  if (!compliance.data) return compliance.isPending ? <p className="text-sm text-text-muted">Loading responsible-gambling settings…</p> : null;

  const { limits, restrictions, sessionLimitMinutes, realityCheckMinutes, kycStatus, excluded } = compliance.data;
  return (
    <section aria-labelledby="rg-title" className="space-y-2">
      <h2 id="rg-title" className="text-lg font-semibold">
        Responsible gambling {excluded ? <span className="text-sm text-negative">(excluded)</span> : null}
      </h2>
      {limits.length === 0 ? (
        <p className="text-sm text-text-muted">No limits set.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {limits.map((l) => (
            <li key={`${l.kind}-${l.period}`}>
              {humanise(l.kind)} per {l.period}: {formatMoney({ minorUnits: l.amount, currency: l.currency })}
              {l.pendingEffectiveAt ? (
                <span className="text-text-muted">
                  {' '}
                  — {l.pendingRemoval ? 'ends' : `rises to ${formatMoney({ minorUnits: l.pendingAmount ?? 0, currency: l.currency })}`} {when(l.pendingEffectiveAt)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {restrictions.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {restrictions.map((r) => (
            <li key={`${r.kind}-${r.startsAt}`}>
              {humanise(r.kind)} from {when(r.startsAt)} {r.endsAt ? `until ${when(r.endsAt)}` : 'until lifted'} · {r.reason}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm text-text-muted">
        Session limit {sessionLimitMinutes ? `${sessionLimitMinutes} min` : 'none'} · reality check {realityCheckMinutes ? `every ${realityCheckMinutes} min` : 'off'} · KYC {humanise(kycStatus)}
      </p>
    </section>
  );
}
