import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../../../shared/lib/apiError';
import { useSignIn } from '../../../shared/lib/session';

export function SignInPage() {
  const signIn = useSignIn();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const errorId = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    signIn.mutate({ username, password });
  };

  const error =
    signIn.error instanceof ApiError && signIn.error.status === 401
      ? 'Username or password is incorrect.'
      : signIn.error
        ? 'Sign-in failed. Try again.'
        : null;

  return (
    <main id="main" className="grid min-h-screen place-items-center p-(--spacing-gutter)">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-surface-raised p-6" aria-describedby={error ? errorId : undefined}>
        <div>
          <p className="font-mono text-sm tracking-widest text-accent">SWIFTBETS OPS</p>
          <h1 className="mt-2 text-xl font-semibold">Sign in</h1>
        </div>
        <label className="block text-sm">
          <span className="text-text-muted">Username</span>
          <input
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-accent"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-text-muted">Password</span>
          <input
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-accent"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-negative">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={signIn.isPending}
          className="w-full rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {signIn.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
