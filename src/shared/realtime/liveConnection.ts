import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import type { LiveDelta } from '../lib/types';
import { SequenceTracker } from './sequenceTracker';

export type LiveStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

type DeltaListener = (delta: LiveDelta) => void;
type Listener = () => void;

/**
 * One hub connection for the whole dashboard. Deltas fan out to subscribers; a gap in any group's sequence, or a
 * reconnect, raises a resync so queries re-read the source of truth.
 */
export class LiveConnection {
  private connection: HubConnection | null = null;
  private readonly deltaListeners = new Set<DeltaListener>();
  private readonly resyncListeners = new Set<Listener>();
  private readonly statusListeners = new Set<Listener>();
  private readonly tracker = new SequenceTracker();
  private currentStatus: LiveStatus = 'offline';

  get status(): LiveStatus {
    return this.currentStatus;
  }

  start(): void {
    if (this.connection) {
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl('/api/hubs/live', { headers: { 'X-SwiftBets-Csrf': '1' }, withCredentials: true })
      .withAutomaticReconnect([0, 1_000, 2_000, 5_000, 10_000, 15_000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('delta', (delta: LiveDelta) => {
      if (!this.tracker.accept(delta.group, delta.sequence)) {
        this.emitResync();
      }
      this.deltaListeners.forEach((listener) => listener(delta));
    });
    connection.onreconnecting(() => this.setStatus('reconnecting'));
    connection.onreconnected(() => {
      this.tracker.reset();
      this.setStatus('live');
      this.emitResync();
    });
    connection.onclose(() => this.setStatus('offline'));

    this.connection = connection;
    this.setStatus('connecting');
    void this.connect(connection);
  }

  async stop(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.tracker.reset();
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
    this.setStatus('offline');
  }

  onDelta(listener: DeltaListener): () => void {
    this.deltaListeners.add(listener);
    return () => this.deltaListeners.delete(listener);
  }

  onResync(listener: Listener): () => void {
    this.resyncListeners.add(listener);
    return () => this.resyncListeners.delete(listener);
  }

  onStatus(listener: Listener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private async connect(connection: HubConnection): Promise<void> {
    for (let attempt = 0; this.connection === connection; attempt++) {
      try {
        await connection.start();
        this.setStatus('live');
        return;
      } catch {
        this.setStatus('reconnecting');
        await new Promise((resolve) => setTimeout(resolve, Math.min(15_000, 1_000 * 2 ** attempt)));
      }
    }
  }

  private setStatus(status: LiveStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener());
  }

  private emitResync(): void {
    this.resyncListeners.forEach((listener) => listener());
  }
}

export const live = new LiveConnection();
