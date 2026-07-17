/**
 * Pure SVG-path geometry for tiny inline sparklines.
 *
 * The homepage analytics preview renders four decorative micro-charts. Pulling
 * in recharts (+ its d3 dependencies) just to draw four 40px sparklines forced
 * a heavy chart chunk onto the landing page's scroll path. These helpers emit
 * plain SVG path strings instead, so the preview needs no charting library.
 *
 * Geometry is expressed in a fixed `width` x `height` viewBox (default
 * 100 x 40) with y inverted so larger values sit higher. Render the result with
 * `preserveAspectRatio="none"` to stretch to any container width, and
 * `vector-effect="non-scaling-stroke"` so the stroke stays crisp under that
 * horizontal scale.
 */

export interface SparklineOptions {
  width?: number;
  height?: number;
  /** Vertical breathing room (in viewBox units) kept clear at top and bottom. */
  padY?: number;
}

export interface SparklineGeometry {
  /** Open polyline path — the visible stroke. */
  line: string;
  /** Closed path (stroke dropped to the baseline) — for a filled area. */
  area: string;
}

const round = (n: number): number => Math.round(n * 100) / 100;

function points(
  values: number[],
  width: number,
  height: number,
  padY: number,
): Array<readonly [number, number]> {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const usableH = height - padY * 2;
  const lastIndex = values.length - 1;

  return values.map((value, index) => {
    const x = lastIndex > 0 ? (index / lastIndex) * width : width / 2;
    // A flat (zero-range) series has no meaningful shape; center it vertically
    // rather than pinning every point to the baseline.
    const norm = range === 0 ? 0.5 : (value - min) / range;
    const y = padY + usableH * (1 - norm);
    return [round(x), round(y)] as const;
  });
}

/**
 * Line + filled-area path strings for a value series. Returns empty strings for
 * an empty series so callers can render `<path d="">` without a guard.
 */
export function sparklineGeometry(
  values: number[],
  { width = 100, height = 40, padY = 4 }: SparklineOptions = {},
): SparklineGeometry {
  if (values.length === 0) {
    return { line: "", area: "" };
  }

  const pts = points(values, width, height, padY);
  const line = pts.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${round(width)} ${height} L0 ${height} Z`;

  return { line, area };
}

export interface SparkBar {
  x: number;
  width: number;
  y: number;
  height: number;
}

/**
 * Evenly spaced bars sized to a value series, heights scaled so the tallest bar
 * fills the plot area. `gap` is the fraction (0..1) of each slot left as spacing
 * between bars.
 */
export function sparklineBars(
  values: number[],
  { width = 100, height = 40, gap = 0.3 }: SparklineOptions & { gap?: number } = {},
): SparkBar[] {
  if (values.length === 0) {
    return [];
  }

  const max = Math.max(...values, 0) || 1;
  const slot = width / values.length;
  const barWidth = slot * (1 - gap);
  const offset = (slot - barWidth) / 2;

  return values.map((value, index) => {
    const barHeight = height * (Math.max(value, 0) / max);
    return {
      x: round(index * slot + offset),
      width: round(barWidth),
      y: round(height - barHeight),
      height: round(barHeight),
    };
  });
}
