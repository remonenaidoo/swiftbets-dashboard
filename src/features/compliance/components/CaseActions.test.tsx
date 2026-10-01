import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { CaseActions } from './CaseActions';

const userId = '0199a000-0000-7000-8000-000000000001';
const block = { id: 'r-1', kind: 'noBetting', startsAt: '2026-10-01T10:00:00Z', endsAt: null, reason: 'chargeback review' };
const state = (restrictions: unknown[]) => ({ limits: [], restrictions, sessionLimitMinutes: null, realityCheckMinutes: null, kycStatus: 'notStarted', excluded: false });

describe('CaseActions', () => {
  it('adds a restriction with a reason', async () => {
    const calls = mockApi((url, init) =>
      url.endsWith('/compliance') ? { status: 200, body: state([]) }
      : url.endsWith('/lift-requests') || url.endsWith('/notes') ? { status: 200, body: [] }
      : url.endsWith('/restrictions') && init?.method === 'POST' ? { status: 200, body: state([block]) }
      : url.startsWith('/api/admin/audit') ? { status: 200, body: [] }
      : undefined,
    );
    renderWithProviders(<CaseActions userId={userId} />);

    await userEvent.selectOptions(await screen.findByLabelText('Restriction'), 'noBetting');
    expect(screen.getByRole('button', { name: 'Add restriction' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Why this restriction'), 'chargeback review');
    await userEvent.click(screen.getByRole('button', { name: 'Add restriction' }));

    expect(calls).toContainEqual({ url: `/api/admin/users/${userId}/restrictions`, method: 'POST' });
  });

  it('shows a pending lift and explains the four-eyes refusal', async () => {
    mockApi((url, init) =>
      url.endsWith('/compliance') ? { status: 200, body: state([block]) }
      : url.endsWith('/lift-requests') ? { status: 200, body: [{ requestId: 'q-1', userId, restrictionId: 'r-1', requestedBy: 'ops-1', reason: 'resolved', requestedAt: '2026-10-01T11:00:00Z' }] }
      : url.endsWith('/notes') ? { status: 200, body: [{ noteId: 'n-1', author: 'ops-2', body: 'called the customer', createdAt: '2026-10-01T11:00:00Z' }] }
      : url.endsWith('/approve') && init?.method === 'POST' ? { status: 422, body: { status: 422, code: 'four_eyes_required', title: 'Unprocessable', correlationId: 'c' } }
      : undefined,
    );
    renderWithProviders(<CaseActions userId={userId} />);

    expect(await screen.findByText('Lift asked by ops-1')).toBeInTheDocument();
    expect(screen.getByText('called the customer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Approve lift' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Another operator must approve a lift you asked for.');
  });
});
