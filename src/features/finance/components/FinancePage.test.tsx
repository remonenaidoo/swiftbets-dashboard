import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { FinancePage } from './FinancePage';

const held = {
  withdrawalId: '0199a000-0000-7000-8000-0000000000aa',
  userId: '0199a000-0000-7000-8000-000000000001',
  amount: 600_000,
  currency: 'ZAR',
  status: 'awaitingApproval',
  requiresApproval: true,
  decidedBy: null,
  reason: null,
  createdAt: '2026-10-01T10:00:00Z',
  completedAt: null,
};
const drifted = {
  runId: 'run-1',
  provider: 'simulator',
  day: '2026-09-30',
  completedAt: '2026-10-01T02:00:00Z',
  drifts: [{ kind: 1, reference: 'dep_abc', providerAmount: 10_000, ledgerAmount: null, currency: 'ZAR', detail: 'settled, not credited' }],
};
const notFound = { status: 404, body: { status: 404, code: 'not_found', title: 'Not found', correlationId: 'c' } };

describe('FinancePage', () => {
  it('approves a held withdrawal and shows a provider drift', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/withdrawals?status=awaitingApproval') ? { status: 200, body: [held] }
      : url.endsWith('/approve') && init?.method === 'POST' ? { status: 200, body: { ...held, status: 'approved' } }
      : url.endsWith('/simulator/latest') ? { status: 200, body: drifted }
      : url.endsWith('/paystack/latest') ? notFound
      : undefined,
    );
    renderWithProviders(<FinancePage />);

    const simulator = await screen.findByRole('article', { name: 'simulator reconciliation' });
    expect(await within(simulator).findByText('1 drift on 2026-09-30')).toBeInTheDocument();
    expect(within(simulator).getByText('Missing in our ledger')).toBeInTheDocument();
    expect(await within(screen.getByRole('article', { name: 'paystack reconciliation' })).findByText('No run yet')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /^Approve R/ }));
    expect(calls).toContainEqual({ url: `/api/admin/payments/withdrawals/${held.withdrawalId}/approve`, method: 'POST' });
  });

  it('needs a reason to reject and explains a decision that lost the race', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/withdrawals?status=awaitingApproval') ? { status: 200, body: [held] }
      : url.endsWith('/reject') && init?.method === 'POST' ? { status: 422, body: { status: 422, code: 'invalid_state', title: 'Unprocessable', correlationId: 'c' } }
      : url.endsWith('/latest') ? notFound
      : undefined,
    );
    renderWithProviders(<FinancePage />);

    const reject = await screen.findByRole('button', { name: /^Reject R/ });
    expect(reject).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Why reject'), 'name does not match bank account');
    await userEvent.click(reject);

    expect(calls).toContainEqual({ url: `/api/admin/payments/withdrawals/${held.withdrawalId}/reject`, method: 'POST' });
    expect(await screen.findByRole('alert')).toHaveTextContent('That withdrawal has already been decided.');
  });

  it('says when nothing waits and reruns a provider on demand', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/withdrawals?status=awaitingApproval') ? { status: 200, body: [] }
      : url.endsWith('/simulator/run') && init?.method === 'POST' ? { status: 200, body: { ...drifted, drifts: [] } }
      : url.endsWith('/latest') ? notFound
      : undefined,
    );
    renderWithProviders(<FinancePage />);

    expect(await screen.findByText('Nothing to approve')).toBeInTheDocument();
    const simulator = screen.getByRole('article', { name: 'simulator reconciliation' });
    await userEvent.click(within(simulator).getByRole('button', { name: 'Run yesterday again' }));

    expect(await within(simulator).findByText('Balanced on 2026-09-30')).toBeInTheDocument();
    expect(calls).toContainEqual({ url: '/api/admin/payments/reconciliation/simulator/run', method: 'POST' });
  });
});
