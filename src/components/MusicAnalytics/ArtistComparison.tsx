import { useMemo } from "react";
import { m } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { buildArtistComparison, formatMetric } from "@/lib/catalogAnalytics";

interface Props {
  data: ArtistMonthly[];
  selectedArtists: string[];
  mode: "streams" | "revenue";
}

const COLORS = [
  "hsl(0, 0%, 92%)",
  "hsl(210, 60%, 60%)",
  "hsl(150, 50%, 50%)",
  "hsl(30, 70%, 55%)",
];

export default function ArtistComparison({ data, selectedArtists, mode }: Props) {
  const comparisons = useMemo(
    () => buildArtistComparison(data, selectedArtists),
    [data, selectedArtists]
  );

  const chartData = useMemo(() => {
    if (!comparisons.length) return [];
    const months = new Set<string>();
    comparisons.forEach((c) => c.monthlyData.forEach((m) => months.add(m.month)));
    const sortedMonths = [...months].sort();

    return sortedMonths.map((month) => {
      const point: Record<string, string | number | null> = { month };
      comparisons.forEach((c) => {
        const row = c.monthlyData.find((m) => m.month === month);
        const val = row?.streams ?? null;
        point[c.artist] = val !== null && mode === "revenue" ? val * 0.003 : val;
      });
      return point;
    });
  }, [comparisons, mode]);

  if (selectedArtists.length < 2) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Artist Comparison Engine</h3>
        <p className="text-sm text-muted-foreground">Select 2–4 artists to compare performance metrics.</p>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">Artist Comparison</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Overlay comparison of {selectedArtists.length} artists
        </p>
      </div>

      {/* Comparison metrics table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Artist</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Total</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">MoM</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Volatility</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Forecast Q</th>
              <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Segment</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => (
              <tr key={c.artist} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {c.artist}
                </td>
                <td className="p-3 text-right text-muted-foreground">{formatMetric(c.total, mode)}</td>
                <td className={`p-3 text-right ${c.momGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {c.momGrowth >= 0 ? "+" : ""}{c.momGrowth.toFixed(1)}%
                </td>
                <td className="p-3 text-right">
                  <span className={
                    c.volatilityLabel === "Low" ? "text-emerald-400" :
                    c.volatilityLabel === "High" ? "text-red-400" : "text-amber-400"
                  }>
                    {c.volatilityLabel}
                  </span>
                </td>
                <td className="p-3 text-right text-muted-foreground">{formatMetric(c.forecastQ, mode)}</td>
                <td className="p-3 text-center">
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs text-foreground">
                    {c.segment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overlay line chart */}
      <div className="rounded-xl border border-border/50 bg-card p-4 md:p-6">
        {/* Explicit min-height so ResponsiveContainer always mounts into a sized parent */}
        <div className="h-72 md:h-80 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatMetric(v, mode === "revenue" ? "revenue" : "streams")}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(val: number) => [
                  mode === "revenue" ? `$${val.toLocaleString()}` : val.toLocaleString(),
                  ""
                ]}
              />
              <Legend />
              {selectedArtists.map((artist, i) => (
                <Line
                  key={artist}
                  dataKey={artist}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                  name={artist}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </m.div>
  );
}
