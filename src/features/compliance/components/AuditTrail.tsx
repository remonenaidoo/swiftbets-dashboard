import { ApiError } from '../../../shared/lib/apiError';
import { useCustomerAudit, useVerifyChain } from '../api/compliance';

const when = (iso: string) => new Date(iso).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Africa/Johannesburg' });

/** The customer's audit trail, newest first, with a check of the whole hash chain. */
export function AuditTrail({ userId }: { userId: string }) {
  const audit = useCustomerAudit(userId);
  const verify = useVerifyChain();
  if (audit.error instanceof ApiError && audit.error.status === 403) {
    return <p className="text-sm text-text-muted">Your role cannot read the audit trail.</p>;
  }

  return (
    <section aria-labelledby="audit-title" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 id="audit-title" className="text-lg font-semibold">
          Audit trail
        </h2>
        <button
          type="button"
          onClick={() => verify.mutate()}
          disabled={verify.isPending}
          className="rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          Verify chain
        </button>
      </div>
      {verify.data ? (
        <p role="status" className={verify.data.verified ? 'text-sm text-positive' : 'text-sm text-negative'}>
          {verify.data.verified ? `Chain verified: ${verify.data.entries} entries intact.` : `Chain broken at entry ${verify.data.brokenAt}.`}
        </p>
      ) : null}
      {audit.data && audit.data.length === 0 ? <p className="text-sm text-text-muted">Nothing recorded yet.</p> : null}
      {audit.data && audit.data.length > 0 ? (
        <table className="w-full text-left text-sm">
          <thead className="text-text-muted">
            <tr>
              <th scope="col">When</th>
              <th scope="col">Service</th>
              <th scope="col">Action</th>
              <th scope="col">By</th>
            </tr>
          </thead>
          <tbody>
            {audit.data.map((e) => (
              <tr key={e.auditId} className="border-t border-border">
                <td>{when(e.occurredAt)}</td>
                <td>{e.service}</td>
                <td className="font-mono">{e.action}</td>
                <td>{e.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
