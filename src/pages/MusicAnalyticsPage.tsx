import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RouteHead from "@/components/seo/RouteHead";
import { fetchAndParseChartData, type ArtistMonthly } from "@/lib/musicDataService";

const StreamingDashboard = lazy(() => import("@/components/MusicAnalytics/StreamingDashboard"));
const CatalogAnalyzer = lazy(() => import("@/components/MusicAnalytics/CatalogAnalyzer"));

const sectionFallback = (
  <div className="container mx-auto px-6 py-12">
    <div className="h-48 rounded-2xl border border-border/50 bg-card/30 animate-pulse" />
  </div>
);

export default function MusicAnalyticsPage() {
  const [data, setData] = useState<ArtistMonthly[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <RouteHead
        title="Music Analytics – Valencia Sound Craft"
        description="Real-time streaming analytics dashboard with AI-powered catalog analysis."
        canonicalPath="/music-analytics"
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <p className="text-sm font-medium tracking-widest uppercase text-primary mb-3">
                Analytics
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                Music Streaming Intelligence
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Explore real chart data, forecast streaming trends with linear regression,
                and analyze artist catalogs with AI.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Dashboard */}
        <section className="py-12 md:py-16">
          <Suspense fallback={sectionFallback}>
            <StreamingDashboard data={data} artists={artists} loading={loading} error={error} />
          </Suspense>
        </section>

        {/* AI Analyzer */}
        <section className="py-12 md:py-16 border-t border-border/30">
          <Suspense fallback={sectionFallback}>
            <CatalogAnalyzer artists={artists} />
          </Suspense>
        </section>
      </main>

      <Footer />
    </div>
  );
}
