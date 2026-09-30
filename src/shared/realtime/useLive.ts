import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { LiveDelta } from '../lib/types';
import { live, type LiveStatus } from './liveConnection';

export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(
    (onChange) => live.onStatus(onChange),
    () => live.status,
  );
}

/** Calls the handler for every delta of the given types; the handler may change between renders. */
export function useDeltas(types: readonly string[], handler: (delta: LiveDelta) => void): void {
  const handlerRef = useRef(handler);
  const key = types.join('|');
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    const wanted = new Set(key.split('|'));
    return live.onDelta((delta) => {
      if (wanted.has(delta.type)) {
        handlerRef.current(delta);
      }
    });
  }, [key]);
}

/** Re-reads the given queries whenever a delta of these types arrives or the live stream reports a gap. */
export function useLiveInvalidation(types: readonly string[], queryKey: readonly unknown[]): void {
  const queryClient = useQueryClient();
  const serialisedKey = JSON.stringify(queryKey);
  useDeltas(types, () => void queryClient.invalidateQueries({ queryKey: JSON.parse(serialisedKey) as unknown[] }));
  useEffect(
    () => live.onResync(() => void queryClient.invalidateQueries({ queryKey: JSON.parse(serialisedKey) as unknown[] })),
    [queryClient, serialisedKey],
  );
}
