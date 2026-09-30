import { ApiError, type ErrorEnvelopeShape } from './apiError';

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/** The single place a 401 is handled: subscribers (the re-auth prompt) are told once per failing request. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('X-SwiftBets-Csrf', '1');
  }

  const response = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => listener());
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readEnvelope(response));
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function readEnvelope(response: Response): Promise<ErrorEnvelopeShape | undefined> {
  if (!response.headers.get('Content-Type')?.includes('application/problem+json')) {
    return undefined;
  }

  try {
    return (await response.json()) as ErrorEnvelopeShape;
  } catch {
    return undefined;
  }
}
