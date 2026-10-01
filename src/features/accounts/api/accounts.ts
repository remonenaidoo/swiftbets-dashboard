import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../shared/lib/apiClient';

export type AccountStatus = 'active' | 'suspended' | 'closed' | 'selfExcluded';

export interface AccountProfile {
  userId: string;
  email: string | null;
  username: string | null;
  emailVerified: boolean;
  status: string;
  brand: string;
  country: string;
  currency: string;
  roles: string[];
}

const accountKey = (email: string) => ['accounts', 'by-email', email.toLowerCase()] as const;

export function useAccountByEmail(email: string | null) {
  return useQuery({
    queryKey: accountKey(email ?? ''),
    queryFn: () => apiRequest<AccountProfile>(`/admin/users?email=${encodeURIComponent(email ?? '')}`),
    enabled: !!email,
    retry: false,
  });
}

export function useChangeStatus(email: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: AccountStatus; reason: string }) =>
      apiRequest<undefined>(`/admin/users/${userId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKey(email) }),
  });
}
