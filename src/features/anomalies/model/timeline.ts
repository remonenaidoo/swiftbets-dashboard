import { humanise } from '../../../shared/lib/format';
import type { Incident, IncidentRaised, IncidentUpdated, LiveDelta, PayoutAttempt, RemediationExecuted, StuckCoupon } from '../../../shared/lib/types';

export const anomalyTypes = ['stuck-coupon', 'payout-dead-lettered', 'incident-raised', 'incident-updated', 'remediation-executed'] as const;

export type Severity = 'info' | 'warning' | 'critical' | 'resolved';

export interface TimelineEntry {
  key: string;
  at: string;
  severity: Severity;
  title: string;
  detail: string;
  incidentId?: string;
}

export function fromDelta(delta: LiveDelta): TimelineEntry | null {
  const key = `${delta.group}:${delta.sequence}`;
  switch (delta.type) {
    case 'stuck-coupon': {
      const p = delta.payload as StuckCoupon;
      return { key, at: p.detectedAt, severity: p.repaired ? 'warning' : 'critical', title: `Stuck coupon${p.repaired ? ' (repaired)' : ''}`, detail: `${p.couponId} · ${p.reason} · ${p.evaluatedLegs}/${p.legCount} legs` };
    }
    case 'payout-dead-lettered': {
      const p = delta.payload as PayoutAttempt;
      return { key, at: delta.occurredAt, severity: 'critical', title: 'Payout dead-lettered', detail: `${p.couponId} · step ${p.step} · attempt ${p.attempt}${p.lastError ? ` · ${p.lastError}` : ''}` };
    }
    case 'incident-raised': {
      const p = delta.payload as IncidentRaised;
      return { key, at: p.openedAt, severity: 'critical', title: `Incident: ${humanise(p.kind)}`, detail: p.summary, incidentId: p.incidentId };
    }
    case 'incident-updated': {
      const p = delta.payload as IncidentUpdated;
      return {
        key,
        at: p.updatedAt,
        severity: p.status === 'resolved' ? 'resolved' : p.status === 'diagnosisFailed' ? 'warning' : 'info',
        title: `${humanise(p.kind)} → ${humanise(p.status)}`,
        detail: p.rootCause ?? p.subject,
        incidentId: p.incidentId,
      };
    }
    case 'remediation-executed': {
      const p = delta.payload as RemediationExecuted;
      return { key, at: p.executedAt, severity: p.succeeded ? 'resolved' : 'critical', title: `${humanise(p.actionType)} ${p.succeeded ? 'succeeded' : 'failed'}`, detail: `${p.target} · approved by ${p.decidedBy}`, incidentId: p.incidentId };
    }
    default:
      return null;
  }
}

export function fromIncident(incident: Incident): TimelineEntry {
  return {
    key: `incident:${incident.incidentId}`,
    at: incident.openedAt,
    severity: incident.status === 'resolved' ? 'resolved' : 'critical',
    title: `Incident: ${humanise(incident.kind)}`,
    detail: incident.summary,
    incidentId: incident.incidentId,
  };
}

/** Newest first; a live entry and the stored incident it describes are not shown twice. */
export function mergeTimeline(live: TimelineEntry[], incidents: Incident[]): TimelineEntry[] {
  const liveRaised = new Set(live.filter((e) => e.title.startsWith('Incident:')).map((e) => e.incidentId));
  const stored = incidents.filter((i) => !liveRaised.has(i.incidentId)).map(fromIncident);
  return [...live, ...stored].sort((a, b) => b.at.localeCompare(a.at));
}
