import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HistoryPage from './HistoryPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

const id = sampleProfiles[0].id;

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HistoryPage />
    </MemoryRouter>,
  );
}

const dataRows = () => within(screen.getByRole('table')).getAllByRole('row').length - 1;

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {}, checkIns: {} });
  useAppStore.setState({ activeProfileId: id });
});

describe('History and Charts', () => {
  it('draws a chart from stored readings with a text alternative and a table', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'History and Charts' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Resting heart rate: \d+ readings/ })).toBeInTheDocument();
    expect(dataRows()).toBeGreaterThan(10);
    expect(screen.getByText(/Personal baseline|Shaded band/i)).toBeInTheDocument();
  });

  it('narrows the table when a shorter date range is chosen', async () => {
    const user = userEvent.setup();
    renderPage();
    const all30 = dataRows();
    await user.click(screen.getByRole('button', { name: '7 days' }));
    const seven = dataRows();
    expect(seven).toBeGreaterThan(0);
    expect(seven).toBeLessThan(all30);
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches metric', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Metric'), 'spo2');
    expect(screen.getByRole('heading', { name: 'Blood oxygen (SpO2) trend' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Blood oxygen \(SpO2\): \d+ readings/ })).toBeInTheDocument();
  });

  it('shows an empty state when there are no readings', () => {
    useDataStore.setState({ measurements: { [id]: [] }, checkIns: { [id]: [] } });
    renderPage();
    expect(screen.getByText(/No readings in this range/i)).toBeInTheDocument();
    expect(screen.getByText('Nothing to show.')).toBeInTheDocument();
  });
});