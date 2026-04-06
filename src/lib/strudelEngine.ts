import { rhythmBus, type RhythmPayload } from "@/lib/rhythmBus";

// ─── Types ─────────────────────────────────────────

export interface StrudelEngineState {
  playing: boolean;
  tempo: number;
  volume: number;
  currentPattern: string | null;
  ready: boolean;
  error: string | null;
}

export type StrudelStateListener = (state: StrudelEngineState) => void;

// ─── Engine ────────────────────────────────────────

class StrudelEngine {
  private state: StrudelEngineState = {
    playing: false,
    tempo: 120,
    volume: 0.8,
    currentPattern: null,
    ready: false,
    error: null,
  };

  private listeners = new Set<StrudelStateListener>();
  private repl: any = null;
  private initPromise: Promise<void> | null = null;
  private busUnsubs: (() => void)[] = [];
  private audioUnlocked = false;

  // ── Init ────────────────────────────────────────

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      if (typeof window === "undefined") return;

      await this.loadScript();

      const { repl } = await (window as any).initStrudel();
      this.repl = repl;

      this.updateState({ ready: true, error: null });
      this.subscribeBus();
    } catch (err: any) {
      console.error("[StrudelEngine] Init failed:", err);
      this.updateState({ error: err.message || "Init failed" });
    }
  }

  private async loadScript(): Promise<void> {
    if ((window as any).initStrudel) return;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@strudel/web@latest";
    script.async = true;

    document.body.appendChild(script);

    await new Promise((res, rej) => {
      script.onload = res;
      script.onerror = rej;
    });
  }

  // ── Audio unlock (REQUIRED) ──────────────────────

  unlockAudio(): void {
    this.audioUnlocked = true;
  }

  // ── Bus ─────────────────────────────────────────

  private subscribeBus(): void {
    this.busUnsubs.push(
      rhythmBus.on("PLAY_REQUESTED", (d) => this.playFromPayload(d)),
      rhythmBus.on("STOP_REQUESTED", () => this.stop()),
      rhythmBus.on("TEMPO_CHANGED", ({ tempo }) => this.setTempo(tempo)),
      rhythmBus.on("VOLUME_CHANGED", ({ volume }) => this.setVolume(volume)),
      rhythmBus.on("PATTERN_UPDATED", (d) => this.updateFromPayload(d)),
      rhythmBus.on("MAP_HOVER_PREVIEW", (d) => this.playFromPayload(d)),
      rhythmBus.on("RHYTHM_SELECTED", (d) => this.playFromPayload(d)),
    );
  }

  // ── Public API ──────────────────────────────────

  async play(pattern: string, options?: { tempo?: number; volume?: number }) {
    await this.init();

    if (!this.audioUnlocked) {
      console.warn("Audio not unlocked yet");
      return;
    }

    if (!this.repl) return;

    try {
      if (options?.tempo) this.state.tempo = options.tempo;
      if (options?.volume !== undefined) this.state.volume = options.volume;

      await this.repl.evaluate(pattern);

      if (this.repl.scheduler) {
        this.repl.scheduler.setCps(this.state.tempo / 60 / 4);
        this.repl.scheduler.start();
      }

      this.updateState({
        playing: true,
        currentPattern: pattern,
        error: null,
      });
    } catch (err: any) {
      console.error("[StrudelEngine] Play error:", err);
      this.updateState({ error: err.message });
    }
  }

  stop() {
    if (!this.repl?.scheduler) return;

    try {
      this.repl.scheduler.stop();
      this.updateState({ playing: false });
    } catch (err) {
      console.error("[StrudelEngine] Stop error:", err);
    }
  }

  async update(pattern: string) {
    if (!this.repl || !this.state.playing) return;

    try {
      await this.repl.evaluate(pattern);
      this.updateState({ currentPattern: pattern, error: null });
    } catch (err: any) {
      console.error("[StrudelEngine] Update error:", err);
      this.updateState({ error: err.message });
    }
  }

  setTempo(bpm: number) {
    this.state.tempo = Math.max(20, Math.min(400, bpm));

    if (this.repl?.scheduler) {
      this.repl.scheduler.setCps(this.state.tempo / 60 / 4);
    }

    this.notify();
  }

  setVolume(vol: number) {
    this.state.volume = Math.max(0, Math.min(1, vol));
    this.notify();
  }

  subscribe(fn: StrudelStateListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getState() {
    return { ...this.state };
  }

  // ── Payload helpers ─────────────────────────────

  private playFromPayload(data: RhythmPayload) {
    const pattern = this.payloadToPattern(data);
    if (pattern) this.play(pattern, { tempo: data.tempo });
  }

  private updateFromPayload(data: RhythmPayload) {
    const pattern = this.payloadToPattern(data);
    if (pattern) this.update(pattern);
  }

  private payloadToPattern(data: RhythmPayload): string | null {
    if (data.pattern) return data.pattern;

    if (data.layers?.length) {
      return `stack(
${data.layers.map((l) => `${l.pattern}.gain(${l.volume})`).join(",\n")}
)`;
    }

    return null;
  }

  // ── State ──────────────────────────────────────

  private updateState(partial: Partial<StrudelEngineState>) {
    Object.assign(this.state, partial);
    this.notify();
  }

  private notify() {
    const snapshot = { ...this.state };
    this.listeners.forEach((fn) => fn(snapshot));
  }

  // ── Cleanup ────────────────────────────────────

  destroy() {
    this.stop();
    this.busUnsubs.forEach((fn) => fn());
    this.listeners.clear();
  }
}

export const strudelEngine = new StrudelEngine();
