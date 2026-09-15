import { ArrowRight, Brain, Globe2, Hexagon, Music2, RadioTower, Waves } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";

const previewCards = [
  {
    to: "/groove-atlas",
    icon: Brain,
    title: "Groove Atlas",
    description: "A world map of rhythm traditions with cited sources, paired with a feel-space lab for exploring groove families by ear.",
    featured: true,
  },
  {
    to: "/tools/rhythm",
    icon: Globe2,
    title: "Rhythm Engine",
    description: "Atlas-backed sequencing, cultural rhythm identity, and direct-play composition tools.",
  },
  {
    to: "/tools/harmony",
    icon: Music2,
    title: "Harmony Lab",
    description: "Mode visualization, chord building, notation, and practice tools in one workspace.",
  },
  {
    to: "/tools/map",
    icon: RadioTower,
    title: "Rhythm Map",
    description: "Go from geographic selection to playable rhythm state without hidden UI steps.",
  },
  {
    to: "/tools/circle",
    icon: Waves,
    title: "Circle of Fifths",
    description: "Interactive key relationships with shared global key and mode state.",
  },
  {
    to: "/tools/tonnetz",
    icon: Hexagon,
    title: "Tonnetz",
    description: "Neo-Riemannian harmonic motion with shared tempo, transport, and tonal center.",
  },
];

const SystemsPreview = () => (
  <section id="systems" className="section-padding-tight scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="eyebrow">Systems</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="type-h1">
              Interactive Music Tools, Routed as One System
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Open each workspace directly, share links to exact tools, and keep rhythm, harmony,
              and transport state connected across the app.
            </p>
          </div>

          <Link
            to="/tools"
            className={buttonClasses({ variant: "secondary" })}
          >
            Explore Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {previewCards.map((card) => {
          const featured = 'featured' in card && card.featured;
          return (
            <article
              key={card.to}
              className={cardClasses(
                {},
                featured && "md:col-span-2 xl:col-span-3 border-foreground/20 bg-card",
              )}
            >
              <div className={featured ? "flex flex-col md:flex-row md:items-center md:gap-8" : ""}>
                <div className={featured ? "flex-1" : ""}>
                  <div className="flex items-center gap-2">
                    <card.icon className="h-5 w-5 text-primary" />
                    {featured && <span className="text-[10px] font-mono uppercase tracking-wider text-foreground bg-secondary px-2 py-0.5 rounded-full">World Atlas + Feel-Space</span>}
                  </div>
                  <h3 className={`mt-4 font-semibold text-foreground ${featured ? "text-2xl" : "text-lg"}`}>{card.title}</h3>
                  <p className={`mt-2 leading-6 text-muted-foreground ${featured ? "text-base max-w-2xl" : "text-sm"}`}>{card.description}</p>
                </div>
                <Link
                  to={card.to}
                  className={
                    featured
                      ? buttonClasses({ variant: "secondary" }, "mt-5 md:mt-0")
                      : "mt-5 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                  }
                >
                  {featured ? "Open Groove Atlas" : "Open tool"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className={cardClasses({ padding: "none" }, "flex flex-wrap items-center justify-between gap-3 px-5 py-4")}>
        <p className="text-sm text-muted-foreground">
          More engineering: the AutoHarm chord instrument, Ableton Live extensions, and
          music-tech research.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
        >
          All projects <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default SystemsPreview;
