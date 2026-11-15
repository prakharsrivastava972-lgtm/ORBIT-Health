import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Activity,
  PersonStanding,
  Brain,
  ClipboardCheck,
  ShieldAlert,
  Lightbulb,
  TrendingUp,
  Siren,
  ListChecks,
  FileText,
  Radio,
  Settings,
} from 'lucide-react';
import OverviewPage from '@/pages/OverviewPage';
import BiometricsPage from '@/pages/BiometricsPage';
import BodyExplorerPage from '@/pages/BodyExplorerPage';
import InsightsPage from '@/pages/InsightsPage';
import CheckInPage from '@/pages/CheckInPage';
import HazardsPage from '@/pages/HazardsPage';
import RecommendationsPage from '@/pages/RecommendationsPage';
import HistoryPage from '@/pages/HistoryPage';
import AlertsPage from '@/pages/AlertsPage';
import TasksPage from '@/pages/TasksPage';
import ReportsPage from '@/pages/ReportsPage';
import CommsPage from '@/pages/CommsPage';
import SettingsPage from '@/pages/SettingsPage';

export interface AppRoute {
  path: string;
  /** Must equal the page's h1 title. */
  label: string;
  group: string;
  icon: LucideIcon;
  element: ReactElement;
}

export const appRoutes: AppRoute[] = [
  { path: '/', label: 'Mission Overview', group: 'Mission', icon: LayoutDashboard, element: <OverviewPage /> },
  { path: '/alerts', label: 'Warning Center', group: 'Mission', icon: Siren, element: <AlertsPage /> },
  { path: '/biometrics', label: 'Biometrics', group: 'Monitor', icon: Activity, element: <BiometricsPage /> },
  { path: '/body', label: 'Body Explorer', group: 'Monitor', icon: PersonStanding, element: <BodyExplorerPage /> },
  { path: '/insights', label: 'Health Insights', group: 'Monitor', icon: Brain, element: <InsightsPage /> },
  { path: '/check-in', label: 'Behavioral Check-in', group: 'Monitor', icon: ClipboardCheck, element: <CheckInPage /> },
  { path: '/hazards', label: 'Hazard Monitor', group: 'Monitor', icon: ShieldAlert, element: <HazardsPage /> },
  { path: '/history', label: 'History and Charts', group: 'Monitor', icon: TrendingUp, element: <HistoryPage /> },
  { path: '/recommendations', label: 'Recommendations', group: 'Act', icon: Lightbulb, element: <RecommendationsPage /> },
  { path: '/tasks', label: 'Daily Tasks', group: 'Act', icon: ListChecks, element: <TasksPage /> },
  { path: '/reports', label: 'Reports', group: 'Communicate', icon: FileText, element: <ReportsPage /> },
  { path: '/comms', label: 'Flight Surgeon Comms', group: 'Communicate', icon: Radio, element: <CommsPage /> },
  { path: '/settings', label: 'Settings', group: 'System', icon: Settings, element: <SettingsPage /> },
];

export const navGroups = Array.from(new Set(appRoutes.map((r) => r.group))).map((group) => ({
  group,
  items: appRoutes.filter((r) => r.group === group),
}));