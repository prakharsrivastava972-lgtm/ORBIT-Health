import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BodyExplorerPage from './BodyExplorerPage';
import { sampleProfiles } from '@/data/profiles';
import { useAppStore } from '@/store/useAppStore';
import { useDataStore } from '@/store/useDataStore';

beforeEach(() => {
  localStorage.clear();
  useDataStore.setState({ measurements: {} });
  useAppStore.setState({ activeProfileId: sampleProfiles[0].id });
});

const group = () => screen.getByRole('group', { name: 'Body systems' });

describe('Body Explorer', () => {
  it('offers six system buttons and starts on the cardiovascular system', () => {
    render(<BodyExplorerPage />);
    expect(within(group()).getAllByRole('button')).toHaveLength(6);
    expect(within(group()).getByRole('button', { name: /cardiovascular/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: /cardiovascular system/i })).toBeInTheDocument();
  });

  it('switches system from the keyboard-accessible list', async () => {
    const user = userEvent.setup();
    render(<BodyExplorerPage />);
    await user.click(within(group()).getByRole('button', { name: /skeletal/i }));
    expect(screen.getByRole('heading', { level: 2, name: /skeletal system/i })).toBeInTheDocument();
    expect(screen.getByText('Not measurable from ordinary vitals')).toBeInTheDocument();
  });

  it('switches system when a region of the body map is clicked', async () => {
    const user = userEvent.setup();
    render(<BodyExplorerPage />);
    await user.click(screen.getByTestId('hotspot-immune'));
    expect(screen.getByRole('heading', { level: 2, name: /immune system/i })).toBeInTheDocument();
    expect(within(group()).getByRole('button', { name: /immune/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the latest related reading with its source', () => {
    render(<BodyExplorerPage />);
    expect(screen.getByText('Resting heart rate')).toBeInTheDocument();
    expect(screen.getAllByText(/Simulated/).length).toBeGreaterThan(0);
  });

  it('always shows what vitals cannot tell you and which assessments are needed', async () => {
    const user = userEvent.setup();
    render(<BodyExplorerPage />);
    for (const name of [/respiratory/i, /nervous/i, /muscular/i]) {
      await user.click(within(group()).getByRole('button', { name }));
      expect(screen.getByRole('heading', { name: /what ordinary vitals cannot tell you/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /dedicated assessments needed/i })).toBeInTheDocument();
    }
  });
});