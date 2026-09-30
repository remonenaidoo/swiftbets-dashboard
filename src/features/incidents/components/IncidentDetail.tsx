import { ApiError } from '../../../shared/lib/apiError';
import { formatTime, humanise } from '../../../shared/lib/format';
import type { RemediationAction, ToolCall } from '../../../shared/lib/types';
import { useDecideAction, useIncident } from '../api/incidents';
import { StatusBadge } from './StatusBadge';

export function IncidentDetail({ incidentId }: { incidentId: string }) {
  const details = useIncident(incidentId);

  if (details.isPending) {
    return <p className="text-text-muted">Loading incident…</p>;
  }
  if (details.isError) {
    return (
      <p role="alert" className="text-negative">
        {details.error instanceof ApiError && details.error.status === 404 ? 'This incident does not exist.' : 'Could not load the incident.'}
      </p>
    );
  }

  const { incident, report, reportProblems, toolCalls, actions } = details.data;
  const calls = new Map(toolCalls.map((call) => [call.toolCallId, call]));

  return (
    <article className="space-y-6 rounded-lg border border-border bg-surface-raised p-5" aria-labelledby="incident-title">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="incident-title" className="text-lg font-semibold">
            {humanise(incident.kind)}
          </h2>
          <StatusBadge status={incident.status} />
        </div>
        <p className="text-sm text-text-muted">
          Opened {formatTime(incident.openedAt)} · <span className="font-mono break-all">{incident.subject}</span>
        </p>
        <p>{incident.summary}</p>
      </header>

      {report ? (
        <section aria-labelledby="diagnosis-heading" className="space-y-3">
          <h3 id="diagnosis-heading" className="font-semibold">
            Diagnosis <span className="text-sm font-normal text-text-muted">· {report.severity} · confidence {Math.round(report.confidence * 100)}%</span>
          </h3>
          <p>{report.summary}</p>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-text-muted">Root cause</dt>
              <dd>{report.rootCause}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Hypothesis</dt>
              <dd>{report.hypothesis}</dd>
            </div>
          </dl>
          <h4 className="text-sm font-semibold">Evidence</h4>
          <ul className="space-y-2">
            {report.evidence.map((item, index) => (
              <li key={index} className="rounded-md border border-border p-3 text-sm">
                <p>{item.claim}</p>
                <p className="mt-1 text-xs text-text-muted">
                  from {calls.get(item.toolCallId)?.name ?? item.toolCallId}
                </p>
                <code className="mt-2 block overflow-x-auto rounded bg-surface-sunken p-2 font-mono text-xs">{item.excerpt}</code>
              </li>
            ))}
          </ul>
          {report.runbookCitations.length > 0 ? (
            <p className="text-sm text-text-muted">
              Runbooks: {report.runbookCitations.map((c) => `${c.runbookId} § ${c.section}`).join(', ')}
            </p>
          ) : null}
        </section>
      ) : reportProblems.length > 0 ? (
        <section aria-labelledby="no-diagnosis-heading" className="rounded-md border border-negative/60 p-3 text-sm">
          <h3 id="no-diagnosis-heading" className="font-semibold text-negative">
            No accepted diagnosis
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {reportProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-text-muted">Steward is diagnosing…</p>
      )}

      {actions.length > 0 ? (
        <section aria-labelledby="actions-heading" className="space-y-3">
          <h3 id="actions-heading" className="font-semibold">
            Proposed remediation
          </h3>
          <ul className="space-y-3">
            {actions.map((action) => (
              <ActionCard key={action.actionId} action={action} />
            ))}
          </ul>
        </section>
      ) : null}

      {toolCalls.length > 0 ? (
        <section aria-labelledby="tools-heading">
          <h3 id="tools-heading" className="font-semibold">
            Tool calls ({toolCalls.length})
          </h3>
          <ol className="mt-2 space-y-2">
            {toolCalls.map((call) => (
              <ToolCallItem key={call.toolCallId} call={call} />
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}

function ActionCard({ action }: { action: RemediationAction }) {
  const decide = useDecideAction();
  const busy = decide.isPending;
  const failure =
    decide.error instanceof ApiError ? decide.error.message : decide.error ? 'Request failed.' : null;

  return (
    <li className="rounded-md border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-medium">{humanise(action.type)}</span> <span className="font-mono break-all text-text-muted">{action.target}</span>
        </p>
        <StatusBadge status={action.status} />
      </div>
      <p className="mt-1 text-text-muted">{action.rationale}</p>
      {action.outcome ? <p className="mt-1 font-mono text-xs break-all">{action.outcome}</p> : null}
      {action.status === 'pending' ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide.mutate({ actionId: action.actionId, decision: 'approve' })}
            className="rounded-md bg-accent-strong px-3 py-1.5 font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide.mutate({ actionId: action.actionId, decision: 'reject' })}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : null}
      {failure ? (
        <p role="alert" className="mt-2 text-negative">
          {failure}
        </p>
      ) : null}
    </li>
  );
}

function ToolCallItem({ call }: { call: ToolCall }) {
  return (
    <li>
      <details className="rounded-md border border-border p-2 text-sm">
        <summary className="cursor-pointer font-mono focus-visible:outline-2 focus-visible:outline-accent">
          {call.name} <span className="text-text-muted">{call.inputJson}</span>
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-surface-sunken p-2 font-mono text-xs whitespace-pre-wrap break-all">{call.outputJson}</pre>
      </details>
    </li>
  );
}
