import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IncidentDetails } from '../../../shared/lib/types';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { IncidentDetail } from './IncidentDetail';

const details: IncidentDetails = {
  incident: { incidentId: 'i1', kind: 'stuckCoupon', subject: 'c1', summary: 'Coupon c1 is stuck', status: 'awaitingApproval', openedAt: '2026-10-01T00:00:00Z' },
  report: {
    summary: 'Redis lost progress',
    severity: 'medium',
    rootCause: 'Redis progress lost',
    hypothesis: 'SQL has both legs',
    confidence: 0.8,
    evidence: [{ toolCallId: 't1', claim: 'no progress', excerpt: '"redisResolvedLegs":0' }],
    runbookCitations: [{ runbookId: 'stuck-coupon', section: 'Diagnosis' }],
    proposedActions: [],
  },
  reportProblems: [],
  toolCalls: [{ toolCallId: 't1', name: 'get_coupon_state', inputJson: '{}', outputJson: '{"redisResolvedLegs":0}' }],
  actions: [{ actionId: 'a1', incidentId: 'i1', type: 'refreshCoupon', target: 'c1', rationale: 'rebuild from SQL', status: 'pending', decidedBy: null, decidedAt: null, outcome: null }],
};

describe('IncidentDetail', () => {
  it('approves a pending remediation with a CSRF-protected POST', async () => {
    const calls = mockApi((url) =>
      url === '/api/steward/incidents/i1' ? { status: 200, body: details } : url === '/api/steward/actions/a1/approve' ? { status: 200, body: { ...details.actions[0], status: 'executed' } } : undefined,
    );
    renderWithProviders(<IncidentDetail incidentId="i1" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(calls).toContainEqual({ url: '/api/steward/actions/a1/approve', method: 'POST' });
  });

  it('shows why a decision was refused', async () => {
    mockApi((url) =>
      url === '/api/steward/incidents/i1'
        ? { status: 200, body: details }
        : url === '/api/steward/actions/a1/approve'
          ? { status: 409, body: { status: 409, code: 'action_already_decided', title: 'Conflict', detail: 'This action was already decided.' } }
          : undefined,
    );
    renderWithProviders(<IncidentDetail incidentId="i1" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This action was already decided.');
  });
});
