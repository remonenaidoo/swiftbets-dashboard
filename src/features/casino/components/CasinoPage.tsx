import { FreeSpinsPanel } from './FreeSpinsPanel';
import { ReconciliationPanel } from './ReconciliationPanel';

/** Casino operations: free spins and daily provider reconciliation. */
export function CasinoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Casino</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <FreeSpinsPanel />
        <ReconciliationPanel />
      </div>
    </div>
  );
}
