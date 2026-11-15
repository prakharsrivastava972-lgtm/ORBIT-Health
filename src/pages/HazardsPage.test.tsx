import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HazardsPage from './HazardsPage';
import { HAZARDS } from '@/data/hazards';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HazardsPage />
    </MemoryRouter>,
  );
}

const group = () => screen.getAllByRole('group', { name: 'Hazards' })[0];

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
});

describe('Hazard Monitor', () => {
  it('lists five hazards and starts on radiation, marked as not measurable', () => {
    renderPage();
    expect(within(group()).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 2, name: 'Radiation' })).toBeInTheDocument();
    expect(screen.getByText('Effects not measurable from ordinary vitals')).toBeInTheDocument();
    expect(screen.getByText(/not evidence of no exposure/i)).toBeInTheDocument();
  });

  it('switches hazard and shows the assessments needed', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(group()).getByRole('button', { name: /microgravity/i }));
    expect(screen.getByRole('heading', { level: 2, name: 'Microgravity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /dedicated assessments needed/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what ordinary vitals cannot tell you/i })).toBeInTheDocument();
  });

  it('changes the exposure context with the environment selector', async () => {
    const user = userEvent.setup();
    renderPage();
    const radiation = HAZARDS.find((h) => h.id === 'radiation')!;
    expect(screen.getByText(radiation.byEnvironment.lunar)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/mission environment to view/i), 'deep-space');
    expect(screen.getByText(radiation.byEnvironment['deep-space'])).toBeInTheDocument();
  });

  it('shows an SpO2 flag under the closed environment but not under radiation', async () => {
    const user = userEvent.setup();
    const profile = sampleProfiles[0];
    useDataStore.getState().ensureSeeded(profile);
    const now = new Date().toISOString();
    useDataStore.getState().addMeasurements(profile.id, [
      { id: 'test-spo2', astronautId: profile.id, metric: 'spo2', value: 88, unit: '%', takenAt: now, recordedAt: now, source: 'manual', context: 'rest' },
    ]);
    renderPage();
    const flagTitle = /Blood oxygen \(SpO2\) outside general reference range/;
    expect(screen.queryByRole('heading', { name: flagTitle })).not.toBeInTheDocument();
    await user.click(within(group()).getByRole('button', { name: /closed environment/i }));
    expect(screen.getByRole('heading', { name: flagTitle })).toBeInTheDocument();
    await user.click(within(group()).getByRole('button', { name: /radiation/i }));
    expect(screen.queryByRole('heading', { name: flagTitle })).not.toBeInTheDocument();
  });
});