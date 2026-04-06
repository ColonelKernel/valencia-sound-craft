/**
 * Strudel Audio Engine — isolated playback module.
 *
 * Exposes a strict API contract so the engine can be swapped later
 * (Web MIDI, Ableton Link, etc.) without changing consuming code.
 *
 * Uses @strudel/web for browser-native pattern evaluation & audio.
 */

import { rhythmBus, type RhythmPayload, type RhythmLayer } from '@/lib/rhythmBus';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StrudelEngineState {
  playing: boolean;
  tempo: number;
  volume: number;
  currentPattern: string | null;
  ready: boolean;
  error: string | null;
}

export type StrudelStateListener = (state: StrudelEngineState) => void;

// ─── Engine ─────────────────────────────────────────────────────────────────

class StrudelEngine {
  private state: StrudelEngineState = {
    playing: false,
    tempo: 120,
    volume: 0.8,
    currentPattern: null,
    ready: false,
    error: null,
  };

  private stateListeners = new Set<StrudelStateListener>();
  private strudelRepl: any = null;
  private initPromise: Promise<void> | null = null;
  private busUnsubs: (() => void)[] = [];

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /** Initialize Strudel once. Safe to call multiple times. */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      // Dynamic import so the bundle only loads when needed
      const strudelWeb = await import('@strudel/web');
      const { initStrudel } = strudelWeb;

      const { repl } = await initStrudel({
        prebake: async () => {
          // Minimal prebake — just load the mini notation + webaudio
        },
      });

      this.strudelRepl = repl;
      this.updateState({ ready: true, error: null });
      this._subscribeBus();
    } catch (err: any) {
      console.error('[StrudelEngine] Init failed:', err);
      this.updateState({ error: err.message || 'Failed to initialize Strudel' });
    }
  }

  /** Subscribe to rhythm bus events */
  private _subscribeBus(): void {
    this.busUnsubs.push(
      rhythmBus.on('PLAY_REQUESTED', (data) => this.playFromPayload(data)),
      rhythmBus.on('STOP_REQUESTED', () => this.stop()),
      rhythmBus.on('TEMPO_CHANGED', ({ tempo }) => this.setTempo(tempo)),
      rhythmBus.on('VOLUME_CHANGED', ({ volume }) => this.setVolume(volume)),
      rhythmBus.on('PATTERN_UPDATED', (data) => this.updateFromPayload(data)),
      rhythmBus.on('MAP_HOVER_PREVIEW', (data) => this.playFromPayload(data)),
      rhythmBus.on('RHYTHM_SELECTED', (data) => this.playFromPayload(data)),
    );
  }

  // ── Public API (strict contract) ──────────────────────────────────────

  async play(pattern: string, options?: { tempo?: number; volume?: number }): Promise<void> {
    await this.init();
    if (!this.strudelRepl) return;
    try {
      if (options?.tempo) this.state.tempo = options.tempo;
      if (options?.volume !== undefined) this.state.volume = options.volume;

      await this.strudelRepl.evaluate(pattern);
      this.strudelRepl.scheduler?.setCps(this.state.tempo / 60 / 4);
      this.strudelRepl.scheduler?.start();
      this.updateState({ playing: true, currentPattern: pattern, error: null });
    } catch (err: any) {
      console.error('[StrudelEngine] Play error:', err);
      this.updateState({ error: err.message });
    }
  }

  stop(): void {
    if (!this.strudelRepl) return;
    try {
      this.strudelRepl.scheduler?.stop();
      this.updateState({ playing: false });
    } catch (err: any) {
      console.error('[StrudelEngine] Stop error:', err);
    }
  }

  async update(pattern: string): Promise<void> {
    if (!this.strudelRepl || !this.state.playing) return;
    try {
      await this.strudelRepl.evaluate(pattern);
      this.updateState({ currentPattern: pattern, error: null });
    } catch (err: any) {
      console.error('[StrudelEngine] Update error:', err);
      this.updateState({ error: err.message });
    }
  }

  setTempo(bpm: number): void {
    this.state.tempo = Math.max(20, Math.min(400, bpm));
    if (this.strudelRepl?.scheduler) {
      this.strudelRepl.scheduler.setCps(this.state.tempo / 60 / 4);
    }
    this.notifyListeners();
  }

  setVolume(level: number): void {
    this.state.volume = Math.max(0, Math.min(1, level));
    this.notifyListeners();
  }

  getState(): Readonly<StrudelEngineState> {
    return { ...this.state };
  }

  subscribe(listener: StrudelStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private playFromPayload(data: RhythmPayload): void {
    const pattern = this.payloadToPattern(data);
    if (pattern) {
      this.play(pattern, { tempo: data.tempo });
    }
  }

  private updateFromPayload(data: RhythmPayload): void {
    const pattern = this.payloadToPattern(data);
    if (pattern) {
      this.update(pattern);
    }
  }

  private payloadToPattern(data: RhythmPayload): string | null {
    if (data.pattern) return data.pattern;
    if (data.layers && data.layers.length > 0) {
      return data.layers
        .map(l => `(${l.pattern}).gain(${l.volume})`)
        .join('\n.stack(\n') + (data.layers.length > 1 ? ')' : '');
    }
    return null;
  }

  private updateState(partial: Partial<StrudelEngineState>): void {
    Object.assign(this.state, partial);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const snapshot = { ...this.state };
    this.stateListeners.forEach(fn => fn(snapshot));
  }

  /** Cleanup — mainly for HMR */
  destroy(): void {
    this.stop();
    this.busUnsubs.forEach(fn => fn());
    this.busUnsubs = [];
    this.stateListeners.clear();
  }
}

/** Singleton engine instance */
export const strudelEngine = new StrudelEngine();
