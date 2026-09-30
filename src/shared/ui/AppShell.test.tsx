import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../../app/routes/router';

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('AppShell', () => {
  it('marks the current section as active in the primary navigation', () => {
    renderAt('/incidents');

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Incidents' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'No incidents' })).toBeInTheDocument();
  });

  it('does not mark other sections as active', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: 'Incidents' })).not.toHaveAttribute('aria-current');
  });
});
