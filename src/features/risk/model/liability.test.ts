import { applyLiability, type FixtureRisk, type LiabilityChanged } from './liability';

const row: FixtureRisk = { fixtureId: 'f-1', version: 4, worstCaseMinor: 5_000, capMinor: 10_000, capOverridden: true, suspended: false, outcomes: [], updatedAt: '2026-10-03T09:00:00Z' };
const change = (version: number, worst: number): LiabilityChanged => ({
  fixtureId: 'f-1',
  version,
  worstCase: { minorUnits: worst },
  outcomes: [{ marketId: 'm', selectionId: 'home', stake: { minorUnits: 1_000 }, liability: { minorUnits: worst }, coupons: 2 }],
  changedAt: '2026-10-03T09:01:00Z',
});

describe('applyLiability', () => {
  it('takes a newer change and suspends against the trader cap the row already holds', () => {
    const [next] = applyLiability([row], change(5, 12_000), 100_000_000);
    expect(next).toMatchObject({ version: 5, worstCaseMinor: 12_000, capMinor: 10_000, suspended: true });
  });

  it('ignores a change older than the row', () => {
    expect(applyLiability([row], change(3, 99_000), 100_000_000)).toEqual([row]);
  });
});
