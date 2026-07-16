const AnalyticsHero = () => (
  <section className="relative overflow-hidden border-b border-border/30">
    <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.03] via-transparent to-transparent" />
    <div className="container mx-auto px-6 py-14 md:py-20 relative z-10">
      {/* Static on purpose: this copy is the route's LCP element, and an
          opacity-from-zero entrance pushed LCP past 20s on throttled runs. */}
      <div className="max-w-3xl">
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
        <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed max-w-2xl">
          Demonstration dataset derived from public Spotify popularity data (2020 sample);
          stream counts are modeled proxies, not live streaming figures.
        </p>
      </div>
    </div>
  </section>
);

export default AnalyticsHero;
