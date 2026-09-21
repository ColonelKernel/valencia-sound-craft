import { ArrowRight, BarChart3, Brain, Globe2, Hexagon, Music2, Waves } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { sparklineGeometry } from "@/lib/sparkline";
import { ANALYTICS_SPARKS } from "@/content/analyticsSparks";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * One work section where there used to be two.
 *
 * The homepage ran four consecutive "here is my work" bands — Evidence, the
 * Intelligence band, Systems, and Selected Work — each an icon-heading-blurb
 * card grid differing mainly in column count. Measured in the browser,
 * Systems alone was 2,100px and the Intelligence band reserved another 576.
 * A reader scrolled three card walls to learn what two would have told them.
 *
 * The Intelligence band is folded in here as a featured card rather than
 * deleted: it is the most on-message artifact on the site for the roles this
 * page is written for, so it keeps top billing and its sparkline — just not a
 * full-width band of its own. Every destination that existed before still has
 * a link.
 */

const SPARK_W = 120;
const SPARK_H = 32;

/** The revenue series, derived from the real dataset by scripts/generate-analytics-sparks.ts. */
const RevenueSpark = () => {
  const { line } = sparklineGeometry(ANALYTICS_SPARKS.revenue, {
    width: SPARK_W,
    height: SPARK_H,
  });
  return (
    <svg
      width="100%"
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
      className="mt-4 max-w-[16rem]"
    >
      <path
        d={line}
        fill="none"
        stroke="hsl(142 71% 45%)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const featured = [
  {
    to: ROUTE_META.musicAnalytics.path,
    icon: BarChart3,
    tag: "Acquisition · Forecasting · Risk",
    title: "Music Catalog Intelligence",
    description:
      "Catalogs valued as financial assets: a weighted acquisition score, OLS forecasting with a stated interval defect, and rolling-variance risk over a public Spotify dataset.",
    cta: "Open the dashboard",
    caption: "Modeled revenue by release month, last 24 months of the sample",
    spark: true,
  },
  {
    to: ROUTE_META.grooveAtlas.path,
    icon: Brain,
    tag: "World Atlas + Feel-Space",
    title: "Groove Atlas",
    description:
      "A world map of rhythm traditions with cited sources, paired with a canvas feel-space that clusters groove families by rhythmic feel.",
    cta: "Open Groove Atlas",
    spark: false,
  },
];

const tools = [
  {
    to: ROUTE_META.rhythm.path,
    icon: Globe2,
    title: "Rhythm Engine",
    description: "Atlas-backed sequencing over the world rhythm map.",
  },
  {
    to: ROUTE_META.harmony.path,
    icon: Music2,
    title: "Harmony Lab",
    description: "Modes, chord building, notation and practice in one workspace.",
  },
  {
    to: ROUTE_META.circle.path,
    icon: Waves,
    title: "Circle of Fifths",
    description: "Key relationships, sharing global key and mode state.",
  },
  {
    to: ROUTE_META.tonnetz.path,
    icon: Hexagon,
    title: "Tonnetz",
    description: "Neo-Riemannian motion over a shared transport and tonal center.",
  },
];

const SystemsPreview = () => (
  <section id="systems" className="section-padding-tight scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="eyebrow">Systems</p>
          <h2 className="type-h1">Things I Built and Can Show You</h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Two analytical systems and the interactive tools underneath them — all running
            in the browser, all sharing one transport and clock.
          </p>
        </div>
        <Link to={ROUTE_META.projects.path} className={buttonClasses({ variant: "secondary" })}>
          All projects
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {featured.map((card) => (
          <article key={card.to} className={cardClasses({}, "flex flex-col")}>
            <div className="flex items-center gap-2">
              <card.icon className="h-5 w-5 text-primary" />
              <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                {card.tag}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 leading-6 text-muted-foreground">{card.description}</p>

            {card.spark && (
              <>
                <RevenueSpark />
                {/* The chart is aria-hidden, so this caption is the only thing
                    that says what it plots — and it plots real data. */}
                <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground/70">
                  {card.caption}
                </p>
              </>
            )}

            <Link
              to={card.to}
              className={buttonClasses({ variant: "secondary" }, "mt-6 self-start")}
            >
              {card.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <article key={tool.to} className={cardClasses()}>
            <tool.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold text-foreground">{tool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
            <Link
              to={tool.to}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              Open tool
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default SystemsPreview;
