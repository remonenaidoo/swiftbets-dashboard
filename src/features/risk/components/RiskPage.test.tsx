import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { live } from '../../../shared/realtime/liveConnection';
import type { LiveDelta } from '../../../shared/lib/types';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { RiskPage } from './RiskPage';

const view = { fixtureId: 'f-1', version: 1, worstCaseMinor: 5_000, capMinor: 100_000_000, capOverridden: false, suspended: false, outcomes: [{ outcome: { marketId: 'm', selectionId: 'home' }, stakeMinor: 1_000, liabilityMinor: 5_000, coupons: 1 }], updatedAt: '2026-10-03T09:00:00Z' };
const push = (delta: LiveDelta) => act(() => (live as unknown as { deltaListeners: Set<(d: LiveDelta) => void> }).deltaListeners.forEach((l) => l(delta)));

describe('RiskPage', () => {
  it('moves a fixture liability as soon as the live stream reports it', async () => {
    mockApi((url) => (url.includes('/admin/risk/fixtures') ? { status: 200, body: [view] } : url.includes('/admin/risk/alerts') ? { status: 200, body: [] } : undefined));
    renderWithProviders(<RiskPage />);
    await screen.findByText(/^R\s?50[.,]00$/);

    push({ group: 'ops', sequence: 7, type: 'liability-changed', occurredAt: '2026-10-03T09:01:00Z', payload: { fixtureId: 'f-1', version: 2, worstCase: { minorUnits: 9_000 }, outcomes: [{ marketId: 'm', selectionId: 'home', stake: { minorUnits: 2_000 }, liability: { minorUnits: 9_000 }, coupons: 2 }], changedAt: '2026-10-03T09:01:00Z' } });

    expect(await screen.findByText(/^R\s?90[.,]00$/)).toBeInTheDocument();
    expect(screen.getByText('home · 2 coupons')).toBeInTheDocument();
  });

  it('will not suspend a fixture without a reason', async () => {
    mockApi((url) => (url.includes('/admin/risk/fixtures') ? { status: 200, body: [view] } : url.includes('/admin/risk/alerts') ? { status: 200, body: [] } : undefined));
    renderWithProviders(<RiskPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Cap' }));

    const row = screen.getByRole('button', { name: 'Suspend' }).closest('div')!;
    expect(within(row).getByRole('button', { name: 'Suspend' })).toBeDisabled();
  });
});
