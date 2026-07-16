import { Component, type ReactNode } from "react";

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  error: Error | null;
}

/**
 * Route-level error boundary. Layout keys this by pathname, so navigating
 * to another route always remounts a clean subtree.
 */
class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="max-w-md text-center">
            <h1 className="mb-3 text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              This section hit an unexpected error. Reloading the page usually fixes it.
            </p>
            <a href="/" className="text-primary underline hover:text-primary/90">
              Back to the homepage
            </a>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
