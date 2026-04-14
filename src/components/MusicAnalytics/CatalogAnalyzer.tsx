import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  trendSummary: string;
  portfolioFit: number;
  riskFactors: string[];
  recommendedActions: string[];
  comparableArtists: string[];
}

interface Props {
  artists: string[];
}

export default function CatalogAnalyzer({ artists }: Props) {
  const [artistName, setArtistName] = useState(artists[0] ?? "");
  const [genre, setGenre] = useState("Pop");
  const [catalogSize, setCatalogSize] = useState("50");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("catalog-analyzer", {
        body: { artistName, genre, catalogSize: Number(catalogSize) },
      });

      if (fnError) throw new Error(fnError.message ?? "Analysis failed");

      // Parse the AI response
      const parsed: AnalysisResult = typeof data === "string" ? JSON.parse(data) : data;
      setResult(parsed);
    } catch (err: any) {
      setError(err.message ?? "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">AI Catalog Analyzer</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze an artist's catalog positioning using AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Artist
          </label>
          <select
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {artists.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            <option value="">— Custom —</option>
          </select>
          {artistName === "" && (
            <input
              type="text"
              placeholder="Enter artist name"
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Primary Genre
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {["Pop", "Hip-Hop", "R&B", "Rock", "Latin", "Electronic", "Country", "Jazz", "Classical"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Catalog Size (tracks)
          </label>
          <input
            type="number"
            value={catalogSize}
            onChange={(e) => setCatalogSize(e.target.value)}
            min={1}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <button
        onClick={analyze}
        disabled={loading || !artistName}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Analyzing…" : "Analyze Catalog"}
      </button>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Trend Summary */}
          <div className="rounded-xl border border-border/50 bg-card p-5 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Trend Summary
            </p>
            <p className="text-foreground leading-relaxed">{result.trendSummary}</p>
          </div>

          {/* Portfolio Fit */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Portfolio Fit Score
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-primary">{result.portfolioFit}</span>
              <span className="text-muted-foreground text-sm mb-1">/ 100</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.portfolioFit}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Risk Factors */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Risk Factors
            </p>
            <ul className="space-y-1.5">
              {result.riskFactors.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span> {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Recommended Actions
            </p>
            <ul className="space-y-1.5">
              {result.recommendedActions.map((a, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span> {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Comparable Artists */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Comparable Artists
            </p>
            <div className="flex flex-wrap gap-2">
              {result.comparableArtists.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-foreground"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
