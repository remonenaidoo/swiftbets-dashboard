import type { CouponPlaced, CouponRejected, CouponSettled, LiveDelta, PayoutCompleted } from '../../../shared/lib/types';

export const feedTypes = ['coupon-placed', 'coupon-rejected', 'coupon-settled', 'payout-completed'] as const;

export interface FeedRow {
  key: string;
  type: (typeof feedTypes)[number];
  at: string;
  couponId: string;
  detail: string;
  amountMinor: number;
  currency: string;
}

/** Only ops-group deltas feed the operator view; the same event also arrives on punter groups for punters. */
export function toFeedRow(delta: LiveDelta): FeedRow | null {
  if (delta.group !== 'ops') {
    return null;
  }

  const base = { key: `${delta.group}:${delta.sequence}`, at: delta.occurredAt };
  switch (delta.type) {
    case 'coupon-placed': {
      const p = delta.payload as CouponPlaced;
      return { ...base, type: 'coupon-placed', couponId: p.couponId, detail: `${p.betType} · ${p.legs.length} leg${p.legs.length === 1 ? '' : 's'} @ ${p.totalOdds.toFixed(2)}`, amountMinor: p.stake.minorUnits, currency: p.stake.currency };
    }
    case 'coupon-rejected': {
      const p = delta.payload as CouponRejected;
      return { ...base, type: 'coupon-rejected', couponId: p.couponId, detail: p.reasonCode, amountMinor: 0, currency: 'ZAR' };
    }
    case 'coupon-settled': {
      const p = delta.payload as CouponSettled;
      return { ...base, type: 'coupon-settled', couponId: p.couponId, detail: `${p.outcome} · v${p.settlementVersion}`, amountMinor: p.targetPayout.minorUnits, currency: p.targetPayout.currency };
    }
    case 'payout-completed': {
      const p = delta.payload as PayoutCompleted;
      return { ...base, type: 'payout-completed', couponId: p.couponId, detail: `v${p.settlementVersion}`, amountMinor: p.delta.minorUnits, currency: p.delta.currency };
    }
    default:
      return null;
  }
}

export interface FeedTotals {
  placed: number;
  rejected: number;
  settled: number;
  paidMinor: number;
}

export const emptyTotals: FeedTotals = { placed: 0, rejected: 0, settled: 0, paidMinor: 0 };

export function addToTotals(totals: FeedTotals, row: FeedRow): FeedTotals {
  switch (row.type) {
    case 'coupon-placed':
      return { ...totals, placed: totals.placed + 1 };
    case 'coupon-rejected':
      return { ...totals, rejected: totals.rejected + 1 };
    case 'coupon-settled':
      return { ...totals, settled: totals.settled + 1 };
    case 'payout-completed':
      return { ...totals, paidMinor: totals.paidMinor + row.amountMinor };
  }
}
