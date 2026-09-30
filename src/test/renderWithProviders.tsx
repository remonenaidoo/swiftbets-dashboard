import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../app/providers/AppProviders';
import { routes } from '../app/routes/router';

export function renderRoute(path: string) {
  return render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </AppProviders>,
  );
}

export function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown } | undefined;

/** Replaces fetch with a router over the given handler; unmatched requests fail loudly. */
export function mockApi(handler: Handler) {
  const calls: { url: string; method: string }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    calls.push({ url: input, method: init?.method ?? 'GET' });
    const reply = handler(input, init);
    if (!reply) {
      throw new Error(`Unexpected request ${init?.method ?? 'GET'} ${input}`);
    }
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': reply.status >= 400 ? 'application/problem+json' : 'application/json' },
    });
  }));
  return calls;
}
