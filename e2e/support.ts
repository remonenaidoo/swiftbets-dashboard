import type { APIRequestContext, Page } from '@playwright/test';

export const password = process.env.DEMO_PASSWORD ?? 'Local-Dev-Demo-1';

export async function signIn(page: Page, username = 'operator1') {
  await page.goto('/');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('navigation', { name: 'Primary' }).waitFor();
}

/** Collects CSP violations reported by the browser for the whole page lifetime. */
export async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction('__reportCsp', (text: string) => violations.push(text));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) =>
      (window as unknown as { __reportCsp: (t: string) => void }).__reportCsp(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      violations.push(message.text());
    }
  });
  return violations;
}

async function token(request: APIRequestContext, username: string): Promise<string> {
  const response = await request.post('/api/auth/token', { data: { grantType: 'password', username, password } });
  return ((await response.json()) as { accessToken: string }).accessToken;
}

interface Fixture {
  fixtureId: string;
  offerVersion: number;
  markets: { marketId: string; selections: { selectionId: string; odds: number }[] }[];
}

/**
 * Places single-leg bets as a demo punter until stopped, so the settler has settlements to drop. Returns a stop
 * function. Refusals (a suspended market, a price move) are expected under replay and simply skipped.
 */
export async function placeBetsInBackground(request: APIRequestContext): Promise<() => Promise<void>> {
  const operator = await token(request, 'operator1');
  const punterId = '40000000-0000-0000-0000-000000000001';
  await request.post(`/api/accounts/${punterId}/topup`, {
    data: { minorUnits: 10_000_000, currency: 'ZAR' },
    headers: { Authorization: `Bearer ${operator}`, 'Idempotency-Key': `e2e-fund-${Date.now()}` },
  });
  const punter = await token(request, 'load001');

  let running = true;
  const loop = (async () => {
    for (let i = 0; running; i++) {
      const fixtures = (await (await request.get('/api/fixtures/?limit=20')).json()) as Fixture[];
      const fixture = fixtures[i % Math.max(1, fixtures.length)];
      const market = fixture?.markets[0];
      const selection = market?.selections[0];
      if (fixture && market && selection) {
        await request.post('/api/coupons/', {
          data: { stake: 100, currency: 'ZAR', legs: [{ fixtureId: fixture.fixtureId, marketId: market.marketId, selectionId: selection.selectionId, odds: selection.odds, offerVersion: fixture.offerVersion }] },
          headers: { Authorization: `Bearer ${punter}`, 'Idempotency-Key': `e2e-${Date.now()}-${i}` },
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  })();

  return async () => {
    running = false;
    await loop;
  };
}

/** Reads incidents with the page's own session cookie, exactly as the dashboard does. */
export function listIncidents(page: Page): Promise<{ incidentId: string; kind: string; status: string }[]> {
  return page.evaluate(async () => (await fetch('/api/steward/incidents?limit=100', { credentials: 'same-origin' })).json());
}
