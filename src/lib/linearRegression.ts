/**
 * Ordinary least squares over (x, y) pairs, and a forecast with a band.
 *
 * This is the file the CV names under "Forecasting" and the catalog case
 * study cites by formula, so its edges are asserted in
 * linearRegression.test.ts rather than left to the callers.
 *
 * The band's known limitation is deliberate and disclosed on both
 * /music-analytics and the case study: the margin has no dependence on how
 * far ahead the point is, so it is the same width twelve months out as one,
 * where a real prediction interval widens. Do not quietly "fix" that here —
 * the page explains it, and a correction has to move together with the copy.
 */

/** Simple linear regression: y = slope * x + intercept */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function forecast(
  points: { x: number; y: number }[],
  futureCount: number
): { x: number; y: number; lower: number; upper: number }[] {
  // No observations, no forecast. Without this the margin below evaluates
  // 1.96 * 0 * Math.sqrt(1 + 1/0) — that is 0 * Infinity, which is NaN, and
  // every caller feeds the result straight into Recharts: catalogAnalytics
  // rankArtists, StreamingDashboard's chart and quarter column, and
  // PortfolioBuilder's aggregate. An artist with no rows silently drew a
  // band bounded by NaN. Returning nothing is also the honest answer.
  if (points.length === 0) return [];

  const { slope, intercept } = linearRegression(points);
  const lastX = points[points.length - 1]?.x ?? 0;

  // Standard error for confidence interval
  const n = points.length;
  const residuals = points.map((p) => p.y - (slope * p.x + intercept));
  const se = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(n - 2, 1));

  const result: { x: number; y: number; lower: number; upper: number }[] = [];
  for (let i = 1; i <= futureCount; i++) {
    const x = lastX + i;
    const y = Math.max(0, Math.round(slope * x + intercept));
    const margin = 1.96 * se * Math.sqrt(1 + 1 / n);
    result.push({
      x,
      y,
      lower: Math.max(0, Math.round(y - margin)),
      upper: Math.round(y + margin),
    });
  }
  return result;
}
