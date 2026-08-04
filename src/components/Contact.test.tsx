import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

// The component reads BACKEND_CONFIGURED from import.meta.env at module scope,
// so the env must be stubbed BEFORE the module is first evaluated — hence the
// dynamic import in beforeAll instead of a top-level import.
const { fromMock, insertMock } = vi.hoisted(() => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ insert: insertMock }));
  return { fromMock, insertMock };
});

// Intercepts the component's `await import("@/integrations/supabase/client")`.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
}));

let Contact: ComponentType;

beforeAll(async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.resetModules();
  Contact = (await import("./Contact")).default;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  fromMock.mockClear();
  insertMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fillAndSubmit = (overrides?: { company?: string }) => {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Project Type"), { target: { value: "Production" } });
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Analytical engine mix notes" },
  });
  if (overrides?.company) {
    const honeypot = document.getElementById("contact-company") as HTMLInputElement;
    fireEvent.change(honeypot, { target: { value: overrides.company } });
  }
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
};

// The builder returned by insert(); each test decides how the promise settles.
const insertResolving = (result: { error: unknown }) => {
  insertMock.mockReturnValue({ abortSignal: () => Promise.resolve(result) });
};

describe("Contact form", () => {
  it("shows the success state and moves focus to it after a clean insert", async () => {
    insertResolving({ error: null });
    render(<Contact />);

    fillAndSubmit();

    const successBox = await screen.findByRole("status");
    expect(successBox).toHaveTextContent(/thank you/i);
    await waitFor(() => expect(successBox).toHaveFocus());
    expect(fromMock).toHaveBeenCalledWith("contact_messages");
  });

  it("shows the error alert with a mailto fallback that preserves the typed message", async () => {
    insertResolving({ error: { message: "insert denied" } });
    render(<Contact />);

    fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/something went wrong/i);
    await waitFor(() => expect(alert).toHaveFocus());

    const mailto = screen.getByRole("link", { name: /email it to me directly/i });
    const href = mailto.getAttribute("href") ?? "";
    expect(href).toContain("mailto:zachscheffler@gmail.com");
    expect(href).toContain(encodeURIComponent("Analytical engine mix notes"));
    expect(href).toContain(encodeURIComponent("Ada Lovelace"));
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
  });

  it("shows the error alert when the insert promise rejects (e.g. chunk load failure)", async () => {
    insertMock.mockReturnValue({
      abortSignal: () => Promise.reject(new Error("network down")),
    });
    render(<Contact />);

    fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
  });

  it("aborts a hung insert after the 10s timeout and recovers into the error state", async () => {
    const controller = new AbortController();
    // jsdom's AbortSignal may lack the static timeout(), so patch by hand
    // instead of vi.spyOn (which refuses missing properties).
    const signalClass = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal };
    const originalTimeout = signalClass.timeout;
    const timeoutMock = vi.fn(() => controller.signal);
    signalClass.timeout = timeoutMock;

    try {
      // Never settles on its own — only the abort signal resolves it, exactly
      // like postgrest-js turning an abort into a resolved { error }.
      insertMock.mockReturnValue({
        abortSignal: (signal: AbortSignal) =>
          new Promise((resolve) => {
            signal.addEventListener("abort", () =>
              resolve({ error: new DOMException("Aborted", "AbortError") }),
            );
          }),
      });
      render(<Contact />);

      fillAndSubmit();

      const button = await screen.findByRole("button", { name: /sending/i });
      expect(button).toBeDisabled();
      expect(timeoutMock).toHaveBeenCalledWith(10_000);

      act(() => controller.abort());

      expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
      expect(screen.getByRole("button", { name: /send message/i })).not.toBeDisabled();
    } finally {
      signalClass.timeout = originalTimeout;
    }
  });

  it("silently pretends success when the honeypot field is filled, without touching the backend", async () => {
    render(<Contact />);

    fillAndSubmit({ company: "Totally Real Bots Inc" });

    expect(await screen.findByRole("status")).toHaveTextContent(/thank you/i);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
