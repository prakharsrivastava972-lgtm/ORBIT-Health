import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { sampleProfiles } from '@/data/profiles';
import { useDataStore } from '@/store/useDataStore';
import { useProfileStore } from '@/store/useProfileStore';
import { resetEverything } from '@/utils/backup';

const id = sampleProfiles[0].id;

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SettingsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  resetEverything();
});

describe('Settings', () => {
  it('shows scenarios, profile, thresholds and data sections', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: /mission thresholds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export backup/i })).toBeInTheDocument();
  });

  it('validates the profile form and saves edits', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.clear(screen.getByLabelText('Name'));
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    expect(await screen.findByText('Enter a name.')).toBeInTheDocument();
    expect(useProfileStore.getState().overrides[id]).toBeUndefined();

    await user.type(screen.getByLabelText('Name'), 'Mara Voss');
    await user.clear(screen.getByLabelText('Callsign'));
    await user.type(screen.getByLabelText('Callsign'), 'Zed');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
    expect(useProfileStore.getState().overrides[id]?.callsign).toBe('Zed');
  });

  it('saves valid mission thresholds and rejects out-of-order ones', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Resting heart rate attention high'), '70');
    await user.type(screen.getByLabelText('Resting heart rate urgent high'), '60');
    await user.click(screen.getByRole('button', { name: /save thresholds/i }));
    expect(await screen.findByText(/must increase/i)).toBeInTheDocument();
    expect(useProfileStore.getState().overrides[id]?.thresholds).toBeUndefined();

    await user.clear(screen.getByLabelText('Resting heart rate urgent high'));
    await user.type(screen.getByLabelText('Resting heart rate urgent high'), '120');
    await user.click(screen.getByRole('button', { name: /save thresholds/i }));
    expect(await screen.findByText(/saved mission thresholds/i)).toBeInTheDocument();
    expect(useProfileStore.getState().overrides[id]?.thresholds?.hr).toEqual({ attentionHigh: 70, urgentHigh: 120 });
  });

  it('loads a scenario into the data store', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('radio', { name: /urgent escalation/i }));
    await user.click(screen.getByRole('button', { name: /load scenario/i }));
    expect(await screen.findByText(/Loaded "Urgent escalation"/)).toBeInTheDocument();
    expect(useDataStore.getState().measurements[id].some((m) => m.id.includes('-scn-'))).toBe(true);
    expect(useDataStore.getState().checkIns[id].some((c) => c.requestsSupport)).toBe(true);
  });

  it('resets all data only after confirmation', async () => {
    const user = userEvent.setup();
    useProfileStore.getState().update(id, { callsign: 'Zed' });
    renderPage();
    await user.click(screen.getByRole('button', { name: /reset all app data/i }));
    expect(useProfileStore.getState().overrides[id]).toBeDefined();
    await user.click(screen.getByRole('button', { name: /yes, reset everything/i }));
    expect(useProfileStore.getState().overrides).toEqual({});
    expect(await screen.findByText(/all app data was reset/i)).toBeInTheDocument();
  });
});