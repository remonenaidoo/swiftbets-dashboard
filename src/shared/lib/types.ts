/** Shapes of the Steward API and the realtime deltas, as the dashboard reads them. */

export type IncidentKind =
  | 'stuckCoupon'
  | 'walletOutage'
  | 'poisonMessage'
  | 'duplicateSettlement'
  | 'paymentDrift'
  | 'ledgerDrift'
  | 'paymentsDegraded'
  | 'notificationsDegraded'
  | 'providerDrift';
export type IncidentStatus = 'open' | 'diagnosing' | 'awaitingApproval' | 'diagnosisFailed' | 'resolved';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';

export interface Incident {
  incidentId: string;
  kind: IncidentKind;
  subject: string;
  summary: string;
  status: IncidentStatus;
  openedAt: string;
}

export interface EvidenceItem {
  toolCallId: string;
  claim: string;
  excerpt: string;
}

export interface IncidentReport {
  summary: string;
  severity: string;
  rootCause: string;
  hypothesis: string;
  confidence: number;
  evidence: EvidenceItem[];
  runbookCitations: { runbookId: string; section: string }[];
  proposedActions: { type: string; target: string; rationale: string }[];
}

export interface ToolCall {
  toolCallId: string;
  name: string;
  inputJson: string;
  outputJson: string;
}

export interface RemediationAction {
  actionId: string;
  incidentId: string;
  type: string;
  target: string;
  rationale: string;
  status: ActionStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  outcome: string | null;
}

export interface IncidentDetails {
  incident: Incident;
  report?: IncidentReport | null;
  reportProblems: string[];
  toolCalls: ToolCall[];
  actions: RemediationAction[];
}

export interface Money {
  minorUnits: number;
  currency: string;
}

export interface LiveDelta<T = unknown> {
  group: string;
  sequence: number;
  type: string;
  occurredAt: string;
  payload: T;
}

export interface SessionInfo {
  subject: string;
  roles: string[];
  /** Staff permissions from the token; the console hides what is missing, the services refuse it. */
  permissions?: string[];
  expiresAt: string;
}

/** Event payloads pushed by realtime; mirrors @swiftbets/contracts (generated from the C# contracts). */
export interface CouponPlaced {
  couponId: string;
  punterId: string;
  betType: 'single' | 'accumulator';
  stake: Money;
  totalOdds: number;
  potentialPayout: Money;
  legs: { legId: string; fixtureId: string; marketId: string; selectionId: string; odds: number }[];
  placedAt: string;
}

export interface CouponSettled {
  couponId: string;
  punterId: string;
  settlementVersion: number;
  outcome: 'won' | 'lost' | 'void' | 'cashedOut';
  stake: Money;
  targetPayout: Money;
  settledAt: string;
}

export interface PayoutCompleted {
  couponId: string;
  punterId: string;
  settlementVersion: number;
  delta: Money;
  paidToDate: Money;
  completedAt: string;
}

export interface CouponRejected {
  couponId: string;
  punterId: string;
  reasonCode: string;
  rejectedAt: string;
}

export interface StuckCoupon {
  couponId: string;
  reason: string;
  evaluatedLegs: number;
  legCount: number;
  repaired: boolean;
  detectedAt: string;
}

export interface PayoutAttempt {
  couponId: string;
  punterId: string;
  step: string;
  attempt: number;
  lastError: string | null;
  targetPayout: Money;
}

export interface IncidentRaised {
  incidentId: string;
  kind: IncidentKind;
  subject: string;
  summary: string;
  openedAt: string;
}

export interface IncidentUpdated {
  incidentId: string;
  kind: IncidentKind;
  subject: string;
  status: IncidentStatus;
  rootCause: string | null;
  updatedAt: string;
}

export interface RemediationExecuted {
  incidentId: string;
  actionId: string;
  actionType: string;
  target: string;
  succeeded: boolean;
  outcome: string;
  decidedBy: string;
  executedAt: string;
}
