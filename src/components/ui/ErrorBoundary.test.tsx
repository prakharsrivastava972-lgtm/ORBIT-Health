import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

let shouldThrow = true;
function Maybe() {
  if (shouldThrow) throw new Error('boom');
  return <p>All good</p>;
}

describe('ErrorBoundary', () => {
  it('shows a recovery message instead of crashing, and recovers on retry', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/this page hit a problem/i);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('All good')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders children normally when nothing fails', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});