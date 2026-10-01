import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export interface LimitView {
  kind: 'deposit' | 'stake' | 'loss';
  period: 'day' | 'week' | 'month';
  amount: number;
  currency: string;
  pendingAmount: number | null;
  pendingEffectiveAt: string | null;
  pendingRemoval: boolean;
}

export interface RestrictionView {
  kind: string;
  startsAt: string;
  endsAt: string | null;
  reason: string;
}

export interface ComplianceView {
  limits: LimitView[];
  restrictions: RestrictionView[];
  sessionLimitMinutes: number | null;
  realityCheckMinutes: number | null;
  kycStatus: string;
  excluded: boolean;
}

export interface AuditEntry {
  sequence: number;
  auditId: string;
  service: string;
  actor: string;
  action: string;
  subjectType: string;
  subjectId: string;
  before: string | null;
  after: string | null;
  correlationId: string;
  occurredAt: string;
  hash: string;
}

export interface ChainVerification {
  verified: boolean;
  entries: number;
  brokenAt: number | null;
}

export function useCustomerCompliance(userId: string) {
  return useQuery({
    queryKey: ['compliance', userId],
    queryFn: () => apiRequest<ComplianceView>(`/admin/users/${userId}/compliance`),
    retry: false,
  });
}

export function useCustomerAudit(userId: string) {
  return useQuery({
    queryKey: ['audit', 'user', userId],
    queryFn: () => apiRequest<AuditEntry[]>(`/admin/audit?subjectType=user&subjectId=${encodeURIComponent(userId)}&limit=50`),
    retry: false,
  });
}

export function useVerifyChain() {
  return useMutation({ mutationFn: () => apiRequest<ChainVerification>('/admin/audit/verify') });
}
