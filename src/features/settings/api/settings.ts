import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export interface Setting {
  key: string;
  value: string;
  version: number;
  changedBy: string;
  reason: string;
  changedAt: string;
}

export const keys = {
  killSwitch: 'placement.kill-switch',
  mode: 'placement.mode',
  maxStake: (currency: string) => `limits.max-stake.${currency}`,
  maxPayout: (currency: string) => `limits.max-payout.${currency}`,
} as const;

export const modes = ['open', 'preMatchOnly', 'closed'] as const;
export const currencies = ['ZAR', 'USD'] as const;

const listKey = ['config', 'settings'] as const;

export function useSettings() {
  return useQuery({ queryKey: listKey, queryFn: () => apiRequest<Setting[]>('/admin/config/'), refetchInterval: 15_000 });
}

export function useHistory(key: string | null) {
  return useQuery({
    queryKey: ['config', 'history', key],
    queryFn: () => apiRequest<Setting[]>(`/admin/config/${encodeURIComponent(key ?? '')}/history?limit=20`),
    enabled: !!key,
    retry: false,
  });
}

export function useChangeSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, reason }: { key: string; value: string; reason: string }) =>
      apiRequest<Setting>(`/admin/config/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, reason }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config'] }),
  });
}

/** The value in force, or undefined when the key was never set and services use their defaults. */
export function valueOf(settings: Setting[] | undefined, key: string): string | undefined {
  return settings?.find((s) => s.key === key)?.value;
}

/** Rands typed by an operator as minor units; null unless a positive whole or two-decimal amount. */
export function toMinor(input: string): number | null {
  const match = /^\s*(\d{1,12})(?:[.,](\d{1,2}))?\s*$/.exec(input);
  if (!match) return null;
  const minor = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return minor > 0 ? minor : null;
}
