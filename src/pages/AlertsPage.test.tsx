import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import AlertsPage from './AlertsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAlertStore } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const profile = sampleProfiles[0];
const SPO2 = 'Blood oxygen (SpO2) outside general reference range';

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AlertsPage />
    </MemoryRouter>,
  );
}

function addSpo2() {
  useDataStore.getState().ensureSeeded(profile);
  const now = new Date().toISOString();
  useDataStore.getState().addMeasurements(profile.id, [
    { id: 'test-spo2', astronautId: profile.id, metric: 'spo2', value: 88, unit: '%', takenAt: now, recordedAt: now, source: 'manual', context: 'rest' },
  ]);
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAlertStore.setState({ records: {} });
  useAppStore.setState({ activeProfileId: profile.id });
});

describe('Warning Center', () => {
  it('shows an urgent reading as an active alert with actions', () => {
    addSpo2();
    renderPage();
    expect(screen.getByTestId('alert-status')).toHaveAttribute('data-state', 'urgent');
    expect(screen.getByRole('heading', { name: SPO2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Acknowledge: ${SPO2}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Resolve: ${SPO2}` })).toBeInTheDocument();
  });

  it('moves an acknowledged flag to its own list while it still counts toward the status', async () => {
    const user = userEvent.setup();
    addSpo2();
    renderPage();
    await user.click(screen.getByRole('button', { name: `Acknowledge: ${SPO2}` }));
    const region = screen.getByRole('region', { name: /^acknowledged/i });
    expect(within(region).getByRole('heading', { name: SPO2 })).toBeInTheDocument();
    expect(screen.getByTestId('alert-status')).toHaveAttribute('data-state', 'urgent');
  });

  it('requires a note to resolve an urgent flag, then lists it as resolved', async () => {
    const user = userEvent.setup();
    addSpo2();
    renderPage();
    await user.click(screen.getByRole('button', { name: `Resolve: ${SPO2}` }));
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/required for urgent/i);

    await user.type(screen.getByLabelText(/resolution note/i), 'Rechecked and discussed with flight surgeon');
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));

    const region = screen.getByRole('region', { name: /^resolved/i });
    expect(within(region).getByText(SPO2)).toBeInTheDocument();
    expect(within(region).getByText(/discussed with flight surgeon/i)).toBeInTheDocument();
    expect(screen.getByTestId('alert-status')).toHaveAttribute('data-state', 'attention');
  });

  it('reopens a resolved flag', async () => {
    const user = userEvent.setup();
    addSpo2();
    renderPage();
    await user.click(screen.getByRole('button', { name: `Resolve: ${SPO2}` }));
    await user.type(screen.getByLabelText(/resolution note/i), 'Handled');
    await user.click(screen.getByRole('button', { name: /confirm resolve/i }));
    await user.click(screen.getByRole('button', { name: `Reopen: ${SPO2}` }));
    expect(screen.getByRole('button', { name: `Acknowledge: ${SPO2}` })).toBeInTheDocument();
    expect(screen.getByTestId('alert-status')).toHaveAttribute('data-state', 'urgent');
  });

  it('lets a support request be acknowledged but never resolved', () => {
    useDataStore.getState().ensureSeeded(profile);
    const date = format(new Date(), 'yyyy-MM-dd');
    useDataStore.getState().addCheckIn(profile.id, {
      id: `${profile.id}-checkin-${date}`, astronautId: profile.id, date,
      mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4, requestsSupport: true,
    });
    renderPage();
    expect(screen.getByRole('button', { name: /^Acknowledge: Support requested/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Resolve: Support requested/ })).not.toBeInTheDocument();
    expect(screen.getByText(/cannot be resolved here/i)).toBeInTheDocument();
  });
});