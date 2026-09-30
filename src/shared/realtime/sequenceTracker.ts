/**
 * Tracks the last sequence seen per group. Each group's sequence increases by one per delta, so anything else means
 * deltas were missed (a reconnect, a dropped frame) and the view must re-read over HTTP rather than trust itself.
 */
export class SequenceTracker {
  private readonly last = new Map<string, number>();

  /** Returns true when this delta follows the previous one in its group without a gap. */
  accept(group: string, sequence: number): boolean {
    const previous = this.last.get(group);
    this.last.set(group, Math.max(previous ?? 0, sequence));
    return previous === undefined || sequence === previous + 1;
  }

  reset(): void {
    this.last.clear();
  }
}
