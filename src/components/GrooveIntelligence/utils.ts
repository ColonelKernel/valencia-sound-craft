import type { RawGroove, NormalizedGroove } from "./types";

// --- Normalization ---
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

export const MAX_RENDERED_GROOVES = 280;

export function normalizeGrooves(raw: RawGroove[], reference: RawGroove[] = raw): NormalizedGroove[] {
  const ranges = {
    bpm: extent(reference, g => g.bpm),
    density: extent(reference, g => g.note_density),
    syncopation: extent(reference, g => g.syncopation),
    swing: extent(reference, g => g.swing_ratio),
    velocity: extent(reference, g => g.velocity_variance),
  };

  return raw.map(g => {
    const nb = norm(g.bpm, ranges.bpm);
    const nd = norm(g.note_density, ranges.density);
    const ns = norm(g.syncopation, ranges.syncopation);
    const nw = norm(g.swing_ratio, ranges.swing);
    const nv = norm(g.velocity_variance, ranges.velocity);

    // Perceptual spreading — power curve pushes clustered values apart
    const spread = (v: number, exp: number) => Math.pow(v, exp);
    const sb = spread(nb, 0.7);
    const sd = spread(nd, 0.6);
    const ss = spread(ns, 0.5); // strongest spread for narrow syncopation
    const sw = spread(nw, 0.6);

    // Blend axes with spread values for even distribution
    const px = 0.5 * sb + 0.3 * sd + 0.2 * sw;
    const py = 0.4 * ss + 0.3 * sw + 0.3 * spread(nv, 0.6);

    return {
      ...g,
      norm_bpm: nb,
      norm_density: nd,
      norm_syncopation: ns,
      norm_swing: nw,
      norm_velocity: nv,
      px, py,
      radius: 3 + nv * 6,
      color: syncopationColor(ns),
      glowIntensity: nw,
      similar: [],
    };
  });
}

export function sampleGrooveSet(raw: RawGroove[], limit = MAX_RENDERED_GROOVES): RawGroove[] {
  if (raw.length <= limit) return raw;

  const genreGroups = new Map<string, RawGroove[]>();
  for (const groove of raw) {
    const key = groove.genre || "unknown";
    const group = genreGroups.get(key);
    if (group) group.push(groove);
    else genreGroups.set(key, [groove]);
  }

  const orderedGroups = [...genreGroups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const allocations = new Map<string, number>();
  let assigned = 0;

  for (const [genre, items] of orderedGroups) {
    const share = Math.max(1, Math.floor((items.length / raw.length) * limit));
    const allocation = Math.min(items.length, share);
    allocations.set(genre, allocation);
    assigned += allocation;
  }

  while (assigned > limit) {
    const next = orderedGroups
      .map(([genre, items]) => ({ genre, room: allocations.get(genre)! - 1, size: items.length }))
      .filter(item => item.room > 0)
      .sort((a, b) => b.room - a.room || b.size - a.size)[0];

    if (!next) break;
    allocations.set(next.genre, allocations.get(next.genre)! - 1);
    assigned -= 1;
  }

  while (assigned < limit) {
    const next = orderedGroups
      .map(([genre, items]) => ({ genre, remaining: items.length - allocations.get(genre)! }))
      .filter(item => item.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)[0];

    if (!next) break;
    allocations.set(next.genre, allocations.get(next.genre)! + 1);
    assigned += 1;
  }

  const sample: RawGroove[] = [];
  for (const [genre, items] of orderedGroups) {
    const count = allocations.get(genre) ?? 0;
    if (count <= 0) continue;
    if (count >= items.length) {
      sample.push(...items);
      continue;
    }

    const step = items.length / count;
    for (let i = 0; i < count; i++) {
      sample.push(items[Math.min(items.length - 1, Math.floor(i * step))]);
    }
  }

  return sample.slice(0, limit);
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
