import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as AtomProvider } from 'jotai';
import { useState, type ReactNode } from 'react';
import { ApiError } from '../../shared/lib/apiError';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AtomProvider>{children}</AtomProvider>
    </QueryClientProvider>
  );
}
