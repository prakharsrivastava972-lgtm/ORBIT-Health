import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecommendationsPage from './RecommendationsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAlertStore } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const profile = sampleProfiles[0];

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RecommendationsPage />
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

describe('Recommendations', () => {
  it('always shows the general routine, labeled as not triggered by a flag', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Recommendations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /general routine \(not triggered by a flag\)/i })).toBeInTheDocument();
    expect(screen.getByText('Know your escalation path')).toBeInTheDocument();
  });

  it('turns an urgent reading into an escalation suggestion that names the flag', () => {
    addSpo2();
    renderPage();
    expect(screen.getByRole('heading', { name: 'Contact the flight surgeon now' })).toBeInTheDocument();
    expect(screen.getAllByText(/Blood oxygen \(SpO2\) outside general reference range/).length).toBeGreaterThan(0);
  });

  it('filters suggestions by category', async () => {
    const user = userEvent.setup();
    addSpo2();
    renderPage();
    await user.click(screen.getByRole('button', { name: /^sleep/i }));
    expect(screen.queryByRole('heading', { name: 'Contact the flight surgeon now' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^all/i }));
    expect(screen.getByRole('heading', { name: 'Contact the flight surgeon now' })).toBeInTheDocument();
  });
});