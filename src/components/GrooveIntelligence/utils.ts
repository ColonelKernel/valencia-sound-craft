import type { RawGroove, NormalizedGroove } from "./types";

// --- Normalization ---
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

export function normalizeGrooves(raw: RawGroove[]): NormalizedGroove[] {
  const ranges = {
    bpm: extent(raw, g => g.bpm),
    density: extent(raw, g => g.note_density),
    syncopation: extent(raw, g => g.syncopation),
    swing: extent(raw, g => g.swing_ratio),
    velocity: extent(raw, g => g.velocity_variance),
  };

  return raw.map(g => {
    const nb = norm(g.bpm, ranges.bpm);
    const nd = norm(g.note_density, ranges.density);
    const ns = norm(g.syncopation, ranges.syncopation);
    const nw = norm(g.swing_ratio, ranges.swing);
    const nv = norm(g.velocity_variance, ranges.velocity);

    // Blend axes for organic feel
    const px = 0.6 * nb + 0.4 * nd;
    const py = 0.55 * ns + 0.45 * nw;

    return {
      ...g,
      norm_bpm: nb,
      norm_density: nd,
      norm_syncopation: ns,
      norm_swing: nw,
      norm_velocity: nv,
      px, py,
      cx: px, cy: py,
      tx: px, ty: py,
      radius: 3 + nv * 6,
      color: syncopationColor(ns),
      glowIntensity: nw,
    };
  });
}

function extent(arr: RawGroove[], fn: (g: RawGroove) => number): [number, number] {
  let min = Infinity, max = -Infinity;
  for (const g of arr) { const v = fn(g); if (v < min) min = v; if (v > max) max = v; }
  return [min, max];
}

function norm(v: number, [min, max]: [number, number]) {
  return max === min ? 0.5 : clamp01((v - min) / (max - min));
}

// Cool (blue/cyan) → Warm (orange/red)
export function syncopationColor(ns: number): string {
  const h = 220 - ns * 200; // 220 (blue) → 20 (orange-red)
  return `hsl(${h}, 80%, 60%)`;
}

// --- Distance ---
export function grooveDistance(a: NormalizedGroove, b: NormalizedGroove): number {
  return (
    1.0 * Math.abs(a.norm_bpm - b.norm_bpm) +
    1.5 * Math.abs(a.norm_density - b.norm_density) +
    2.0 * Math.abs(a.norm_syncopation - b.norm_syncopation) +
    2.0 * Math.abs(a.norm_swing - b.norm_swing) +
    1.2 * Math.abs(a.norm_velocity - b.norm_velocity)
  );
}

export function syntheticDistance(
  target: { energy: number; swing: number; syncopation: number; dynamics: number },
  g: NormalizedGroove
): number {
  return (
    1.5 * Math.abs(target.energy - g.norm_density) +
    2.0 * Math.abs(target.swing - g.norm_swing) +
    2.0 * Math.abs(target.syncopation - g.norm_syncopation) +
    1.2 * Math.abs(target.dynamics - g.norm_velocity)
  );
}

// --- Interpretation ---
export function interpretGroove(g: NormalizedGroove): string {
  const parts: string[] = [];

  if (g.norm_swing > 0.65) parts.push("A loose, swing-heavy rhythmic structure");
  else if (g.norm_swing < 0.3) parts.push("A tightly quantized groove");
  else parts.push("A moderately swung rhythmic feel");

  if (g.norm_syncopation > 0.6) parts.push("with strong syncopated displacement");
  else if (g.norm_syncopation < 0.25) parts.push("with minimal syncopation");
  else parts.push("with subtle off-beat accents");

  if (g.norm_velocity > 0.7) parts.push("and pronounced dynamic variation");
  else if (g.norm_velocity < 0.25) parts.push("and controlled, even dynamics");

  if (g.norm_density > 0.7) parts.push("— high-density note activity");
  else if (g.norm_density < 0.25) parts.push("— sparse, breathing rhythmic space");

  return parts.join(" ") + ".";
}

// Simple hash noise for drift
export function noise2D(x: number, y: number, t: number): [number, number] {
  const s1 = Math.sin(x * 12.9898 + y * 78.233 + t * 0.3) * 43758.5453;
  const s2 = Math.sin(x * 63.7264 + y * 10.873 + t * 0.5) * 28461.2319;
  return [(s1 - Math.floor(s1)) - 0.5, (s2 - Math.floor(s2)) - 0.5];
}

// K nearest
export function kNearest(grooves: NormalizedGroove[], target: NormalizedGroove, k: number): NormalizedGroove[] {
  return grooves
    .filter(g => g.id !== target.id)
    .map(g => ({ g, d: grooveDistance(target, g) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map(x => x.g);
}
