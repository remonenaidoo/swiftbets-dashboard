import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatTime } from '../../../shared/lib/format';
import { useFreeSpins, useGames, useGrantFreeSpins } from '../api/casino';

const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Grant a customer free spins on one game and see what they still have. */
export function FreeSpinsPanel() {
  const games = useGames();
  const grant = useGrantFreeSpins();
  const [punterId, setPunterId] = useState('');
  const [gameId, setGameId] = useState('');
  const [spins, setSpins] = useState('10');
  const [days, setDays] = useState('7');
  const valid = uuid.test(punterId.trim());
  const grants = useFreeSpins(valid ? punterId.trim() : null);
  const count = Number.parseInt(spins, 10);
  const error = grant.error instanceof ApiError ? grant.error.message : grant.error ? 'That did not work. Try again.' : null;

  const submit = () =>
    grant.mutate({ punterId: punterId.trim(), gameId: gameId || games.data?.[0]?.gameId || '', spins: count, expiresAt: new Date(Date.now() + Number(days) * 86_400_000).toISOString() });

  return (
    <section aria-labelledby="spins-title" className="space-y-3 rounded-md border border-border p-4 text-sm">
      <h2 id="spins-title" className="text-lg font-semibold">
        Free spins
      </h2>
      <label className="block text-text-muted">
        Customer id
        <input className={field} value={punterId} onChange={(e) => setPunterId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-text-muted">
          Game
          <select className={field} value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {games.data?.map((g) => (
              <option key={g.gameId} value={g.gameId}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-text-muted">
          Spins
          <input className={field} inputMode="numeric" value={spins} onChange={(e) => setSpins(e.target.value)} />
        </label>
        <label className="block text-text-muted">
          Expires in (days)
          <input className={field} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-negative">
          {error}
        </p>
      ) : null}
      {grant.isSuccess ? <p role="status" className="text-positive">Granted {grant.data.granted} spins on {grant.data.gameId}.</p> : null}
      <button type="button" className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={!valid || !(count >= 1 && count <= 1000) || grant.isPending || !games.data?.length} onClick={submit}>
        Grant spins
      </button>
      {grants.data && grants.data.length > 0 ? (
        <table className="w-full text-left">
          <caption className="sr-only">Free-spin grants</caption>
          <thead className="text-text-muted">
            <tr>
              <th className="py-1">Game</th>
              <th>Remaining</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {grants.data.map((g) => (
              <tr key={g.grantId} className="border-t border-border">
                <td className="py-1">{g.gameId}</td>
                <td>
                  {g.remaining} / {g.granted}
                </td>
                <td>{formatTime(g.expiresAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : valid && grants.isSuccess ? (
        <p className="text-text-muted">No free spins for this customer.</p>
      ) : null}
    </section>
  );
}
