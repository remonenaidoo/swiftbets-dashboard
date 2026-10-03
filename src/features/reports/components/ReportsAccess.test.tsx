import { screen } from '@testing-library/react';
import { mockApi, renderRoute } from '../../../test/renderWithProviders';

const session = (permissions: string[]) => ({ subject: 'staff-1', roles: ['Operator'], permissions, expiresAt: '2030-01-01T00:00:00Z' });
const day = {
  day: '2026-10-03',
  coupons: 3,
  sportsTurnover: 3_000,
  sportsPayouts: 2_500,
  sportsGgr: 500,
  casinoTransactions: 2,
  casinoStaked: 300,
  casinoReturned: 100,
  casinoGgr: 200,
  ggr: 700,
};

describe('Reports access', () => {
  it('shows finance reports to a role that holds reports.read', async () => {
    mockApi((url) =>
      url === '/api/session'
        ? { status: 200, body: session(['reports.read']) }
        : url.startsWith('/api/admin/reports/daily')
          ? { status: 200, body: [day] }
          : url.startsWith('/api/admin/reports/reconciliations')
            ? { status: 200, body: [] }
            : { status: 200, body: [] },
    );
    renderRoute('/reports');

    expect(await screen.findByRole('link', { name: 'Reports' })).toBeInTheDocument();
    expect(await screen.findByText('2026-10-03')).toBeInTheDocument();
  });

  it('hides the screen and its menu entry from a role without reports.read, even at its address', async () => {
    const calls = mockApi((url) => (url === '/api/session' ? { status: 200, body: session(['identity.users.read']) } : { status: 200, body: [] }));
    renderRoute('/reports');

    expect(await screen.findByText('No access')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument();
    expect(calls.some((c) => c.url.includes('/admin/reports'))).toBe(false);
  });
});
