/**
 * The placeholder every analytics tab shows while it is arriving.
 *
 * /music-analytics measured CLS 0.289 — by far the worst on the site, and the
 * single largest drag on its performance score. The cause was two stacked
 * collapses rather than one slow paint: the route's Suspense fallback reserved
 * a 24rem box, the lazy chunk landed and replaced it with a one-line
 * "Fetching chart data…" spinner, and then the fetched CSV replaced THAT with
 * three metric cards, a 24rem chart and a table. Everything below jumped
 * twice.
 *
 * So the fallback and the loading state are the same component, and it is the
 * shape of the loaded page. The metric cards are built from the real markup
 * with representative text left in place and coloured transparent — the bars
 * are that text's own box — because a hand-picked pixel height drifts the
 * moment someone changes a font size, and a skeleton that is the wrong height
 * reintroduces exactly the shift it exists to prevent.
 */
const Bar = ({ children }: { children: string }) => (
  <span className="inline-block animate-pulse rounded bg-muted text-transparent select-none">
    {children}
  </span>
);

const DashboardSkeleton = () => (
  <div className="space-y-8" aria-busy="true">
    {/* Announced once, rather than as three blank cards a screen reader walks. */}
    <p className="sr-only" role="status">
      Fetching chart data…
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
      {["Total Streams", "MoM Growth (complete months)", "6-Month Forecast"].map((label) => (
        <div key={label} className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            <Bar>{label}</Bar>
          </p>
          <p className="text-2xl md:text-3xl font-bold">
            <Bar>32.0B</Bar>
          </p>
        </div>
      ))}
    </div>

    <div className="rounded-xl border border-border/50 bg-card p-4 md:p-6" aria-hidden="true">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        <Bar>Monthly Streams — Actual vs Forecast</Bar>
      </p>
      {/* Same box the ResponsiveContainer mounts into. */}
      <div className="h-72 md:h-96 min-h-[288px] animate-pulse rounded-lg bg-muted/30" />
    </div>

    <div
      className="h-64 animate-pulse rounded-xl border border-border/50 bg-card"
      aria-hidden="true"
    />
  </div>
);

export default DashboardSkeleton;
