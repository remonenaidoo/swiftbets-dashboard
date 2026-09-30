import type { LiveDelta } from '../../../shared/lib/types';
import { toFeedRow } from './feed';

const placed = {
  couponId: 'c1',
  punterId: 'p1',
  betType: 'accumulator',
  stake: { minorUnits: 1000, currency: 'ZAR' },
  totalOdds: 3.5,
  potentialPayout: { minorUnits: 3500, currency: 'ZAR' },
  legs: [{}, {}],
  placedAt: '2026-10-01T00:00:00Z',
};

const delta = (group: string): LiveDelta => ({ group, sequence: 1, type: 'coupon-placed', occurredAt: placed.placedAt, payload: placed });

describe('toFeedRow', () => {
  it('turns an operator delta into a feed row', () => {
    expect(toFeedRow(delta('ops'))).toMatchObject({ type: 'coupon-placed', couponId: 'c1', detail: 'accumulator · 2 legs @ 3.50', amountMinor: 1000 });
  });

  it('ignores the copy of the same event sent to the punter group', () => {
    expect(toFeedRow(delta('punter:p1'))).toBeNull();
  });
});
