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

export interface GrooveNormalizationRanges {
  bpm: [number, number];
  density: [number, number];
  syncopation: [number, number];
  swing: [number, number];
  velocity: [number, number];
}

export interface GrooveDatasetPayload {
  totalCount: number;
  referenceRanges: GrooveNormalizationRanges;
  grooves: RawGroove[];
}

export interface NormalizedGroove extends RawGroove {
  norm_bpm: number;
  norm_density: number;
  norm_syncopation: number;
  norm_swing: number;
  norm_velocity: number;
  px: number;
  py: number;
  radius: number;
  color: string;
  glowIntensity: number;
  similar: string[];
}

export interface RenderGroove extends NormalizedGroove {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  phase: number;
}

export type ViewMode = "field" | "topology" | "landscape";

export interface TrajectoryPoint {
  grooveId: string;
  timestamp: number;
}
