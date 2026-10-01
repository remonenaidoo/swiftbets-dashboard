import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { toMinor } from '../api/settings';
import { SettingsPage } from './SettingsPage';

const at = '2026-10-01T12:00:00Z';
const setting = (key: string, value: string, version = 1) => ({ key, value, version, changedBy: 'admin-1', reason: 'launch', changedAt: at });

describe('SettingsPage', () => {
  it('needs a reason, then turns the kill switch on', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/admin/config/') ? { status: 200, body: [setting('placement.mode', 'open')] }
      : url.endsWith('/placement.kill-switch') && init?.method === 'PUT' ? { status: 200, body: setting('placement.kill-switch', 'on') }
      : undefined,
    );
    renderWithProviders(<SettingsPage />);

    const toggle = await screen.findByRole('button', { name: 'Turn kill switch on' });
    expect(toggle).toBeDisabled();
    expect(screen.getByText('Off: betting follows the placement mode.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Reason for the change'), 'feed outage');
    await userEvent.click(toggle);

    expect(calls).toContainEqual({ url: '/api/admin/config/placement.kill-switch', method: 'PUT' });
  });

  it('shows an active kill switch, the mode in force and a configured limit', async () => {
    mockApi((url) =>
      url.endsWith('/admin/config/') ? { status: 200, body: [setting('placement.kill-switch', 'on', 3), setting('placement.mode', 'preMatchOnly'), setting('limits.max-stake.ZAR', '500000')] }
      : undefined,
    );
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByText('On: all betting is stopped.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pre-match only' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/R\s?5[\s,]?000[.,]00/)).toBeInTheDocument();
    expect(screen.getAllByText('No limit')).toHaveLength(3);
  });

  it('saves a limit in minor units and explains a refusal', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/admin/config/') ? { status: 200, body: [] }
      : url.endsWith('/limits.max-payout.USD') && init?.method === 'PUT' ? { status: 403, body: { status: 403, code: 'forbidden', title: 'Forbidden', correlationId: 'c' } }
      : url.includes('/history') ? { status: 200, body: [setting('limits.max-payout.USD', '100000')] }
      : undefined,
    );
    renderWithProviders(<SettingsPage />);

    await userEvent.type(await screen.findByLabelText('Reason for the change'), 'risk review');
    await userEvent.type(screen.getByLabelText('New max payout (usd)'), '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Save max payout (usd)' }));

    expect(calls).toContainEqual({ url: '/api/admin/config/limits.max-payout.USD', method: 'PUT' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Only an admin can change settings.');
    await userEvent.click(screen.getByRole('button', { name: 'History of max payout (usd)' }));
    expect(await screen.findByText(/100000 by admin-1: launch/)).toBeInTheDocument();
  });

  it('reads typed amounts as minor units', () => {
    expect(toMinor('5000')).toBe(500_000);
    expect(toMinor('12,5')).toBe(1_250);
    expect(toMinor('0')).toBeNull();
    expect(toMinor('lots')).toBeNull();
  });
});
