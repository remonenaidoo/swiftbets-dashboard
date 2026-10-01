import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';
import { ApiError } from '../../../shared/lib/apiError';

export interface WithdrawalView {
  withdrawalId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  requiresApproval: boolean;
  decidedBy: string | null;
  reason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DriftView {
  kind: number | string;
  reference: string;
  providerAmount: number | null;
  ledgerAmount: number | null;
  currency: string;
  detail: string;
}

export interface ReconciliationRun {
  runId: string;
  provider: string;
  day: string;
  completedAt: string;
  drifts: DriftView[];
}

export const providers = ['simulator', 'paystack'] as const;

const queueKey = ['payments', 'withdrawals', 'awaitingApproval'] as const;
const runKey = (provider: string) => ['payments', 'reconciliation', provider] as const;

export function useApprovalQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: () => apiRequest<WithdrawalView[]>('/admin/payments/withdrawals?status=awaitingApproval'),
    refetchInterval: 30_000,
  });
}

export function useDecideWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ withdrawalId, approve, reason }: { withdrawalId: string; approve: boolean; reason?: string }) =>
      approve
        ? apiRequest<WithdrawalView>(`/admin/payments/withdrawals/${withdrawalId}/approve`, { method: 'POST' })
        : apiRequest<WithdrawalView>(`/admin/payments/withdrawals/${withdrawalId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queueKey }),
  });
}

/** The latest daily run for a provider, or null before the first one. */
export function useLatestRun(provider: string) {
  return useQuery({
    queryKey: runKey(provider),
    queryFn: async () => {
      try {
        return await apiRequest<ReconciliationRun>(`/admin/payments/reconciliation/${provider}/latest`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });
}

export function useRunReconciliation(provider: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<ReconciliationRun>(`/admin/payments/reconciliation/${provider}/run`, { method: 'POST' }),
    onSuccess: (run) => queryClient.setQueryData(runKey(provider), run),
  });
}

const driftNames: Record<string, string> = {
  '1': 'Missing in our ledger',
  missingInLedger: 'Missing in our ledger',
  '2': 'Missing at the provider',
  missingAtProvider: 'Missing at the provider',
  '3': 'Amounts differ',
  amountMismatch: 'Amounts differ',
};

export const driftLabel = (kind: number | string) => driftNames[String(kind)] ?? String(kind);
