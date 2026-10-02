import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export interface FreeSpinGrant {
  grantId: string;
  punterId: string;
  gameId: string;
  granted: number;
  remaining: number;
  expiresAt: string;
}

export interface LobbyGame {
  gameId: string;
  name: string;
}

export function useFreeSpins(punterId: string | null) {
  return useQuery({
    queryKey: ['casino', 'free-spins', punterId],
    queryFn: () => apiRequest<FreeSpinGrant[]>(`/admin/casino/free-spins?punterId=${encodeURIComponent(punterId ?? '')}`),
    enabled: punterId !== null,
  });
}

/** Game names for the grant form, from the casino catalogue's lobby. */
export function useGames() {
  return useQuery({
    queryKey: ['casino', 'lobby'],
    queryFn: async () => (await apiRequest<{ categories: { games: LobbyGame[] }[] }>('/casino/lobby')).categories.flatMap((c) => c.games),
    staleTime: 60_000,
  });
}

export function useGrantFreeSpins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grant: { punterId: string; gameId: string; spins: number; expiresAt: string }) =>
      apiRequest<FreeSpinGrant>('/admin/casino/free-spins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(grant) }),
    onSuccess: (grant) => queryClient.invalidateQueries({ queryKey: ['casino', 'free-spins', grant.punterId] }),
  });
}

export interface ReconciliationRun {
  runId: string;
  providerId: string;
  businessDate: string;
  ourNet: number;
  providerNet: number;
  drift: number;
  missingOnOurSide: number;
  missingOnProviderSide: number;
  status: 'matched' | 'drift';
  currency: string;
  reconciledAt: string;
}

export function useReconciliations(providerId: string) {
  return useQuery({
    queryKey: ['casino', 'reconciliation', providerId],
    queryFn: () => apiRequest<ReconciliationRun[]>(`/admin/casino/reconciliation?providerId=${encodeURIComponent(providerId)}&limit=14`),
  });
}

export function useReconcile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, date }: { providerId: string; date: string }) =>
      apiRequest<ReconciliationRun>(`/admin/casino/reconciliation/${encodeURIComponent(providerId)}/${date}`, { method: 'POST' }),
    onSuccess: (run) => queryClient.invalidateQueries({ queryKey: ['casino', 'reconciliation', run.providerId] }),
  });
}
