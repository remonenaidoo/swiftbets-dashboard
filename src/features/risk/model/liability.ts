/** One fixture's open liability as the trader view shows it, from the risk API or a live liability-changed delta. */
export interface FixtureRisk {
  fixtureId: string;
  version: number;
  worstCaseMinor: number;
  capMinor: number;
  capOverridden: boolean;
  suspended: boolean;
  outcomes: { marketId: string; selectionId: string; stakeMinor: number; liabilityMinor: number; coupons: number }[];
  updatedAt: string;
}

export interface FixtureView {
  fixtureId: string;
  version: number;
  worstCaseMinor: number;
  capMinor: number;
  capOverridden: boolean;
  suspended: boolean;
  outcomes: { outcome: { marketId: string; selectionId: string }; stakeMinor: number; liabilityMinor: number; coupons: number }[];
  updatedAt: string;
}

export interface LiabilityChanged {
  fixtureId: string;
  version: number;
  outcomes: { marketId: string; selectionId: string; stake: { minorUnits: number }; liability: { minorUnits: number }; coupons: number }[];
  worstCase: { minorUnits: number };
  changedAt: string;
}

export const fromView = (v: FixtureView): FixtureRisk => ({
  ...v,
  outcomes: v.outcomes.map((o) => ({ marketId: o.outcome.marketId, selectionId: o.outcome.selectionId, stakeMinor: o.stakeMinor, liabilityMinor: o.liabilityMinor, coupons: o.coupons })),
});

/**
 * Applies a live liability change: an older version than the row already holds is ignored, and the cap stays as the
 * risk API last reported it, so suspension is recomputed against it until the next read.
 */
export function applyLiability(rows: FixtureRisk[], change: LiabilityChanged, defaultCapMinor: number): FixtureRisk[] {
  const current = rows.find((r) => r.fixtureId === change.fixtureId);
  if (current && current.version >= change.version) return rows;
  const capMinor = current?.capMinor ?? defaultCapMinor;
  const next: FixtureRisk = {
    fixtureId: change.fixtureId,
    version: change.version,
    worstCaseMinor: change.worstCase.minorUnits,
    capMinor,
    capOverridden: current?.capOverridden ?? false,
    suspended: capMinor === 0 || change.worstCase.minorUnits >= capMinor,
    outcomes: change.outcomes.map((o) => ({ marketId: o.marketId, selectionId: o.selectionId, stakeMinor: o.stake.minorUnits, liabilityMinor: o.liability.minorUnits, coupons: o.coupons })),
    updatedAt: change.changedAt,
  };
  return [...rows.filter((r) => r.fixtureId !== change.fixtureId), next].sort((a, b) => b.worstCaseMinor - a.worstCaseMinor || a.fixtureId.localeCompare(b.fixtureId));
}
