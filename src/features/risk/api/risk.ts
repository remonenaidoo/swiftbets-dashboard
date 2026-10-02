import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';
import { fromView, type FixtureRisk, type FixtureView } from '../model/liability';

export interface RiskAlert {
  alertId: string;
  kind: 'RepeatedBet' | 'CorrelatedStake';
  fixtureId: string;
  selectionId: string | null;
  punterIds: string[];
  couponIds: string[];
  totalStakeMinor: number;
  summary: string;
  raisedAt: string;
}

export const fixturesKey = ['risk', 'fixtures'] as const;

export function useFixtureRisk() {
  return useQuery({ queryKey: fixturesKey, queryFn: async () => (await apiRequest<FixtureView[]>('/admin/risk/fixtures?limit=200')).map(fromView) });
}

export function useRiskAlerts() {
  return useQuery({ queryKey: ['risk', 'alerts'], queryFn: () => apiRequest<RiskAlert[]>('/admin/risk/alerts?limit=50') });
}

/** A cap in minor units, 0 to suspend outright, or null for the default. */
export function useSetCap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fixtureId, capMinor, reason }: { fixtureId: string; capMinor: number | null; reason: string }) =>
      apiRequest<FixtureView>(`/admin/risk/fixtures/${encodeURIComponent(fixtureId)}/cap`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capMinor, reason }) }),
    onSuccess: (view) =>
      queryClient.setQueryData<FixtureRisk[]>(fixturesKey, (rows) => [...(rows ?? []).filter((r) => r.fixtureId !== view.fixtureId), fromView(view)].sort((a, b) => b.worstCaseMinor - a.worstCaseMinor)),
  });
}
