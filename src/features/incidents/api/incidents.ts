import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';
import type { Incident, IncidentDetails, RemediationAction } from '../../../shared/lib/types';
import { useLiveInvalidation } from '../../../shared/realtime/useLive';

export const incidentKeys = {
  all: ['incidents'] as const,
  list: () => [...incidentKeys.all, 'list'] as const,
  detail: (incidentId: string) => [...incidentKeys.all, 'detail', incidentId] as const,
};

const incidentDeltas = ['incident-raised', 'incident-updated', 'remediation-executed'] as const;

export function useIncidents() {
  useLiveInvalidation(incidentDeltas, incidentKeys.all);
  return useQuery({ queryKey: incidentKeys.list(), queryFn: () => apiRequest<Incident[]>('/steward/incidents?limit=100') });
}

export function useIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: incidentKeys.detail(incidentId ?? ''),
    queryFn: () => apiRequest<IncidentDetails>(`/steward/incidents/${incidentId}`),
    enabled: !!incidentId,
  });
}

export function useDecideAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, decision }: { actionId: string; decision: 'approve' | 'reject' }) =>
      apiRequest<RemediationAction>(`/steward/actions/${actionId}/${decision}`, { method: 'POST' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: incidentKeys.all }),
  });
}
