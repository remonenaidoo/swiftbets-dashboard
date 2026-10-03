import { createBrowserRouter } from 'react-router';
import { AccountsPage } from '../../features/accounts/components/AccountsPage';
import { AnomaliesPage } from '../../features/anomalies/components/AnomaliesPage';
import { SettingsPage } from '../../features/settings/components/SettingsPage';
import { TradingPage } from '../../features/trading/components/TradingPage';
import { CasinoPage } from '../../features/casino/components/CasinoPage';
import { RiskPage } from '../../features/risk/components/RiskPage';
import { FinancePage } from '../../features/finance/components/FinancePage';
import { FaultsPage } from '../../features/faults/components/FaultsPage';
import { IncidentsPage } from '../../features/incidents/components/IncidentsPage';
import { LiveFeedPage } from '../../features/live-feed/components/LiveFeedPage';
import { AppShell } from '../../shared/ui/AppShell';
import { RequirePermission } from '../../shared/ui/RequirePermission';
import { ReportsPage } from '../../features/reports/components/ReportsPage';
import { RolesPage } from '../../features/roles/components/RolesPage';

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
      { path: 'settings', element: <SettingsPage /> },
      { path: 'trading', element: <TradingPage /> },
      { path: 'risk', element: <RiskPage /> },
      { path: 'casino', element: <CasinoPage /> },
      { path: 'reports', element: <RequirePermission permission="reports.read"><ReportsPage /></RequirePermission> },
      { path: 'roles', element: <RequirePermission permission="identity.roles.read"><RolesPage /></RequirePermission> },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename: '/ops' });
