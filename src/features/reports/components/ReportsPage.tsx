import { useState } from "react";
import { ApiError } from "../../../shared/lib/apiError";
import { formatMoney, formatTime } from "../../../shared/lib/format";
import { useDaily, useReconcile, useReconciliations } from "../api/reports";

const rand = (minorUnits: number) =>
  formatMoney({ minorUnits, currency: "ZAR" });
const isoDay = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const field =
  "mt-1 block rounded-md border border-border bg-surface-sunken px-3 py-2 text-text";

/** Finance: turnover, payouts and GGR per day from the warehouse, the CSV export, and reconciliation to the ledger. */
export function ReportsPage() {
  const [from, setFrom] = useState(() => isoDay(-6));
  const [to, setTo] = useState(() => isoDay(0));
  const daily = useDaily(from, to);
  const runs = useReconciliations();
  const reconcile = useReconcile();
  const error =
    reconcile.error instanceof ApiError
      ? reconcile.error.message
      : reconcile.error
        ? "That did not work. Try again."
        : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <section
        aria-labelledby="daily-title"
        className="space-y-3 rounded-md border border-border p-4 text-sm"
      >
        <div className="flex flex-wrap items-end gap-3">
          <h2 id="daily-title" className="mr-auto text-lg font-semibold">
            Daily figures
          </h2>
          <label className="text-text-muted">
            From
            <input
              className={field}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-text-muted">
            To
            <input
              className={field}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <a
            className="rounded-md border border-border px-3 py-2 font-semibold"
            href={`/api/admin/reports/daily.csv?from=${from}&to=${to}`}
            download
          >
            Download CSV
          </a>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-text-muted">
              <tr>
                <th className="py-1">Day</th>
                <th>Coupons</th>
                <th>Sports turnover</th>
                <th>Sports payouts</th>
                <th>Casino staked</th>
                <th>Casino returned</th>
                <th>GGR</th>
              </tr>
            </thead>
            <tbody>
              {daily.data?.map((d) => (
                <tr key={d.day} className="border-t border-border">
                  <td className="py-1">{d.day}</td>
                  <td>{d.coupons}</td>
                  <td>{rand(d.sportsTurnover)}</td>
                  <td>{rand(d.sportsPayouts)}</td>
                  <td>{rand(d.casinoStaked)}</td>
                  <td>{rand(d.casinoReturned)}</td>
                  <td
                    className={
                      d.ggr < 0
                        ? "font-semibold text-negative"
                        : "font-semibold text-positive"
                    }
                  >
                    {rand(d.ggr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {daily.isSuccess && daily.data.length === 0 ? (
          <p className="text-text-muted">No activity in this range.</p>
        ) : null}
      </section>

      <section
        aria-labelledby="recon-title"
        className="space-y-3 rounded-md border border-border p-4 text-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="recon-title" className="mr-auto text-lg font-semibold">
            Reconciliation to the ledger
          </h2>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-2 font-semibold text-white disabled:opacity-50"
            disabled={reconcile.isPending}
            onClick={() => reconcile.mutate(to)}
          >
            Reconcile {to}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-negative">
            {error}
          </p>
        ) : null}
        <ul className="space-y-1">
          {runs.data?.map((r) => (
            <li
              key={r.runId}
              className="flex flex-wrap justify-between gap-2 border-t border-border py-1"
            >
              <span>
                {r.day} · checked {formatTime(r.ranAt)}
              </span>
              <span
                className={
                  r.matched ? "text-positive" : "font-semibold text-negative"
                }
              >
                {r.matched
                  ? "Matches the ledger"
                  : r.mismatches
                      .map(
                        (m) =>
                          `${m.figure}: ${rand(m.warehouse)} vs ledger ${rand(m.ledger)}`,
                      )
                      .join("; ")}
              </span>
            </li>
          ))}
        </ul>
        {runs.isSuccess && runs.data.length === 0 ? (
          <p className="text-text-muted">No reconciliations yet.</p>
        ) : null}
      </section>
    </div>
  );
}
