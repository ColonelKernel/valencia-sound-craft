import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { buildArtistComparison } from "@/lib/catalogAnalytics";

interface AnalysisResult {
  investmentSummary: string;
  growthOutlook: string;
  riskAssessment: string;
  catalogType: string;
  recommendedStrategy: string;
}

interface Props {
  artists: string[];
  data: ArtistMonthly[];
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.investmentSummary === "string" &&
    typeof v.growthOutlook === "string" &&
    typeof v.riskAssessment === "string" &&
    typeof v.catalogType === "string" &&
    typeof v.recommendedStrategy === "string"
  );
}

export default function CatalogAnalyzer({ artists, data }: Props) {
  const [artistName, setArtistName] = useState(artists[0] ?? "");
  const [genre, setGenre] = useState("Pop");
  const [catalogSize, setCatalogSize] = useState("50");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comparisons = useMemo(() => buildArtistComparison(data, artists), [data, artists]);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Streaming context for the selected artist: these are the SAME
      // buildArtistComparison aggregates rendered on the dashboard tabs
      // (total, robust complete-month MoM growth, volatility label, segment),
      // so the memo cannot contradict the displayed KPIs.
      const comp = comparisons.find((c) => c.artist === artistName);
      const streamingData = comp ? {
        totalStreams: comp.total,
        momGrowth: comp.momGrowth.toFixed(1),
        volatility: comp.volatilityLabel,
        segment: comp.segment,
      } : undefined;

      const { data: fnData, error: fnError } = await supabase.functions.invoke("catalog-analyzer", {
        body: { artistName, genre, catalogSize: Number(catalogSize), streamingData },
      });

      // Honest failure states: if the function errors or returns something
      // that isn't a well-formed memo, say the analysis is unavailable —
      // never substitute canned text presented as AI output.
      if (fnError) throw new Error("AI analysis unavailable. Please try again later.");

      let parsed: unknown;
      try {
        parsed = typeof fnData === "string" ? JSON.parse(fnData) : fnData;
      } catch {
        throw new Error("AI analysis unavailable — the service returned an unexpected response.");
      }

      if (!isAnalysisResult(parsed)) {
        throw new Error("AI analysis unavailable — the service returned an unexpected response.");
      }
      setResult(parsed);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "AI analysis unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const catalogTypeColor = (type: string) => {
    if (type === "front") return "text-emerald-400";
    if (type === "back") return "text-blue-400";
    return "text-amber-400";
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground">AI Investment Analysis</h3>
        <p className="text-xs text-muted-foreground mt-1">
          AI-generated analyst memo for catalog evaluation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Artist</label>
          <select
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {artists.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Genre</label>
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
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Catalog Size</label>
          <input
            type="number"
            value={catalogSize}
            onChange={(e) => setCatalogSize(e.target.value)}
            min={1}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={analyze}
            disabled={loading || !artistName}
            className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing…" : "Run Analysis"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Catalog classification badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Classification:</span>
            <span className={`rounded-full border border-border px-3 py-1 text-sm font-medium capitalize ${catalogTypeColor(result.catalogType)}`}>
              {result.catalogType} Catalog
            </span>
          </div>

          {/* Analyst memo sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Investment Summary", content: result.investmentSummary, icon: "📊" },
              { label: "Growth Outlook", content: result.growthOutlook, icon: "📈" },
              { label: "Risk Assessment", content: result.riskAssessment, icon: "⚠️" },
              { label: "Recommended Strategy", content: result.recommendedStrategy, icon: "🎯" },
            ].map((section) => (
              <div key={section.label} className="rounded-xl border border-border/50 bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span>{section.icon}</span> {section.label}
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            AI-generated educational demonstration based on modeled data — not investment advice.
          </p>
        </motion.div>
      )}
    </div>
  );
}
