import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InsightsPage from './InsightsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <InsightsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {} });
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
});

describe('Health Insights page', () => {
  it('shows overall status, a row per metric and the rule explanations', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Health Insights' })).toBeInTheDocument();
    expect(screen.getByTestId('overall-status')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(10);
    expect(screen.getByRole('heading', { name: /how the rules work/i })).toBeInTheDocument();
  });

  it('shows an Urgent flag with its provenance after an extreme reading is saved', () => {
    const profile = sampleProfiles[0];
    useDataStore.getState().ensureSeeded(profile);
    const now = new Date().toISOString();
    useDataStore.getState().addMeasurements(profile.id, [
      {
        id: 'test-spo2',
        astronautId: profile.id,
        metric: 'spo2',
        value: 88,
        unit: '%',
        takenAt: now,
        recordedAt: now,
        source: 'manual',
        context: 'rest',
      },
    ]);
    renderPage();
    expect(screen.getByTestId('overall-status')).toHaveTextContent(/urgent/i);
    expect(
      screen.getByRole('heading', { name: /Blood oxygen \(SpO2\) outside general reference range/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Basis: General reference range/).length).toBeGreaterThan(0);
  });

  it('says plainly when there is too little history for a personal baseline', () => {
    useAppStore.setState({ activeProfileId: sampleProfiles[2].id });
    renderPage();
    expect(screen.getAllByText(/No baseline/i).length).toBeGreaterThan(0);
  });
});