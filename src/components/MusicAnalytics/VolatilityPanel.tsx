import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { rollingVariance, volatilityScore, formatMetric, computeVolatility } from "@/lib/catalogAnalytics";

interface Props {
  data: ArtistMonthly[];
  artists: string[];
  selectedArtist: string;
}

export default function VolatilityPanel({ data, artists, selectedArtist }: Props) {
  const artistData = useMemo(() => {
    const topSet = new Set(artists);
    if (selectedArtist === "all") {
      const monthMap = new Map<string, number>();
      for (const r of data) {
        if (!topSet.has(r.artist)) continue;
        monthMap.set(r.month, (monthMap.get(r.month) ?? 0) + r.streams);
      }
      return [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, streams]) => ({ month, streams }));
    }
    return data
      .filter((r) => r.artist === selectedArtist)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data, artists, selectedArtist]);

  const monthlyStreams = useMemo(() => artistData.map((r) => r.streams), [artistData]);
  const vol = useMemo(() => volatilityScore(monthlyStreams), [monthlyStreams]);
  const rolling = useMemo(() => rollingVariance(monthlyStreams), [monthlyStreams]);

  const chartData = useMemo(() => {
    return artistData.map((r, i) => ({
      month: r.month,
      variance: Math.round(Math.sqrt(rolling[i] ?? 0)),
    }));
  }, [artistData, rolling]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">Volatility & Risk</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Rolling variance analysis and risk assessment
        </p>
      </div>

      {/* Volatility score card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Volatility Score</p>
          <p className={`text-3xl font-bold ${
            vol.label === "Low" ? "text-emerald-400" :
            vol.label === "High" ? "text-red-400" : "text-amber-400"
          }`}>
            {vol.score}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Coefficient of Variation</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Risk Level</p>
          <p className={`text-3xl font-bold ${
            vol.label === "Low" ? "text-emerald-400" :
            vol.label === "High" ? "text-red-400" : "text-amber-400"
          }`}>
            {vol.label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {vol.label === "Low" ? "Stable catalog asset" :
             vol.label === "High" ? "Trend-dependent, higher risk" : "Moderate fluctuations"}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Std Deviation</p>
          <p className="text-3xl font-bold text-foreground">
            {formatMetric(computeVolatility(monthlyStreams), "streams")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Monthly stream variance</p>
        </div>
      </div>

      {/* Rolling variance chart */}
      <div className="rounded-xl border border-border/50 bg-card p-4 md:p-6">
        <p className="text-xs font-medium text-muted-foreground mb-4">Rolling Variance (3-month window)</p>
        {/* Explicit min-height so ResponsiveContainer always mounts into a sized parent */}
        <div className="h-48 md:h-56 min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatMetric(v, "streams")}
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
              />
              <Line
                dataKey="variance"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 2 }}
                name="Rolling Std Dev"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
