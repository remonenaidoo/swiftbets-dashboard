import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LiveDelta } from '../../../shared/lib/types';
import { live } from '../../../shared/realtime/liveConnection';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { TradingPage } from './TradingPage';

const fixture = {
  fixtureId: 'fx-1',
  competition: 'Premier League',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  kickoffAt: '2026-10-02T15:00:00Z',
  status: 'scheduled',
  offerVersion: 3,
  markets: [{ marketId: 'fx-1-1x2', type: 'matchResult', status: 'open', selections: [{ selectionId: 'home', name: 'Arsenal', odds: 2.1 }] }],
};

describe('TradingPage', () => {
  it('suspends an open market', async () => {
    const calls = mockApi((url, init) =>
      url.includes('/fixtures/?limit') ? { status: 200, body: [fixture] }
      : url.endsWith('/markets/fx-1-1x2/suspend') && init?.method === 'POST' ? { status: 200, body: fixture }
      : undefined,
    );
    renderWithProviders(<TradingPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Suspend Match result for Arsenal v Chelsea' }));

    expect(calls).toContainEqual({ url: '/api/fixtures/fx-1/markets/fx-1-1x2/suspend', method: 'POST' });
  });

  it('shows a void refused for a cashed-out coupon as an explicit rejection', async () => {
    const listeners = new Set<(delta: LiveDelta) => void>();
    vi.spyOn(live, 'onDelta').mockImplementation((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    });
    const deliver = (delta: LiveDelta) => listeners.forEach((listener) => listener(delta));
    mockApi((url) => (url.includes('/fixtures/?limit') ? { status: 200, body: [fixture] } : undefined));
    renderWithProviders(<TradingPage />);
    await screen.findByText('Arsenal v Chelsea');

    act(() =>
      deliver({
        group: 'ops',
        sequence: 1,
        type: 'manual-result-rejected',
        occurredAt: '2026-10-02T12:00:00Z',
        payload: { manualResultId: 'm-1', couponId: '0199aaaa-0000-7000-8000-000000000001', code: 'coupon_cashed_out', message: 'cashed out', rejectedAt: '2026-10-02T12:00:00Z' },
      }),
    );

    expect(await screen.findByText(/Rejected for coupon 0199aaaa: coupon cashed out/)).toBeInTheDocument();
  });
});
