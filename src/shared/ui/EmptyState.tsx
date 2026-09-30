import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-surface-raised p-8 text-center" aria-live="polite">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <p className="mt-2 text-sm text-text-muted">{children}</p> : null}
    </section>
  );
}
