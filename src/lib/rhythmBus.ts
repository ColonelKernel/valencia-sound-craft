/**
 * Rhythm Event Bus — lightweight typed pub/sub for decoupled module communication.
 *
 * Every tool (Map, Generator, Learning, Builder) emits events.
 * The Strudel audio module (or any future engine) subscribes and reacts.
 */

// ─── Rhythm data types ──────────────────────────────────────────────────────

export interface RhythmLayer {
  /** Strudel mini-notation pattern string */
  pattern: string;
  /** 0-1 */
  volume: number;
  /** optional label */
  label?: string;
}

export interface RhythmPayload {
  /** Single pattern string (convenience) */
  pattern?: string;
  /** Multi-layer patterns */
  layers?: RhythmLayer[];
  /** BPM */
  tempo?: number;
  /** 0-1 swing amount */
  swing?: number;
  /** Source identifier */
  source?: string;
  /** Human-readable name */
  name?: string;
}

// ─── Event map ──────────────────────────────────────────────────────────────

export interface RhythmEventMap {
  RHYTHM_SELECTED: RhythmPayload;
  RHYTHM_GENERATED: RhythmPayload;
  MAP_HOVER_PREVIEW: RhythmPayload;
  PLAY_REQUESTED: RhythmPayload;
  STOP_REQUESTED: undefined;
  TEMPO_CHANGED: { tempo: number };
  VOLUME_CHANGED: { volume: number };
  PATTERN_UPDATED: RhythmPayload;
}

export type RhythmEvent = keyof RhythmEventMap;

type Handler<T> = (data: T) => void;

// ─── Bus implementation ─────────────────────────────────────────────────────

class RhythmBus {
  private listeners = new Map<string, Set<Handler<any>>>();

  on<E extends RhythmEvent>(event: E, handler: Handler<RhythmEventMap[E]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<E extends RhythmEvent>(event: E, data: RhythmEventMap[E]): void {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(data); } catch (e) { console.error(`[RhythmBus] Error in ${event} handler:`, e); }
    });
  }

  off<E extends RhythmEvent>(event: E, handler: Handler<RhythmEventMap[E]>): void {
    this.listeners.get(event)?.delete(handler);
  }

  /** Remove all listeners — useful for cleanup */
  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton event bus */
export const rhythmBus = new RhythmBus();
