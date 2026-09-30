import clsx from 'clsx';
import { humanise } from '../../../shared/lib/format';
import type { ActionStatus, IncidentStatus } from '../../../shared/lib/types';

const tone: Record<IncidentStatus | ActionStatus, string> = {
  open: 'border-warning text-warning',
  diagnosing: 'border-accent text-accent',
  awaitingApproval: 'border-warning text-warning',
  diagnosisFailed: 'border-negative text-negative',
  resolved: 'border-positive text-positive',
  pending: 'border-warning text-warning',
  approved: 'border-accent text-accent',
  rejected: 'border-text-muted text-text-muted',
  executed: 'border-positive text-positive',
  failed: 'border-negative text-negative',
};

export function StatusBadge({ status }: { status: IncidentStatus | ActionStatus }) {
  return <span className={clsx('inline-block rounded-full border px-2 py-0.5 text-xs font-medium', tone[status])}>{humanise(status)}</span>;
}
