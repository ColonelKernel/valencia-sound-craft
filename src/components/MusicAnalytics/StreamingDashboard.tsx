import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, Legend,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { linearRegression, forecast } from "@/lib/linearRegression";

interface Props {
  data: ArtistMonthly[];
  artists: string[];
  loading: boolean;
  error: string | null;
}

function formatStreams(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function StreamingDashboard({ data, artists, loading, error }: Props) {
  const [selectedArtist, setSelectedArtist] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedArtist === "all") {
      // aggregate all top artists by month
      const map = new Map<string, number>();
      const topSet = new Set(artists);
      for (const r of data) {
        if (!topSet.has(r.artist)) continue;
        map.set(r.month, (map.get(r.month) ?? 0) + r.streams);
      }
      return [...map.entries()]
        .map(([month, streams]) => ({ month, streams }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }
    return data
      .filter((r) => r.artist === selectedArtist)
      .map((r) => ({ month: r.month, streams: r.streams }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data, artists, selectedArtist]);

  const metrics = useMemo(() => {
    if (!filtered.length) return null;
    const total = filtered.reduce((s, r) => s + r.streams, 0);
    const last = filtered[filtered.length - 1]?.streams ?? 0;
    const prev = filtered[filtered.length - 2]?.streams ?? last;
    const momGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0;

    const points = filtered.map((r, i) => ({ x: i, y: r.streams }));
    const fc = forecast(points, 6);
    const projected6m = fc.reduce((s, f) => s + f.y, 0);

    return { total, momGrowth, projected6m };
  }, [filtered]);

  const chartData = useMemo(() => {
    if (!filtered.length) return [];
    const points = filtered.map((r, i) => ({ x: i, y: r.streams }));
    const fc = forecast(points, 6);

    const actual = filtered.map((r) => ({
      month: r.month,
      actual: r.streams,
      forecast: null as number | null,
      upper: null as number | null,
      lower: null as number | null,
    }));

    // Bridge: last actual point also starts forecast
    if (actual.length > 0) {
      const lastActual = actual[actual.length - 1];
      actual[actual.length - 1] = {
        ...lastActual,
        forecast: lastActual.actual,
        upper: lastActual.actual,
        lower: lastActual.actual,
      };
    }

    const lastMonth = filtered[filtered.length - 1]?.month ?? "2026-01";
    const [y, m] = lastMonth.split("-").map(Number);

    const forecasted = fc.map((f, i) => {
      const nm = m + i + 1;
      const fy = y + Math.floor((nm - 1) / 12);
      const fm = ((nm - 1) % 12) + 1;
      return {
        month: `${fy}-${String(fm).padStart(2, "0")}`,
        actual: null as number | null,
        forecast: f.y,
        upper: f.upper,
        lower: f.lower,
      };
    });

    return [...actual, ...forecasted];
  }, [filtered]);

  // Portfolio table data
  const portfolioData = useMemo(() => {
    return artists.map((artist) => {
      const rows = data.filter((r) => r.artist === artist);
      const total = rows.reduce((s, r) => s + r.streams, 0);
      const peakRow = rows.reduce((best, r) => (r.streams > best.streams ? r : best), rows[0]);
      const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
      const last3 = sorted.slice(-3);
      let trend: "↑" | "↓" | "→" = "→";
      if (last3.length >= 2) {
        const diff = last3[last3.length - 1].streams - last3[0].streams;
        if (diff > 0) trend = "↑";
        else if (diff < 0) trend = "↓";
      }

      const points = sorted.map((r, i) => ({ x: i, y: r.streams }));
      const fc = forecast(points, 3);
      const forecastQ = fc.reduce((s, f) => s + f.y, 0);

      return { artist, total, peakMonth: peakRow?.month ?? "–", trend, forecastQ };
    });
  }, [data, artists]);

  const [sortKey, setSortKey] = useState<"total" | "forecastQ">("total");
  const sortedPortfolio = useMemo(
    () => [...portfolioData].sort((a, b) => b[sortKey] - a[sortKey]),
    [portfolioData, sortKey]
  );

  if (loading) {
    return (
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Fetching chart data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Streaming Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Data sourced from publicly available Spotify Charts
          </p>
        </div>

        <select
          value={selectedArtist}
          onChange={(e) => setSelectedArtist(e.target.value)}
          className="w-full sm:w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Top Artists</option>
          {artists.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Streams", value: formatStreams(metrics.total), color: "text-primary" },
            {
              label: "MoM Growth",
              value: `${metrics.momGrowth >= 0 ? "+" : ""}${metrics.momGrowth.toFixed(1)}%`,
              color: metrics.momGrowth >= 0 ? "text-emerald-400" : "text-red-400",
            },
            { label: "Projected 6-Month", value: formatStreams(metrics.projected6m), color: "text-primary" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardAnim}
              initial="hidden"
              animate="show"
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {card.label}
              </p>
              <p className={`text-2xl md:text-3xl font-bold ${card.color}`}>{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border/50 bg-card p-4 md:p-6"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Monthly Streams — Actual vs Forecast
        </h3>
        <div className="h-72 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatStreams}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                formatter={(val: number) => [formatStreams(val), ""]}
              />
              <Legend />
              <Area
                dataKey="upper"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                name="Confidence Band"
                connectNulls={false}
              />
              <Area
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
                name=" "
                connectNulls={false}
              />
              <Line
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                name="Actual"
                connectNulls={false}
              />
              <Line
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "hsl(var(--primary))", strokeDasharray: "0" }}
                name="Forecast"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Portfolio Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border/50 bg-card overflow-x-auto"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Artist</th>
              <th
                className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setSortKey("total")}
              >
                Total Streams {sortKey === "total" && "▾"}
              </th>
              <th className="text-right p-4 font-medium text-muted-foreground">Peak Month</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Trend</th>
              <th
                className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setSortKey("forecastQ")}
              >
                Forecast Q {sortKey === "forecastQ" && "▾"}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPortfolio.map((row) => (
              <tr key={row.artist} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="p-4 font-medium text-foreground">{row.artist}</td>
                <td className="p-4 text-right text-muted-foreground">{formatStreams(row.total)}</td>
                <td className="p-4 text-right text-muted-foreground">{row.peakMonth}</td>
                <td className="p-4 text-center text-lg">
                  <span className={row.trend === "↑" ? "text-emerald-400" : row.trend === "↓" ? "text-red-400" : "text-muted-foreground"}>
                    {row.trend}
                  </span>
                </td>
                <td className="p-4 text-right text-muted-foreground">{formatStreams(row.forecastQ)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
