export interface RawGroove {
  id: string;
  genre: string;
  substyle?: string;
  bpm: number;
  duration: number;
  note_density: number;
  swing_ratio: number;
  syncopation: number;
  velocity_variance: number;
  density: number;
  drummer?: string;
  beat_type?: string;
  time_signature?: string;
}

export interface NormalizedGroove extends RawGroove {
  norm_bpm: number;
  norm_density: number;
  norm_syncopation: number;
  norm_swing: number;
  norm_velocity: number;
  // projected 2D
  px: number;
  py: number;
  // current rendered position (animated)
  cx: number;
  cy: number;
  // target position (for morphing)
  tx: number;
  ty: number;
  // visual
  radius: number;
  color: string;
  glowIntensity: number;
}

export type ViewMode = "field" | "topology" | "landscape";
