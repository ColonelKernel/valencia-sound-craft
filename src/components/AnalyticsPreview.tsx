import { ArrowRight, BarChart3, TrendingUp, Shield, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

const sparkData = {
  acquisition: [
    { v: 42 }, { v: 48 }, { v: 45 }, { v: 55 }, { v: 58 }, { v: 52 },
    { v: 61 }, { v: 67 }, { v: 63 }, { v: 72 }, { v: 78 }, { v: 74 },
  ],
  revenue: [
    { v: 12 }, { v: 18 }, { v: 22 }, { v: 28 }, { v: 31 }, { v: 35 },
    { v: 33 }, { v: 40 }, { v: 46 }, { v: 52 }, { v: 55 }, { v: 61 },
  ],
  risk: [
    { v: 30 }, { v: 45 }, { v: 25 }, { v: 50 }, { v: 35 }, { v: 55 },
    { v: 28 }, { v: 42 }, { v: 38 }, { v: 48 }, { v: 32 }, { v: 40 },
  ],
  catalog: [
    { v: 85 }, { v: 62 }, { v: 48 }, { v: 35 }, { v: 28 }, { v: 20 },
    { v: 15 }, { v: 12 },
  ],
};

const metrics = [
  {
    icon: Target, label: "Acquisition Scoring", value: "0–100",
    desc: "Weighted model evaluating growth, volatility, longevity & momentum",
    spark: (
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={sparkData.acquisition}>
          <defs>
            <linearGradient id="sparkAcq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="hsl(var(--foreground))" strokeWidth={1.5} fill="url(#sparkAcq)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    ),
  },
  {
    icon: TrendingUp, label: "Revenue Forecasting", value: "Linear Regression",
    desc: "Stream-to-revenue projections with confidence bands",
    spark: (
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={sparkData.revenue}>
          <Line type="monotone" dataKey="v" stroke="hsl(142 71% 45%)" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
  {
    icon: Shield, label: "Risk Analysis", value: "Rolling Variance",
    desc: "Volatility tracking and catalog diversification scoring",
    spark: (
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={sparkData.risk}>
          <defs>
            <linearGradient id="sparkRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="hsl(0 84% 60%)" strokeWidth={1.5} fill="url(#sparkRisk)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    ),
  },
  {
    icon: BarChart3, label: "Catalog Depth", value: "Album Distribution",
    desc: "Playcount concentration across discography",
    spark: (
      <ResponsiveContainer width="100%" height={40}>
        <BarChart data={sparkData.catalog}>
          <Bar dataKey="v" fill="hsl(var(--foreground))" opacity={0.3} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
];

const AnalyticsPreview = () => (
  <section id="analytics-preview" className="section-padding border-y border-border/70 bg-background scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Analytics Lab</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Music Catalog Intelligence
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              A collection of tools and dashboards for analyzing music performance, audience behavior,
              and catalog dynamics. Designed to simulate real-world music platform and catalog analytics environments.
            </p>
          </div>

          <Link
            to="/music-analytics"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
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
            className="rounded-xl border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]"
          >
            <m.icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{m.label}</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{m.value}</p>
            <div className="mt-3">{m.spark}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{m.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default AnalyticsPreview;
