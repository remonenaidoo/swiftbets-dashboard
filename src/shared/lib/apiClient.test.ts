import { apiRequest, onUnauthorized } from './apiClient';
import { ApiError } from './apiError';

function respond(status: number, body: unknown, contentType = 'application/json') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })));
}

afterEach(() => vi.unstubAllGlobals());

describe('apiRequest', () => {
  it('returns the parsed body and sends the CSRF header on mutations', async () => {
    respond(200, { couponId: 'c1' });

    await expect(apiRequest<{ couponId: string }>('/coupons', { method: 'POST' })).resolves.toEqual({ couponId: 'c1' });
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(new Headers(init?.headers).get('X-SwiftBets-Csrf')).toBe('1');
  });

  it('turns an error envelope into a typed ApiError and signals 401 once', async () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    respond(401, { type: 't', title: 'Unauthorized', status: 401, code: 'unauthenticated', correlationId: 'corr-1' }, 'application/problem+json');

    const error = await apiRequest('/me').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('unauthenticated');
    expect((error as ApiError).correlationId).toBe('corr-1');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
