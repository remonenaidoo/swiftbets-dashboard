import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';
import { useLiveInvalidation } from '../../../shared/realtime/useLive';

export interface Selection {
  selectionId: string;
  name: string;
  odds: number;
}

export interface Market {
  marketId: string;
  type: string;
  status: 'open' | 'suspended' | 'closed' | string;
  selections: Selection[];
}

export interface Fixture {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  status: string;
  offerVersion: number;
  markets: Market[];
}

export const scopes = ['fixture', 'market', 'coupon'] as const;
export const actions = ['settle', 'void', 'override', 'timeVoid'] as const;
export type Scope = (typeof scopes)[number];
export type Action = (typeof actions)[number];

export interface ManualResultRequest {
  scope: Scope;
  action: Action;
  fixtureId: string;
  marketId: string | null;
  couponId: string | null;
  winningSelectionId: string | null;
  reason: string;
  voidFrom: string | null;
}

const fixturesKey = ['trading', 'fixtures'] as const;

/** Markets a trader can act on; suspensions and status changes arrive live and re-read the list. */
export function useTradingFixtures() {
  useLiveInvalidation(['market-status-changed', 'fixture-changed'], fixturesKey);
  return useQuery({ queryKey: fixturesKey, queryFn: () => apiRequest<Fixture[]>('/fixtures/?limit=50') });
}

export function useSetMarketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fixtureId, marketId, suspend }: { fixtureId: string; marketId: string; suspend: boolean }) =>
      apiRequest<Fixture>(`/fixtures/${encodeURIComponent(fixtureId)}/markets/${encodeURIComponent(marketId)}/${suspend ? 'suspend' : 'resume'}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fixturesKey }),
  });
}

export function useIssueManualResult() {
  return useMutation({
    mutationFn: (request: ManualResultRequest) =>
      apiRequest<{ manualResultId: string }>('/admin/trading/manual-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }),
  });
}
