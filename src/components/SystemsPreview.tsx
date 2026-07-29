import { ArrowRight, Brain, Globe2, Hexagon, Music2, RadioTower, Waves } from "lucide-react";
import { Link } from "react-router-dom";

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
  <section id="systems" className="section-padding !pb-8 border-y border-border/70 bg-secondary/50 scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Systems</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Interactive Music Tools, Routed as One System
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Open each workspace directly, share links to exact tools, and keep rhythm, harmony,
              and transport state connected across the app.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground hover:bg-primary/15"
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
              className={`rounded-[1.5rem] border p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)] ${
                featured
                  ? "md:col-span-2 xl:col-span-3 border-emerald-500/30 bg-emerald-950/20"
                  : "border-border/70 bg-card/75"
              }`}
            >
              <div className={featured ? "flex flex-col md:flex-row md:items-center md:gap-8" : ""}>
                <div className={featured ? "flex-1" : ""}>
                  <div className="flex items-center gap-2">
                    <card.icon className={`h-5 w-5 ${featured ? "text-emerald-400" : "text-primary"}`} />
                    {/* emerald-300 at full opacity: the /70 variant failed WCAG contrast on the dark card. */}
                    {featured && <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-full">World Atlas + Feel-Space</span>}
                  </div>
                  <h3 className={`mt-4 font-semibold text-foreground ${featured ? "text-2xl" : "text-lg"}`}>{card.title}</h3>
                  <p className={`mt-2 leading-6 text-muted-foreground ${featured ? "text-base max-w-2xl" : "text-sm"}`}>{card.description}</p>
                </div>
                <Link
                  to={card.to}
                  className={`mt-5 md:mt-0 inline-flex items-center gap-2 font-medium hover:text-primary ${
                    featured
                      ? "text-base text-emerald-400 hover:text-emerald-300 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3"
                      : "text-sm text-foreground"
                  }`}
                >
                  {featured ? "Open Groove Atlas" : "Open tool"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-violet-500/25 bg-violet-950/15 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          More engineering: the AutoHarm chord instrument, Ableton Live extensions, and
          music-tech research.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          All projects <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default SystemsPreview;
