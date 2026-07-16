import { useEffect, useState, useCallback } from "react";
import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { fetchAndParseChartData, type ArtistMonthly } from "@/lib/musicDataService";
import AnalyticsHero from "@/components/MusicAnalytics/AnalyticsHero";
import ArtistPicker from "@/components/MusicAnalytics/ArtistPicker";
import TabErrorBoundary from "@/components/MusicAnalytics/TabErrorBoundary";
import StreamingDashboard from "@/components/MusicAnalytics/StreamingDashboard";
import ArtistComparison from "@/components/MusicAnalytics/ArtistComparison";
import CatalogSegmentation from "@/components/MusicAnalytics/CatalogSegmentation";
import VolatilityPanel from "@/components/MusicAnalytics/VolatilityPanel";
import PortfolioBuilder from "@/components/MusicAnalytics/PortfolioBuilder";
import CatalogAnalyzer from "@/components/MusicAnalytics/CatalogAnalyzer";
import AcquisitionScorecard from "@/components/MusicAnalytics/AcquisitionScorecard";

type ViewMode = "streams" | "revenue";
type Tab = "overview" | "acquisition" | "compare" | "segments" | "risk" | "portfolio" | "ai";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "acquisition", label: "Acquisition" },
  { id: "compare", label: "Compare" },
  { id: "segments", label: "Segments" },
  { id: "risk", label: "Risk" },
  { id: "portfolio", label: "Portfolio" },
  { id: "ai", label: "AI Insights" },
];

export default function MusicAnalyticsPage() {
  const [data, setData] = useState<ArtistMonthly[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ViewMode>("streams");
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [compareArtists, setCompareArtists] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAndParseChartData()
      .then((result) => {
        if (cancelled) return;
        setData(result.monthly);
        setArtists(result.topArtists);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load chart data");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleCompareArtist = useCallback((artist: string) => {
    setCompareArtists((prev) =>
      prev.includes(artist) ? prev.filter((a) => a !== artist) : prev.length < 4 ? [...prev, artist] : prev
    );
  }, []);

  const togglePortfolioArtist = useCallback((artist: string) => {
    setPortfolio((prev) =>
      prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RouteHead
        title={ROUTE_META.musicAnalytics.title}
        description={ROUTE_META.musicAnalytics.description}
        canonicalPath={ROUTE_META.musicAnalytics.path}
      />

      <main className="pt-20">
        <AnalyticsHero />

        {/* Controls bar */}
        <section className="sticky top-[64px] z-20 border-b border-border/30 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      tab === t.id
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Revenue/Streams toggle */}
                <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setMode("streams")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "streams" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Streams
                  </button>
                  <button
                    onClick={() => setMode("revenue")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      mode === "revenue" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Revenue
                  </button>
                </div>

                {/* Artist filter (overview & risk tabs) */}
                <select
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  style={{ display: (tab === "overview" || tab === "risk") ? "block" : "none" }}
                >
                  <option value="all">All Artists</option>
                  {artists.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-6">
            {/* Mount only the active tab. All tabs previously stayed mounted behind
                display:none to dodge a Recharts DOM reconciliation crash; instead we
                keep TabErrorBoundary around the active tab and give every chart
                wrapper an explicit min-height so ResponsiveContainer always mounts
                into a sized parent. */}
            <TabErrorBoundary resetKey={tab}>
              {tab === "overview" && (
                <StreamingDashboard
                  data={data}
                  artists={artists}
                  loading={loading}
                  error={error}
                  selectedArtist={selectedArtist}
                  onSelectArtist={setSelectedArtist}
                  mode={mode}
                />
              )}

              {tab === "acquisition" && (
                <AcquisitionScorecard data={data} artists={artists} mode={mode} />
              )}

              {tab === "compare" && (
                <div className="space-y-6">
                  <ArtistPicker
                    label="Select 2–4 artists to compare"
                    artists={artists}
                    selected={compareArtists}
                    onToggle={toggleCompareArtist}
                  />
                  <ArtistComparison data={data} selectedArtists={compareArtists} mode={mode} />
                </div>
              )}

              {tab === "segments" && (
                <CatalogSegmentation data={data} artists={artists} mode={mode} />
              )}

              {tab === "risk" && (
                <VolatilityPanel data={data} artists={artists} selectedArtist={selectedArtist} />
              )}

              {tab === "portfolio" && (
                <div className="space-y-6">
                  <ArtistPicker
                    label="Build your portfolio"
                    artists={artists}
                    selected={portfolio}
                    onToggle={togglePortfolioArtist}
                    checkmark
                  />
                  <PortfolioBuilder
                    data={data}
                    portfolio={portfolio}
                    onRemove={(a) => setPortfolio((prev) => prev.filter((x) => x !== a))}
                    mode={mode}
                  />
                </div>
              )}

              {tab === "ai" && (
                <CatalogAnalyzer artists={artists} data={data} />
              )}
            </TabErrorBoundary>

            {/* Footer label */}
            <p className="mt-12 text-[10px] text-muted-foreground/60 text-center">
              Demonstration dataset derived from public Spotify popularity data (2020 sample).
              Stream counts are modeled proxies — not live streaming figures — combined with
              simplified financial modeling for illustration.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
