import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteHead from "@/components/seo/RouteHead";
import { fetchAndParseChartData, type ArtistMonthly } from "@/lib/musicDataService";

const StreamingDashboard = lazy(() => import("@/components/MusicAnalytics/StreamingDashboard"));
const ArtistComparison = lazy(() => import("@/components/MusicAnalytics/ArtistComparison"));
const CatalogSegmentation = lazy(() => import("@/components/MusicAnalytics/CatalogSegmentation"));
const VolatilityPanel = lazy(() => import("@/components/MusicAnalytics/VolatilityPanel"));
const PortfolioBuilder = lazy(() => import("@/components/MusicAnalytics/PortfolioBuilder"));
const CatalogAnalyzer = lazy(() => import("@/components/MusicAnalytics/CatalogAnalyzer"));
const AcquisitionScorecard = lazy(() => import("@/components/MusicAnalytics/AcquisitionScorecard"));

const sectionFallback = (
  <div className="h-48 rounded-2xl border border-border/50 bg-card/30 animate-pulse" />
);

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
        title="Music Catalog Intelligence – Valencia Sound Craft"
        description="Advanced catalog analytics dashboard for music investment decisions. Real streaming data, forecasting, and AI-powered analysis."
        canonicalPath="/music-analytics"
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.03] via-transparent to-transparent" />
          <div className="container mx-auto px-6 py-14 md:py-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                Catalog Intelligence Platform
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
                Music Catalog Intelligence Platform
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Evaluate music catalogs as financial assets. Forecast performance, assess risk,
                and generate AI-powered investment memos.
              </p>
            </motion.div>
          </div>
        </section>

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
                {(tab === "overview" || tab === "risk") && (
                  <select
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    <option value="all">All Artists</option>
                    {artists.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-6">
            <Suspense fallback={sectionFallback}>
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
                  {/* Artist multi-select */}
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                      Select 2–4 artists to compare
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {artists.map((a) => (
                        <button
                          key={a}
                          onClick={() => toggleCompareArtist(a)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            compareArtists.includes(a)
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  {/* Artist add controls */}
                  <div className="rounded-xl border border-border/50 bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                      Build your portfolio
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {artists.map((a) => (
                        <button
                          key={a}
                          onClick={() => togglePortfolioArtist(a)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            portfolio.includes(a)
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
                          }`}
                        >
                          {portfolio.includes(a) ? `✓ ${a}` : a}
                        </button>
                      ))}
                    </div>
                  </div>
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
            </Suspense>

            {/* Footer label */}
            <p className="mt-12 text-[10px] text-muted-foreground/60 text-center">
              Built using real streaming data, public APIs, and simplified financial modeling
            </p>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
