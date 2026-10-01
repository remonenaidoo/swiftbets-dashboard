import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import { ApiError } from './apiError';
import type { SessionInfo } from './types';

export const sessionKey = ['session'] as const;

async function readSession(): Promise<SessionInfo | null> {
  try {
    return await apiRequest<SessionInfo>('/session');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * The signed-in operator, or null when signed out. Where the gateway offers demo sign-in (an open preview), a
 * signed-out visitor is signed in as the demo operator without seeing a form; elsewhere demo sign-in answers 404.
 */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      const session = await readSession();
      if (session) {
        return session;
      }
      try {
        await apiRequest<{ expiresIn: number }>('/session/demo', { method: 'POST' });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
      return readSession();
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
