import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import { ApiError } from './apiError';
import type { SessionInfo } from './types';

export const sessionKey = ['session'] as const;

/** The signed-in operator, or null when signed out. Other errors surface as query errors. */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        return await apiRequest<SessionInfo>('/session');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      apiRequest<{ expiresIn: number }>('/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<undefined>('/session/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(sessionKey, null);
    },
  });
}

export function isOperator(session: SessionInfo | null | undefined): boolean {
  return !!session && session.roles.some((role) => role === 'Operator' || role === 'Admin');
}
