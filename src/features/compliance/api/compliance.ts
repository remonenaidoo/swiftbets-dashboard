import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  id: string;
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

export interface LiftRequest {
  requestId: string;
  userId: string;
  restrictionId: string;
  requestedBy: string;
  reason: string;
  requestedAt: string;
}

export interface Note {
  noteId: string;
  author: string;
  body: string;
  createdAt: string;
}

const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export function useLiftRequests(userId: string) {
  return useQuery({ queryKey: ['lifts', userId], queryFn: () => apiRequest<LiftRequest[]>(`/admin/users/${userId}/lift-requests`), retry: false });
}

export function useNotes(userId: string) {
  return useQuery({ queryKey: ['notes', userId], queryFn: () => apiRequest<Note[]>(`/admin/users/${userId}/notes`), retry: false });
}

/** Every case action changes what the card shows, including the audit trail. */
function useCaseMutation<TArgs>(userId: string, request: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      Promise.all(
        [['compliance', userId], ['lifts', userId], ['notes', userId], ['audit', 'user', userId]].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export const useAddRestriction = (userId: string) =>
  useCaseMutation(userId, ({ kind, reason }: { kind: string; reason: string }) => apiRequest(`/admin/users/${userId}/restrictions`, json({ kind, reason })));

export const useRequestLift = (userId: string) =>
  useCaseMutation(userId, ({ restrictionId, reason }: { restrictionId: string; reason: string }) =>
    apiRequest(`/admin/users/${userId}/restrictions/${restrictionId}/lift`, json({ reason })));

export const useApproveLift = (userId: string) =>
  useCaseMutation(userId, (requestId: string) => apiRequest(`/admin/users/${userId}/lift-requests/${requestId}/approve`, { method: 'POST' }));

export const useAddNote = (userId: string) => useCaseMutation(userId, (body: string) => apiRequest(`/admin/users/${userId}/notes`, json({ body })));
