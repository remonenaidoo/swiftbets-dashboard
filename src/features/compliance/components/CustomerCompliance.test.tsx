import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { AuditTrail } from './AuditTrail';
import { CustomerCompliance } from './CustomerCompliance';

const userId = '0199a000-0000-7000-8000-000000000001';

describe('CustomerCompliance', () => {
  it('shows limits with pending raises, blocks and session settings', async () => {
    mockApi((url) =>
      url === `/api/admin/users/${userId}/compliance`
        ? {
            status: 200,
            body: {
              limits: [{ kind: 'stake', period: 'day', amount: 50_000, currency: 'ZAR', pendingAmount: 80_000, pendingEffectiveAt: '2026-10-02T10:00:00Z', pendingRemoval: false }],
              restrictions: [{ kind: 'selfExclusion', startsAt: '2026-10-01T10:00:00Z', endsAt: '2027-04-01T10:00:00Z', reason: 'customer request' }],
              sessionLimitMinutes: 90,
              realityCheckMinutes: 30,
              kycStatus: 'pending',
              excluded: true,
            },
          }
        : undefined,
    );
    renderWithProviders(<CustomerCompliance userId={userId} />);

    expect(await screen.findByText(/Stake per day: R\s?500[.,]00/)).toBeInTheDocument();
    expect(screen.getByText(/rises to R\s?800[.,]00/)).toBeInTheDocument();
    expect(screen.getByText('(excluded)')).toBeInTheDocument();
    expect(screen.getByText(/Self exclusion from/)).toBeInTheDocument();
    expect(screen.getByText(/Session limit 90 min · reality check every 30 min · KYC Pending/)).toBeInTheDocument();
  });

  it('says plainly when the role cannot read it', async () => {
    mockApi(() => ({ status: 403, body: { status: 403, code: 'forbidden', title: 'Forbidden', correlationId: 'c' } }));
    renderWithProviders(<CustomerCompliance userId={userId} />);

    expect(await screen.findByText('Your role cannot read responsible-gambling settings.')).toBeInTheDocument();
  });
});

describe('AuditTrail', () => {
  it('lists the trail and reports a broken chain', async () => {
    mockApi((url) =>
      url.startsWith('/api/admin/audit?')
        ? { status: 200, body: [{ sequence: 7, auditId: 'a7', service: 'compliance', actor: 'self', action: 'limit.set', subjectType: 'user', subjectId: userId, before: null, after: '{}', correlationId: 'c', occurredAt: '2026-10-01T10:00:00Z', hash: 'ab' }] }
        : url === '/api/admin/audit/verify'
          ? { status: 200, body: { verified: false, entries: 6, brokenAt: 7 } }
          : undefined,
    );
    renderWithProviders(<AuditTrail userId={userId} />);

    expect(await screen.findByText('limit.set')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Verify chain' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Chain broken at entry 7.');
  });
});
