import { createBrowserRouter } from 'react-router';
import { AnomaliesPage } from '../../features/anomalies/components/AnomaliesPage';
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
      { path: 'faults', element: <FaultsPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
