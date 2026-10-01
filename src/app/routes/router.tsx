import { createBrowserRouter } from 'react-router';
import { AccountsPage } from '../../features/accounts/components/AccountsPage';
import { AnomaliesPage } from '../../features/anomalies/components/AnomaliesPage';
import { FinancePage } from '../../features/finance/components/FinancePage';
import { FaultsPage } from '../../features/faults/components/FaultsPage';
import { IncidentsPage } from '../../features/incidents/components/IncidentsPage';
import { LiveFeedPage } from '../../features/live-feed/components/LiveFeedPage';
import { AppShell } from '../../shared/ui/AppShell';

export const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LiveFeedPage /> },
      { path: 'anomalies', element: <AnomaliesPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'incidents/:incidentId', element: <IncidentsPage /> },
      { path: 'faults', element: <FaultsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'finance', element: <FinancePage /> },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename: '/ops' });
