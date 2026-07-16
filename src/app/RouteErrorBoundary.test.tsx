import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RouteErrorBoundary from "./RouteErrorBoundary";

function ExplodingPage(): never {
  throw new Error("route render failure");
}

describe("RouteErrorBoundary", () => {
  it("renders the branded fallback instead of a white screen when a page throws", () => {
    // React logs caught boundary errors in development; keep test output clean.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <RouteErrorBoundary>
        <ExplodingPage />
      </RouteErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the homepage" })).toHaveAttribute("href", "/");

    consoleError.mockRestore();
  });

  it("renders children when nothing throws", () => {
    render(
      <RouteErrorBoundary>
        <p>healthy page</p>
      </RouteErrorBoundary>,
    );

    expect(screen.getByText("healthy page")).toBeInTheDocument();
  });
});
