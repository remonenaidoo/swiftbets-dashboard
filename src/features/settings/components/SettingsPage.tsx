import clsx from 'clsx';
import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { formatMoney } from '../../../shared/lib/format';
import { currencies, keys, modes, toMinor, useChangeSetting, useHistory, useSettings, valueOf } from '../api/settings';

const button = 'rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50';
const field = 'mt-1 block w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-text';
const modeLabels: Record<string, string> = { open: 'Open', preMatchOnly: 'Pre-match only', closed: 'Closed' };

const refusals: Record<string, string> = {
  reason_required: 'Give a reason for the change.',
  invalid_value: 'That value is not allowed for this setting.',
  forbidden: 'Only an admin can change settings.',
};

const problem = (error: unknown) => (error instanceof ApiError ? (refusals[error.code] ?? error.message) : error ? 'That did not work. Try again.' : null);

/** Kill switch, placement mode and coupon limits. Every change needs a reason and is kept in the history. */
export function SettingsPage() {
  const settings = useSettings();
  const change = useChangeSetting();
  const [reason, setReason] = useState('');
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const killSwitchOn = valueOf(settings.data, keys.killSwitch) === 'on';
  const mode = valueOf(settings.data, keys.mode) ?? 'open';
  const error = problem(change.error) ?? problem(settings.error);
  const set = (key: string, value: string) => change.mutate({ key, value, reason: reason.trim() });
  const ready = !!reason.trim() && !change.isPending;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <label className="block max-w-xl text-sm text-text-muted">
        Reason for the change
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={400} className={field} />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="kill-title" className={clsx('space-y-3 rounded-md border p-4', killSwitchOn ? 'border-negative' : 'border-border')}>
        <h2 id="kill-title" className="text-lg font-semibold">
          Kill switch
        </h2>
        <p role="status" className={killSwitchOn ? 'font-semibold text-negative' : 'text-text-muted'}>
          {killSwitchOn ? 'On: all betting is stopped.' : 'Off: betting follows the placement mode.'}
        </p>
        <button type="button" className={button} disabled={!ready} onClick={() => set(keys.killSwitch, killSwitchOn ? 'off' : 'on')}>
          {killSwitchOn ? 'Turn kill switch off' : 'Turn kill switch on'}
        </button>
      </section>

      <section aria-labelledby="mode-title" className="space-y-3">
        <h2 id="mode-title" className="text-lg font-semibold">
          Placement mode
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Placement mode">
          {modes.map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} className={clsx(button, mode === m && 'bg-surface-raised font-semibold')} disabled={!ready || mode === m} onClick={() => set(keys.mode, m)}>
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="limits-title" className="space-y-3">
        <h2 id="limits-title" className="text-lg font-semibold">
          Coupon limits
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {currencies.flatMap((currency) => [
            <LimitRow key={`stake-${currency}`} label={`Max stake (${currency})`} settingKey={keys.maxStake(currency)} currency={currency} current={valueOf(settings.data, keys.maxStake(currency))} disabled={!ready} onSave={set} onHistory={setHistoryKey} />,
            <LimitRow key={`payout-${currency}`} label={`Max payout (${currency})`} settingKey={keys.maxPayout(currency)} currency={currency} current={valueOf(settings.data, keys.maxPayout(currency))} disabled={!ready} onSave={set} onHistory={setHistoryKey} />,
          ])}
        </ul>
      </section>

      {historyKey ? <History settingKey={historyKey} onClose={() => setHistoryKey(null)} /> : null}
    </div>
  );
}

function LimitRow(props: { label: string; settingKey: string; currency: string; current: string | undefined; disabled: boolean; onSave: (key: string, value: string) => void; onHistory: (key: string) => void }) {
  const [amount, setAmount] = useState('');
  const minor = toMinor(amount);
  return (
    <li className="space-y-2 rounded-md border border-border p-3 text-sm">
      <p className="flex justify-between gap-2">
        <span className="font-medium">{props.label}</span>
        <span className="text-text-muted">{props.current ? formatMoney({ minorUnits: Number(props.current), currency: props.currency }) : 'No limit'}</span>
      </p>
      <div className="flex items-end gap-2">
        <label className="flex-1 text-text-muted">
          New amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label={`New ${props.label.toLowerCase()}`} className={field} />
        </label>
        <button type="button" className={button} disabled={props.disabled || minor === null} onClick={() => minor !== null && props.onSave(props.settingKey, String(minor))}>
          Save
        </button>
        <button type="button" className={button} onClick={() => props.onHistory(props.settingKey)} aria-label={`History of ${props.label.toLowerCase()}`}>
          History
        </button>
      </div>
    </li>
  );
}

function History({ settingKey, onClose }: { settingKey: string; onClose: () => void }) {
  const history = useHistory(settingKey);
  return (
    <section aria-labelledby="history-title" className="space-y-2">
      <header className="flex items-center gap-3">
        <h2 id="history-title" className="text-lg font-semibold">
          History of <span className="font-mono">{settingKey}</span>
        </h2>
        <button type="button" className={button} onClick={onClose}>
          Close
        </button>
      </header>
      {history.error ? <p className="text-text-muted">Never changed.</p> : null}
      <ol className="space-y-1 text-sm">
        {history.data?.map((h) => (
          <li key={h.version}>
            <span className="font-mono">v{h.version}</span> {h.value} by {h.changedBy}: {h.reason}
          </li>
        ))}
      </ol>
    </section>
  );
}
