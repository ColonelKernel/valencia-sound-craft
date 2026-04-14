import { ArrowRight, BarChart3, TrendingUp, Shield, Target } from "lucide-react";
import { Link } from "react-router-dom";

const metrics = [
  { icon: Target, label: "Acquisition Scoring", value: "0–100", desc: "Weighted model evaluating growth, volatility, longevity & momentum" },
  { icon: TrendingUp, label: "Revenue Forecasting", value: "Linear Regression", desc: "Stream-to-revenue projections with confidence bands" },
  { icon: Shield, label: "Risk Analysis", value: "Rolling Variance", desc: "Volatility tracking and catalog diversification scoring" },
  { icon: BarChart3, label: "Catalog Depth", value: "Album Distribution", desc: "Playcount concentration across discography" },
];

const AnalyticsPreview = () => (
  <section className="section-padding border-y border-border/70 bg-secondary/50 scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Intelligence</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Music Catalog Intelligence Platform
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Investment-grade analytics for evaluating music catalogs as financial assets.
              Real streaming data, acquisition scoring, and AI-driven insights.
            </p>
          </div>

          <Link
            to="/music-analytics"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground hover:bg-primary/15"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <article
            key={m.label}
            className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]"
          >
            <m.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{m.label}</h3>
            <p className="mt-1 text-xs font-medium text-primary/80">{m.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.desc}</p>
          </article>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Built using real streaming data, public APIs, and simplified financial modeling
      </p>
    </div>
  </section>
);

export default AnalyticsPreview;
