/** Simple linear regression: y = slope * x + intercept */
export function linearRegression(points: { x: number; y: number }[]) {
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
