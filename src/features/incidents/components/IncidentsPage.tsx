import clsx from 'clsx';
import { NavLink, useParams } from 'react-router';
import { formatTime, humanise, shortId } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { useIncidents } from '../api/incidents';
import { IncidentDetail } from './IncidentDetail';
import { StatusBadge } from './StatusBadge';

export function IncidentsPage() {
  const { incidentId } = useParams();
  const incidents = useIncidents();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Incidents</h1>
        <p className="text-sm text-text-muted">What Steward detected, its evidence-checked diagnosis, and the remediations waiting for you.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
        <section aria-labelledby="incident-list-heading" className={clsx(incidentId && 'order-2 lg:order-none')}>
          <h2 id="incident-list-heading" className="sr-only">
            Incident list
          </h2>
          {incidents.isPending ? (
            <p className="text-text-muted">Loading incidents…</p>
          ) : incidents.isError ? (
            <p role="alert" className="text-negative">
              Could not load incidents.
            </p>
          ) : incidents.data.length === 0 ? (
            <EmptyState title="No incidents">Run a drill from Fault injection to see Steward at work.</EmptyState>
          ) : (
            <ul className="space-y-2 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
              {incidents.data.map((incident) => (
                <li key={incident.incidentId}>
                  <NavLink
                    to={`/incidents/${incident.incidentId}`}
                    className={({ isActive }) =>
                      clsx(
                        'block rounded-lg border p-3 focus-visible:outline-2 focus-visible:outline-accent',
                        isActive ? 'border-accent bg-surface-raised' : 'border-border hover:bg-surface-raised',
                      )
                    }
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{humanise(incident.kind)}</span>
                      <StatusBadge status={incident.status} />
                    </span>
                    <span className="mt-1 block truncate font-mono text-xs text-text-muted" title={incident.subject}>
                      {shortId(incident.subject)} · {formatTime(incident.openedAt)}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-label="Incident detail" className="min-w-0 lg:sticky lg:top-(--spacing-gutter)">
          {incidentId ? <IncidentDetail incidentId={incidentId} /> : <EmptyState title="Select an incident">Its report, evidence and actions appear here.</EmptyState>}
        </section>
      </div>
    </div>
  );
}
