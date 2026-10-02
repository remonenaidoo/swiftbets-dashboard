import { FreeSpinsPanel } from './FreeSpinsPanel';

/** Casino operations: free spins now; provider reconciliation joins when the casino gateway serves it. */
export function CasinoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Casino</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <FreeSpinsPanel />
      </div>
    </div>
  );
}
