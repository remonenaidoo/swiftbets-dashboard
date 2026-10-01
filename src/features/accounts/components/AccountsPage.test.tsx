import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../../../test/renderWithProviders';
import { AccountsPage } from './AccountsPage';

const account = {
  userId: '0199a000-0000-7000-8000-000000000001',
  email: 'fan@example.com',
  username: null,
  emailVerified: true,
  status: 'Active',
  brand: 'swiftbets',
  country: 'ZA',
  currency: 'ZAR',
  roles: ['Customer'],
};

describe('AccountsPage', () => {
  it('finds an account by email and suspends it with a reason', async () => {
    const calls = mockApi((url, init) =>
      url === '/api/admin/users?email=fan%40example.com'
        ? { status: 200, body: account }
        : url === `/api/admin/users/${account.userId}/status` && init?.method === 'PUT'
          ? { status: 204 }
          : undefined,
    );
    renderWithProviders(<AccountsPage />);

    await userEvent.type(screen.getByLabelText('Customer email'), 'fan@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find' }));
    await userEvent.selectOptions(await screen.findByLabelText('Status'), 'suspended');
    expect(screen.getByRole('button', { name: 'Change status' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Reason/), 'chargeback under review');
    await userEvent.click(screen.getByRole('button', { name: 'Change status' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Status changed.');
    expect(calls).toContainEqual({ url: `/api/admin/users/${account.userId}/status`, method: 'PUT' });
  });

  it('says plainly when no account uses the email', async () => {
    mockApi((url) => (url.startsWith('/api/admin/users?email=') ? { status: 404, body: { status: 404, code: 'user_not_found', title: 'Not Found', correlationId: 'c' } } : undefined));
    renderWithProviders(<AccountsPage />);

    await userEvent.type(screen.getByLabelText('Customer email'), 'nobody@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find' }));

    expect(await screen.findByText('No account uses nobody@example.com.')).toBeInTheDocument();
  });

  it('explains why a self-exclusion cannot be lifted', async () => {
    mockApi((url, init) =>
      url.startsWith('/api/admin/users?email=')
        ? { status: 200, body: { ...account, status: 'SelfExcluded' } }
        : init?.method === 'PUT'
          ? { status: 422, body: { status: 422, code: 'self_exclusion_locked', title: 'Unprocessable', correlationId: 'c' } }
          : undefined,
    );
    renderWithProviders(<AccountsPage />);

    await userEvent.type(screen.getByLabelText('Customer email'), 'fan@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find' }));
    await userEvent.selectOptions(await screen.findByLabelText('Status'), 'active');
    await userEvent.type(screen.getByLabelText(/Reason/), 'asked to come back');
    await userEvent.click(screen.getByRole('button', { name: 'Change status' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A self-exclusion can only end when its period has run.');
  });
});
