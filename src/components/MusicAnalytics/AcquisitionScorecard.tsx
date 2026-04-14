import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import type { ArtistMonthly } from "@/lib/musicDataService";
import {
  buildArtistComparison,
  formatMetric,
  type AcquisitionScore,
  type AcquisitionLabel,
} from "@/lib/catalogAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface Props {
  data: ArtistMonthly[];
  artists: string[];
  mode: "streams" | "revenue";
}

interface WeeklyTrendPoint {
  period: string;
  label: string;
  playcount: number;
  listeners: number;
}

interface LastFmData {
  name: string;
  listeners: number;
  playcount: number;
  tags: string[];
  bio: string;
  similar: string[];
  weeklyTrend?: WeeklyTrendPoint[];
}

const LABEL_CONFIG: Record<AcquisitionLabel, { color: string; bg: string }> = {
  "Strong Acquisition": { color: "text-emerald-400", bg: "bg-emerald-400" },
  "Promising": { color: "text-blue-400", bg: "bg-blue-400" },
  "Hold": { color: "text-amber-400", bg: "bg-amber-400" },
  "High Risk": { color: "text-red-400", bg: "bg-red-400" },
};

export default function AcquisitionScorecard({ data, artists, mode }: Props) {
  const [selectedArtist, setSelectedArtist] = useState(artists[0] ?? "");
  const [lastfm, setLastfm] = useState<LastFmData | null>(null);
  const [lastfmLoading, setLastfmLoading] = useState(false);
  const [lastfmError, setLastfmError] = useState<string | null>(null);

  const comparisons = useMemo(
    () => buildArtistComparison(data, artists),
    [data, artists]
  );

  const selected = useMemo(
    () => comparisons.find((c) => c.artist === selectedArtist),
    [comparisons, selectedArtist]
  );

  // Fetch Last.fm data
  useEffect(() => {
    if (!selectedArtist) return;
    let cancelled = false;
    setLastfmLoading(true);
    setLastfmError(null);
    setLastfm(null);

    supabase.functions
      .invoke("lastfm-artist", { body: { artist: selectedArtist } })
      .then(({ data: d, error: e }) => {
        if (cancelled) return;
        if (e) {
          setLastfmError("Last.fm data unavailable");
        } else {
          setLastfm(d as LastFmData);
        }
        setLastfmLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedArtist]);

  const scoreConfig = selected
    ? LABEL_CONFIG[selected.acquisition.label]
    : LABEL_CONFIG["Hold"];

  const sortedByScore = useMemo(
    () => [...comparisons].sort((a, b) => b.acquisition.score - a.acquisition.score),
    [comparisons]
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Acquisition Scoring Model</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Multi-factor scoring: Growth (30%) · Stability (30%) · Longevity (20%) · Momentum (20%)
        </p>
      </div>

      {/* Ranking table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rank</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Artist</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Score</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-32">Rating</th>
              <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Label</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {mode === "revenue" ? "Revenue" : "Streams"}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedByScore.map((c, i) => {
              const cfg = LABEL_CONFIG[c.acquisition.label];
              return (
                <tr
                  key={c.artist}
                  onClick={() => setSelectedArtist(c.artist)}
                  className={`border-b border-border/30 cursor-pointer transition-colors ${
                    c.artist === selectedArtist
                      ? "bg-muted/30"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <td className="p-3 text-muted-foreground font-mono text-xs">#{i + 1}</td>
                  <td className="p-3 font-medium text-foreground">{c.artist}</td>
                  <td className={`p-3 text-right font-bold ${cfg.color}`}>{c.acquisition.score}</td>
                  <td className="p-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.acquisition.score}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className={`h-full rounded-full ${cfg.bg}`}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-medium ${cfg.color}`}>
                      {c.acquisition.label}
                    </span>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {formatMetric(c.total, mode)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed scorecard for selected artist */}
      {selected && (
        <motion.div
          key={selectedArtist}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-foreground">
              {selectedArtist} — Detailed Scorecard
            </h4>
            <span className={`rounded-full border border-border px-3 py-1 text-sm font-bold ${scoreConfig.color}`}>
              {selected.acquisition.score}/100 · {selected.acquisition.label}
            </span>
          </div>

          {/* Score gauge */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="10"
                  />
                  <motion.circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 50 * (1 - selected.acquisition.score / 100),
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={scoreConfig.color}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${scoreConfig.color}`}>
                    {selected.acquisition.score}
                  </span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: "Growth", value: selected.acquisition.components.growth, weight: "30%" },
                  { label: "Stability", value: selected.acquisition.components.stability, weight: "30%" },
                  { label: "Longevity", value: selected.acquisition.components.longevity, weight: "20%" },
                  { label: "Momentum", value: selected.acquisition.components.momentum, weight: "20%" },
                ].map((comp) => (
                  <div key={comp.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {comp.label} <span className="text-muted-foreground/50">({comp.weight})</span>
                      </span>
                      <span className="text-xs font-medium text-foreground">{comp.value}%</span>
                    </div>
                    <Progress value={comp.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Last.fm enrichment */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h5 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Last.fm Market Intelligence
            </h5>
            {lastfmLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-3 w-3 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                Fetching market data…
              </div>
            )}
            {lastfmError && (
              <p className="text-xs text-muted-foreground/60">{lastfmError}</p>
            )}
            {lastfm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Global Listeners</p>
                    <p className="text-lg font-bold text-foreground">{lastfm.listeners.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Playcount</p>
                    <p className="text-lg font-bold text-foreground">{lastfm.playcount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Plays/Listener</p>
                    <p className="text-lg font-bold text-foreground">
                      {lastfm.listeners > 0 ? (lastfm.playcount / lastfm.listeners).toFixed(1) : "–"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Genre Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lastfm.tags.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {lastfm.similar.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Comparable Artists</p>
                    <p className="text-sm text-foreground/80">{lastfm.similar.join(", ")}</p>
                  </div>
                )}
                {lastfm.bio && (
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{lastfm.bio}</p>
                )}
              </div>
            )}
          </div>

          {/* Streaming metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-xs text-muted-foreground">Total {mode === "revenue" ? "Rev" : "Streams"}</p>
              <p className="text-xl font-bold text-foreground">{formatMetric(selected.total, mode)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-xs text-muted-foreground">MoM Growth</p>
              <p className={`text-xl font-bold ${selected.momGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {selected.momGrowth >= 0 ? "+" : ""}{selected.momGrowth.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-xs text-muted-foreground">Volatility</p>
              <p className={`text-xl font-bold ${
                selected.volatilityLabel === "Low" ? "text-emerald-400" :
                selected.volatilityLabel === "High" ? "text-red-400" : "text-amber-400"
              }`}>{selected.volatilityLabel}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <p className="text-xs text-muted-foreground">Catalog Type</p>
              <p className="text-xl font-bold text-foreground">{selected.segment}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
