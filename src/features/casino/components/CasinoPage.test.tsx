import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { CasinoPage } from './CasinoPage';

const punter = '0199aaaa-0000-7000-8000-000000000001';
const lobby = { categories: [{ games: [{ gameId: 'sun-temple', name: 'Sun Temple' }] }] };

describe('CasinoPage', () => {
  it('grants free spins to a customer on a catalogue game', async () => {
    const calls = mockApi((url, init) =>
      url.includes('/casino/lobby') ? { status: 200, body: lobby }
      : url.includes('/admin/casino/free-spins?') ? { status: 200, body: [] }
      : url.endsWith('/admin/casino/free-spins') && init?.method === 'POST' ? { status: 201, body: { grantId: 'g', punterId: punter, gameId: 'sun-temple', granted: 10, remaining: 10, expiresAt: '2026-10-10T00:00:00Z' } }
      : undefined,
    );
    renderWithProviders(<CasinoPage />);
    await screen.findByRole('option', { name: 'Sun Temple' });

    await userEvent.type(screen.getByLabelText('Customer id'), punter);
    await userEvent.click(screen.getByRole('button', { name: 'Grant spins' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Granted 10 spins on sun-temple');
    expect(calls).toContainEqual({ url: '/api/admin/casino/free-spins', method: 'POST' });
  });

  it('will not grant to something that is not a customer id', async () => {
    mockApi((url) => (url.includes('/casino/lobby') ? { status: 200, body: lobby } : undefined));
    renderWithProviders(<CasinoPage />);
    await screen.findByRole('option', { name: 'Sun Temple' });

    await userEvent.type(screen.getByLabelText('Customer id'), 'not-an-id');

    expect(screen.getByRole('button', { name: 'Grant spins' })).toBeDisabled();
  });

  it('reconciles a provider and flags drift', async () => {
    const run = { runId: 'r', providerId: 'sim-seamless', businessDate: '2026-10-02', ourNet: 1000, providerNet: 900, drift: 100, missingOnOurSide: 0, missingOnProviderSide: 1, status: 'drift', currency: 'ZAR', reconciledAt: '2026-10-02T12:00:00Z' };
    let done = false;
    const calls = mockApi((url, init) =>
      url.includes('/casino/lobby') ? { status: 200, body: lobby }
      : url.includes('/admin/casino/reconciliation?') ? { status: 200, body: done ? [run] : [] }
      : url.includes('/admin/casino/reconciliation/sim-seamless/') && init?.method === 'POST' ? ((done = true), { status: 200, body: run })
      : undefined,
    );
    renderWithProviders(<CasinoPage />);
    await screen.findByText('No reconciliations for this provider yet.');

    await userEvent.click(screen.getByRole('button', { name: 'Reconcile now' }));

    expect(await screen.findByText(/^Drift/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.url.startsWith('/api/admin/casino/reconciliation/sim-seamless/'))).toBe(true);
  });

  it('says so when the provider report cannot be fetched', async () => {
    mockApi((url, init) =>
      url.includes('/casino/lobby') ? { status: 200, body: lobby }
      : url.includes('/admin/casino/reconciliation?') ? { status: 200, body: [] }
      : init?.method === 'POST' && url.includes('/reconciliation/') ? { status: 503, body: { code: 'report_unavailable', detail: "The provider's report could not be fetched; try again." } }
      : undefined,
    );
    renderWithProviders(<CasinoPage />);
    await screen.findByText('No reconciliations for this provider yet.');

    await userEvent.click(screen.getByRole('button', { name: 'Reconcile now' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
