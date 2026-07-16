import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, Legend, Line,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { forecast } from "@/lib/linearRegression";
import { formatMetric, robustMoMGrowth } from "@/lib/catalogAnalytics";

interface Props {
  data: ArtistMonthly[];
  artists: string[];
  loading: boolean;
  error: string | null;
  selectedArtist: string;
  onSelectArtist: (a: string) => void;
  mode: "streams" | "revenue";
}

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function StreamingDashboard({
  data, artists, loading, error, selectedArtist, onSelectArtist, mode,
}: Props) {
  const filtered = useMemo(() => {
    if (selectedArtist === "all") {
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
    // MoM growth over the last two COMPLETE month buckets: the final bucket
    // is often sparse (thin release coverage) and would otherwise show a
    // large artificial drop. robustMoMGrowth drops it when it is an outlier
    // vs the trailing median.
    const momGrowth = robustMoMGrowth(filtered.map((r) => r.streams));
    const points = filtered.map((r, i) => ({ x: i, y: r.streams }));
    const fc = forecast(points, 6);
    const projected6m = fc.reduce((s, f) => s + f.y, 0);
    return { total, momGrowth, projected6m };
  }, [filtered]);

  const chartData = useMemo(() => {
    if (!filtered.length) return [];
    const points = filtered.map((r, i) => ({ x: i, y: r.streams }));
    const fc = forecast(points, 6);
    const rev = mode === "revenue" ? 0.003 : 1;

    const actual = filtered.map((r) => ({
      month: r.month,
      actual: r.streams * rev,
      forecast: null as number | null,
      upper: null as number | null,
      lower: null as number | null,
    }));

    if (actual.length > 0) {
      const last = actual[actual.length - 1];
      actual[actual.length - 1] = {
        ...last,
        forecast: last.actual,
        upper: last.actual,
        lower: last.actual,
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
        forecast: f.y * rev,
        upper: f.upper * rev,
        lower: f.lower * rev,
      };
    });

    return [...actual, ...forecasted];
  }, [filtered, mode]);

  const [sortKey, setSortKey] = useState<"total" | "forecastQ">("total");

  const portfolioData = useMemo(() => {
    return artists.map((artist) => {
      const rows = data.filter((r) => r.artist === artist);
      const total = rows.reduce((s, r) => s + r.streams, 0);
      // "Peak era": the release-month bucket with the highest modeled stream
      // total (data is bucketed by album release date, not play date).
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

  const sortedPortfolio = useMemo(
    () => [...portfolioData].sort((a, b) => b[sortKey] - a[sortKey]),
    [portfolioData, sortKey]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-4 w-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
        Fetching chart data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: `Total ${mode === "revenue" ? "Revenue" : "Streams"}`, value: formatMetric(metrics.total, mode), color: "text-foreground" },
            {
              label: "MoM Growth (complete months)",
              value: `${metrics.momGrowth >= 0 ? "+" : ""}${metrics.momGrowth.toFixed(1)}%`,
              color: metrics.momGrowth >= 0 ? "text-emerald-400" : "text-red-400",
            },
            { label: "6-Month Forecast", value: formatMetric(metrics.projected6m, mode), color: "text-foreground" },
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
          Monthly {mode === "revenue" ? "Revenue" : "Streams"} — Actual vs Forecast
        </h3>
        {/* Explicit min-height so ResponsiveContainer always mounts into a sized parent */}
        <div className="h-72 md:h-96 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatMetric(v, mode === "revenue" ? "revenue" : "streams")}
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
                formatter={(val: number) => [formatMetric(val, mode === "revenue" ? "revenue" : "streams"), ""]}
              />
              <Legend />
              <Area
                dataKey="upper"
                stroke="none"
                fill="hsl(var(--foreground))"
                fillOpacity={0.06}
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
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--foreground))" }}
                name="Actual"
                connectNulls={false}
              />
              <Line
                dataKey="forecast"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: "hsl(var(--foreground))", strokeDasharray: "0" }}
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
              <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Artist</th>
              <th
                className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setSortKey("total")}
              >
                Total {mode === "revenue" ? "Rev" : "Streams"} {sortKey === "total" && "▾"}
              </th>
              <th
                className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider"
                title="Release-month bucket with the highest modeled stream total — reflects the catalog era of the artist's most popular releases, not a streaming peak."
              >
                Peak Era
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Trend</th>
              <th
                className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
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
                <td className="p-4 text-right text-muted-foreground">{formatMetric(row.total, mode)}</td>
                <td className="p-4 text-right text-muted-foreground">{row.peakMonth}</td>
                <td className="p-4 text-center text-lg">
                  <span className={row.trend === "↑" ? "text-emerald-400" : row.trend === "↓" ? "text-red-400" : "text-muted-foreground"}>
                    {row.trend}
                  </span>
                </td>
                <td className="p-4 text-right text-muted-foreground">{formatMetric(row.forecastQ, mode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
