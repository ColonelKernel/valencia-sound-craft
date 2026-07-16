import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Catches render crashes inside an analytics tab (historically Recharts DOM
 * reconciliation) and offers a retry without taking down the page. Resets
 * automatically when the active tab changes.
 */
class TabErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tab render error:", error, info);
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong rendering this tab.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TabErrorBoundary;
