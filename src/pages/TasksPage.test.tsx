import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import TasksPage from './TasksPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';
import { useTaskStore } from '@/store/useTaskStore';
import type { Measurement, MetricKey } from '@/types';

const id = sampleProfiles[0].id;

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TasksPage />
    </MemoryRouter>,
  );
}

const reading = (metric: MetricKey, value: number): Measurement => {
  const now = new Date().toISOString();
  return { id: `t-${metric}`, astronautId: id, metric, value, unit: '', takenAt: now, recordedAt: now, source: 'manual' };
};

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: { [id]: [] }, checkIns: { [id]: [] } });
  useTaskStore.setState({ done: {} });
  useAppStore.setState({ activeProfileId: id });
});

describe('Daily Tasks', () => {
  it('starts with nothing done and explains that points reward logging', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Daily Tasks' })).toBeInTheDocument();
    expect(screen.getByTestId('task-progress')).toHaveTextContent('0 of 9');
    expect(screen.getByText(/reward logging, not results/i)).toBeInTheDocument();
  });

  it('marks a self-reported task done and lets you undo it', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = 'Complete your scheduled exercise session';
    await user.click(screen.getByRole('button', { name: `Mark done: ${title}` }));
    expect(screen.getByTestId('task-exercise')).toHaveAttribute('data-done', 'true');
    expect(screen.getByTestId('points')).toHaveTextContent('10');
    await user.click(screen.getByRole('button', { name: `Undo: ${title}` }));
    expect(screen.getByTestId('task-exercise')).toHaveAttribute('data-done', 'false');
    expect(screen.getByTestId('points')).toHaveTextContent('0');
  });

  it('completes the check-in task when a check-in for today exists', () => {
    const date = format(new Date(), 'yyyy-MM-dd');
    useDataStore.getState().addCheckIn(id, {
      id: `${id}-checkin-${date}`, astronautId: id, date, mood: 4, stress: 2, fatigue: 2, isolation: 2, sleepQuality: 4,
    });
    renderPage();
    expect(screen.getByTestId('task-checkin')).toHaveAttribute('data-done', 'true');
    expect(screen.getByTestId('milestone-first-checkin')).toHaveAttribute('data-earned', 'true');
  });

  it('completes the vitals task from today\'s readings', () => {
    useDataStore.getState().addMeasurements(id, [
      reading('hr', 60), reading('sbp', 116), reading('tempC', 36.7), reading('spo2', 97),
    ]);
    renderPage();
    expect(screen.getByTestId('task-vitals')).toHaveAttribute('data-done', 'true');
    expect(screen.getByTestId('milestone-first-reading')).toHaveAttribute('data-earned', 'true');
  });
});