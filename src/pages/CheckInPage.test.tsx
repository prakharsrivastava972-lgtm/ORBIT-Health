import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import CheckInPage from './CheckInPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const id = sampleProfiles[0].id;
const stored = () => useDataStore.getState().checkIns[id] ?? [];
const todayIso = () => format(new Date(), 'yyyy-MM-dd');

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CheckInPage />
    </MemoryRouter>,
  );
}

type User = ReturnType<typeof userEvent.setup>;
const pick = (user: User, group: RegExp, n: number) =>
  user.click(within(screen.getByRole('group', { name: group })).getByRole('radio', { name: String(n) }));

async function fillNormal(user: User) {
  await pick(user, /mood/i, 4);
  await pick(user, /stress/i, 2);
  await pick(user, /fatigue/i, 3);
  await pick(user, /isolation/i, 2);
  await pick(user, /sleep quality/i, 4);
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAppStore.setState({ activeProfileId: id });
});

describe('Behavioral Check-in page', () => {
  it('requires every rating and saves nothing when incomplete', async () => {
    const user = userEvent.setup();
    renderPage();
    const before = stored().length;
    await user.click(screen.getByRole('button', { name: /save check-in/i }));
    expect(await screen.findAllByText(/choose a rating/i)).toHaveLength(5);
    expect(stored().length).toBe(before);
  });

  it('saves a complete check-in for today', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillNormal(user);
    await user.click(screen.getByRole('button', { name: /save check-in/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/saved your check-in/i);
    const saved = stored().find((c) => c.date === todayIso());
    expect(saved).toMatchObject({ mood: 4, stress: 2, fatigue: 3, isolation: 2, sleepQuality: 4 });
    expect(saved?.requestsSupport).toBeUndefined();
  });

  it('escalates a support request as Urgent', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillNormal(user);
    await user.click(screen.getByRole('checkbox', { name: /talk to someone now/i }));
    await user.click(screen.getByRole('button', { name: /save check-in/i }));
    expect(await screen.findByRole('heading', { name: /support requested in latest check-in/i })).toBeInTheDocument();
    expect(screen.getByTestId('behavior-status')).toHaveTextContent(/urgent/i);
  });

  it('deletes a check-in from the table', async () => {
    const user = userEvent.setup();
    renderPage();
    const before = stored().length;
    await user.click(screen.getAllByRole('button', { name: /^delete check-in/i })[0]);
    expect(stored().length).toBe(before - 1);
  });
});