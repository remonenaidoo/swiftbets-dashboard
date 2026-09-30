import clsx from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router';
import { formatTime } from '../../../shared/lib/format';
import { useDeltas } from '../../../shared/realtime/useLive';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { useIncidents } from '../../incidents/api/incidents';
import { anomalyTypes, fromDelta, mergeTimeline, type Severity, type TimelineEntry } from '../model/timeline';

const dot: Record<Severity, string> = {
  info: 'bg-accent',
  warning: 'bg-warning',
  critical: 'bg-negative',
  resolved: 'bg-positive',
};

export function AnomaliesPage() {
  const [live, setLive] = useState<TimelineEntry[]>([]);
  const incidents = useIncidents();

  useDeltas(anomalyTypes, (delta) => {
    const entry = delta.group === 'ops' ? fromDelta(delta) : null;
    if (entry) {
      setLive((current) => [entry, ...current].slice(0, 200));
    }
  });

  const entries = mergeTimeline(live, incidents.data ?? []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Anomaly timeline</h1>
        <p className="text-sm text-text-muted">Stuck coupons, dead letters, incidents and remediations, newest first.</p>
      </header>
      {entries.length === 0 ? (
        <EmptyState title="All quiet">Nothing anomalous yet. Drills from Fault injection show up here within seconds.</EmptyState>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6" aria-label="Anomalies">
          {entries.map((entry) => (
            <li key={entry.key} className="relative">
              <span aria-hidden="true" className={clsx('absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full', dot[entry.severity])} />
              <p className="flex flex-wrap items-baseline gap-x-3">
                <time dateTime={entry.at} className="font-mono text-xs tabular-nums text-text-muted">
                  {formatTime(entry.at)}
                </time>
                {entry.incidentId ? (
                  <Link to={`/incidents/${entry.incidentId}`} className="font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent">
                    {entry.title}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.title}</span>
                )}
                <span className="sr-only">severity {entry.severity}</span>
              </p>
              <p className="mt-0.5 text-sm break-all text-text-muted">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
