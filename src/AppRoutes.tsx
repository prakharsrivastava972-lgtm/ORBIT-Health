import { Route, Routes } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import NotFoundPage from '@/pages/NotFoundPage';
import { appRoutes } from '@/routes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {appRoutes.map((r) =>
          r.path === '/' ? (
            <Route key={r.path} index element={r.element} />
          ) : (
            <Route key={r.path} path={r.path.slice(1)} element={r.element} />
          ),
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}