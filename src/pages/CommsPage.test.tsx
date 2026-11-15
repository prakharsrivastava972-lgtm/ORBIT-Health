import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CommsPage from './CommsPage';
import { sampleProfiles } from '@/data/profiles';
import { useAlertStore } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { useCommsStore } from '@/store/useCommsStore';
import { useDataStore } from '@/store/useDataStore';

const profile = sampleProfiles[0];
const stored = () => useCommsStore.getState().threads[profile.id] ?? [];

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CommsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAlertStore.setState({ records: {} });
  useCommsStore.setState({ threads: {} });
  useAppStore.setState({ activeProfileId: profile.id });
});

describe('Flight Surgeon Comms', () => {
  it('is labeled as a simulation and starts empty', () => {
    renderPage();
    expect(screen.getByText(/No real clinician reads these messages/i)).toBeInTheDocument();
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
  });

  it('rejects an empty message', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/write a message/i);
    expect(stored()).toHaveLength(0);
  });

  it('sends a message, shows it in transit, and holds the reply back until it is delivered', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Message'), 'My sleep has been poor');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(screen.getByText('My sleep has been poor')).toBeInTheDocument();
    expect(screen.getByText(/Awaiting reply/i)).toBeInTheDocument();
    expect(stored()).toHaveLength(2);
    expect(stored()[1].from).toBe('flight-surgeon');
    expect(stored()[1].simulated).toBe(true);
    expect(screen.queryByText(/automated reply, not medical advice/i)).not.toBeInTheDocument();
  });

  it('attaches the report summary when asked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Message'), 'Please review');
    await user.click(screen.getByRole('checkbox', { name: /attach current report summary/i }));
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/Attached summary/)).toBeInTheDocument();
    expect(stored()[0].body).toMatch(/Status:/);
  });
});