import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from './ReportsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAlertStore } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const profile = sampleProfiles[0];

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ReportsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAlertStore.setState({ records: {} });
  useAppStore.setState({ activeProfileId: profile.id });
});

describe('Reports', () => {
  it('shows a labeled simulated report with all nine metrics', () => {
    renderPage();
    const sheet = screen.getByTestId('report-sheet');
    expect(within(sheet).getByRole('heading', { level: 2, name: /Mara Voss/ })).toBeInTheDocument();
    expect(within(sheet).getByText(/SIMULATED DEMONSTRATION DATA/)).toBeInTheDocument();
    expect(within(sheet).getAllByRole('row')).toHaveLength(10);
    expect(within(sheet).getByRole('heading', { name: /limits of this report/i })).toBeInTheDocument();
  });

  it('includes an urgent reading in the unresolved flags', () => {
    useDataStore.getState().ensureSeeded(profile);
    const now = new Date().toISOString();
    useDataStore.getState().addMeasurements(profile.id, [
      { id: 'test-spo2', astronautId: profile.id, metric: 'spo2', value: 88, unit: '%', takenAt: now, recordedAt: now, source: 'manual', context: 'rest' },
    ]);
    renderPage();
    expect(within(screen.getByTestId('report-sheet')).getByText(/Blood oxygen \(SpO2\) outside general reference range/)).toBeInTheDocument();
  });

  it('offers print, copy and download, and confirms a copy', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /copy text/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i);
  });
});