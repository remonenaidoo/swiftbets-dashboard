import { useState } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { useAccountByEmail } from '../api/accounts';
import { AuditTrail } from '../../compliance/components/AuditTrail';
import { CustomerCompliance } from '../../compliance/components/CustomerCompliance';
import { StatusForm } from './StatusForm';

export function AccountsPage() {
  const [input, setInput] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const account = useAccountByEmail(email);

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setEmail(input.trim() || null);
        }}
        className="flex gap-2"
      >
        <label htmlFor="account-email" className="sr-only">
          Customer email
        </label>
        <input
          id="account-email"
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="customer@example.com"
          className="flex-1 rounded-md border border-border bg-surface-sunken px-3 py-2 text-text"
        />
        <button type="submit" className="rounded-md border border-border px-4 py-2 text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent">
          Find
        </button>
      </form>

      {email && account.isPending ? <p className="text-text-muted">Looking up…</p> : null}
      {account.error instanceof ApiError && account.error.status === 404 ? <EmptyState title="No account">No account uses {email}.</EmptyState> : null}
      {account.error instanceof ApiError && account.error.status === 403 ? <EmptyState title="Not allowed">Your role cannot read customer accounts.</EmptyState> : null}

      {account.data && email ? (
        <article className="space-y-4 rounded-lg border border-border bg-surface-raised p-4" aria-label="Account">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-sm">
            <dt className="text-text-muted">Email</dt>
            <dd>
              {account.data.email ?? '—'} {account.data.emailVerified ? <span className="text-positive">(confirmed)</span> : <span className="text-warning">(unconfirmed)</span>}
            </dd>
            <dt className="text-text-muted">Account id</dt>
            <dd className="font-mono">{account.data.userId}</dd>
            <dt className="text-text-muted">Status</dt>
            <dd>{account.data.status}</dd>
            <dt className="text-text-muted">Brand · country · currency</dt>
            <dd>
              {account.data.brand} · {account.data.country} · {account.data.currency}
            </dd>
            <dt className="text-text-muted">Roles</dt>
            <dd>{account.data.roles.join(', ')}</dd>
          </dl>
          <StatusForm key={account.data.status} account={account.data} email={email} />
          <CustomerCompliance userId={account.data.userId} />
          <AuditTrail userId={account.data.userId} />
        </article>
      ) : null}
    </section>
  );
}
