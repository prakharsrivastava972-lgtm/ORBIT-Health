import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OverviewPage from './OverviewPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OverviewPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {} });
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
});

describe('Mission Overview', () => {
  it('shows seeded simulated readings and an engine-based health status', () => {
    renderPage();
    expect(screen.getByText('Resting heart rate')).toBeInTheDocument();
    expect(screen.getByText('Blood pressure')).toBeInTheDocument();
    expect(screen.getAllByText('Simulated').length).toBeGreaterThan(1);
    const status = screen.getByTestId('overview-status');
    expect(within(status).getByRole('link', { name: /health insights/i })).toBeInTheDocument();
    expect(status).not.toHaveTextContent(/No health status is shown yet/i);
  });

  it('regenerates simulated data on request', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /regenerate simulated data/i }));
    expect(screen.getByText('Resting heart rate')).toBeInTheDocument();
    expect(useDataStore.getState().measurements[sampleProfiles[0].id].length).toBeGreaterThan(100);
  });
});