import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export interface DayFigures {
  day: string;
  coupons: number;
  sportsTurnover: number;
  sportsPayouts: number;
  sportsGgr: number;
  casinoTransactions: number;
  casinoStaked: number;
  casinoReturned: number;
  casinoGgr: number;
  ggr: number;
}

export interface ReconciliationRun {
  runId: string;
  day: string;
  matched: boolean;
  mismatches: { figure: string; warehouse: number; ledger: number }[];
  ranAt: string;
}

export function useDaily(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'daily', from, to],
    queryFn: () => apiRequest<DayFigures[]>(`/admin/reports/daily?from=${from}&to=${to}`),
  });
}

export function useReconciliations() {
  return useQuery({
    queryKey: ['reports', 'reconciliations'],
    queryFn: () => apiRequest<ReconciliationRun[]>('/admin/reports/reconciliations?limit=10'),
  });
}

export function useReconcile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (day: string) =>
      apiRequest<ReconciliationRun>(`/admin/reports/reconciliations/${day}`, {
        method: 'POST',
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}
