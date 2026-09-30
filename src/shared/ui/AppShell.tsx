import clsx from 'clsx';
import { NavLink, Outlet } from 'react-router';

const navigation = [
  { to: '/', label: 'Live feed', end: true },
  { to: '/anomalies', label: 'Anomalies', end: false },
  { to: '/incidents', label: 'Incidents', end: false },
  { to: '/faults', label: 'Fault injection', end: false },
];

export function AppShell() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-(--z-index-toast) focus:p-2">
        Skip to content
      </a>
      <nav aria-label="Primary" className="border-b border-border bg-surface-sunken p-4 md:border-b-0 md:border-r">
        <p className="mb-6 font-mono text-sm tracking-widest text-accent">SWIFTBETS OPS</p>
        <ul className="flex gap-2 md:flex-col">
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'block rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent',
                    isActive ? 'bg-surface-raised text-text' : 'text-text-muted hover:text-text',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" className="p-(--spacing-gutter)">
        <Outlet />
      </main>
    </div>
  );
}
