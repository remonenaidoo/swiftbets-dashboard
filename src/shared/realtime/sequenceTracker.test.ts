import { SequenceTracker } from './sequenceTracker';

describe('SequenceTracker', () => {
  it('accepts consecutive sequences in a group', () => {
    const tracker = new SequenceTracker();

    expect([tracker.accept('ops', 7), tracker.accept('ops', 8), tracker.accept('ops', 9)]).toEqual([true, true, true]);
  });

  it('reports a gap when a delta was missed', () => {
    const tracker = new SequenceTracker();
    tracker.accept('ops', 7);

    expect(tracker.accept('ops', 9)).toBe(false);
  });
});
