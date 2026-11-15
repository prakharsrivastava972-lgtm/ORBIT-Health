import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { appRoutes } from './routes';
import { sampleProfiles } from './data/profiles';
import { useAppStore } from './store/useAppStore';
import { useDataStore } from './store/useDataStore';

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {} });
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
});

describe('app shell and routing', () => {
  it('lists every route in the primary navigation', () => {
    renderAt();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getAllByRole('link')).toHaveLength(appRoutes.length);
  });

  it('every navigation item navigates to its page', async () => {
    const user = userEvent.setup();
    renderAt();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const route of appRoutes) {
      await user.click(within(nav).getByRole('link', { name: route.label }));
      expect(screen.getByRole('heading', { level: 1, name: route.label })).toBeInTheDocument();
    }
  });

  it('shows a not-found page for unknown addresses', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('switches the active astronaut profile from the header', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.selectOptions(screen.getByLabelText('Astronaut profile'), sampleProfiles[1].id);
    expect(screen.getByText(sampleProfiles[1].mission.name)).toBeInTheDocument();
    expect(useAppStore.getState().activeProfileId).toBe(sampleProfiles[1].id);
  });

  it('opens and closes the mobile navigation drawer', async () => {
    const user = userEvent.setup();
    renderAt();
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});