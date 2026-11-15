import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BiometricsPage from './BiometricsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const id = sampleProfiles[0].id;
const stored = () => useDataStore.getState().measurements[id] ?? [];

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BiometricsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {} });
  useAppStore.setState({ activeProfileId: id });
});

describe('Biometrics page', () => {
  it('shows a validation error for an empty submission and saves nothing', async () => {
    const user = userEvent.setup();
    renderPage();
    const before = stored().length;
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    expect(await screen.findByText(/enter a value/i)).toBeInTheDocument();
    expect(stored().length).toBe(before);
  });

  it('saves a valid heart-rate reading as a manual entry', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/^value/i), '64');
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
    expect(stored().some((m) => m.source === 'manual' && m.metric === 'hr' && m.value === 64)).toBe(true);
  });

  it('saves blood pressure as a systolic and diastolic pair', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText(/^metric/i), 'bp');
    await user.type(screen.getByLabelText(/^systolic/i), '122');
    await user.type(screen.getByLabelText(/^diastolic/i), '78');
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    await screen.findByRole('status');
    const manual = stored().filter((m) => m.source === 'manual');
    expect(manual.map((m) => m.metric).sort()).toEqual(['dbp', 'sbp']);
  });

  it('deletes a reading from the table', async () => {
    const user = userEvent.setup();
    renderPage();
    const before = stored().length;
    await user.click(screen.getAllByRole('button', { name: /^delete/i })[0]);
    expect(stored().length).toBe(before - 1);
  });
});