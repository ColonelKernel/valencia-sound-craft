/**
 * The one AudioContext for the whole app.
 *
 * Browsers cap concurrent AudioContexts (~6), and every extra context runs
 * its own clock — schedulers on different contexts drift apart. Every tool
 * must obtain the context (and therefore the timebase) from here; creating
 * an AudioContext anywhere else is a defect (the e2e/grep gate enforces a
 * single creation site).
 *
 * The context is created lazily on first use — call this from user-gesture
 * handlers (play buttons), never at module scope — and is never closed:
 * tools stop their own nodes instead.
 */
declare global {
  interface Window {
    /** Observability hook: the shared context, for e2e assertions. */
    __vscAudioContext?: AudioContext;
  }
}

let sharedContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();

    if (typeof window !== "undefined") {
      window.__vscAudioContext = sharedContext;
    }
  }

  if (sharedContext.state === "suspended") {
    void sharedContext.resume();
  }

  return sharedContext;
}
