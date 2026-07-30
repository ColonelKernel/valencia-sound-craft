import { useMemo } from "react";
import { m } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { buildSegmentedData, formatMetric } from "@/lib/catalogAnalytics";

interface Props {
  data: ArtistMonthly[];
  artists: string[];
  mode: "streams" | "revenue";
}

export default function CatalogSegmentation({ data, artists, mode }: Props) {
  const segmented = useMemo(() => {
    const raw = buildSegmentedData(data, artists);
    if (mode === "revenue") {
      return raw.map((r) => ({
        ...r,
        front: r.front * 0.003,
        mid: r.mid * 0.003,
        back: r.back * 0.003,
      }));
    }
    return raw;
  }, [data, artists, mode]);

  const totals = useMemo(() => {
    const t = { front: 0, mid: 0, back: 0 };
    segmented.forEach((r) => { t.front += r.front; t.mid += r.mid; t.back += r.back; });
    return t;
  }, [segmented]);

  const total = totals.front + totals.mid + totals.back;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">Catalog Segmentation</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Distribution across front, mid, and back catalog
        </p>
      </div>

      {/* Segment breakdown cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Front Catalog", value: totals.front, desc: "Recent spikes", color: "text-emerald-400" },
          { label: "Mid Catalog", value: totals.mid, desc: "Steady performers", color: "text-amber-400" },
          { label: "Back Catalog", value: totals.back, desc: "Evergreen / stable", color: "text-blue-400" },
        ].map((seg) => (
          <div key={seg.label} className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{seg.label}</p>
            <p className={`text-xl font-bold ${seg.color} mt-1`}>
              {formatMetric(mode === "revenue" ? seg.value / 0.003 : seg.value, mode)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0 ? `${((seg.value / total) * 100).toFixed(0)}%` : "0%"} • {seg.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className="rounded-xl border border-border/50 bg-card p-4 md:p-6">
        {/* Explicit min-height so ResponsiveContainer always mounts into a sized parent */}
        <div className="h-64 md:h-72 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={segmented} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
              />
              <Legend />
              <Area type="monotone" dataKey="back" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} name="Back Catalog" />
              <Area type="monotone" dataKey="mid" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} name="Mid Catalog" />
              <Area type="monotone" dataKey="front" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.3} name="Front Catalog" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </m.div>
  );
}
