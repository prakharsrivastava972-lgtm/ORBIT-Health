import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** When this changes (for example the route), a shown error is cleared. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ORBIT Health page error:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="panel p-6">
        <div className="flex items-center gap-2 text-status-urgent">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-lg font-semibold">This page hit a problem</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Something went wrong while showing this page. Your saved data was not changed. You can try again, or go to
          another page from the menu. If it keeps happening, export a backup in Settings and reset the app data.
        </p>
        <p className="mt-2 text-xs text-ink-faint">Details: {this.state.error.message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-line/60 px-4 py-2 text-sm text-ink-muted hover:border-accent/50 hover:text-ink"
          >
            Reload the app
          </button>
        </div>
      </section>
    );
  }
}