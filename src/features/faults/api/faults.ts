import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export function useInjectFault() {
  return useMutation({
    mutationFn: (fault: string) => apiRequest<{ fault: string; injected: string }>(`/steward/drills/${fault}`, { method: 'POST' }),
  });
}

export function useSpend() {
  return useQuery({ queryKey: ['steward', 'spend'], queryFn: () => apiRequest<{ monthToDateUsd: number }>('/steward/spend'), refetchInterval: 30_000 });
}
