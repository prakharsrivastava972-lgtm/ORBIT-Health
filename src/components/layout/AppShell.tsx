import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { appRoutes } from '@/routes';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // On route change: close the mobile drawer, update the title, move focus to the content.
  useEffect(() => {
    setNavOpen(false);
    const match = appRoutes.find((r) => r.path === pathname);
    document.title = `${match ? match.label : 'Page not found'} · ORBIT Health`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className="min-h-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-space-800 focus:px-4 focus:py-2 focus:text-accent"
      >
        Skip to main content
      </a>

      <Sidebar open={navOpen} />

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-space-950/70 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <Header navOpen={navOpen} onMenuClick={() => setNavOpen((o) => !o)} />
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 focus:outline-none sm:px-6"
        >
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}