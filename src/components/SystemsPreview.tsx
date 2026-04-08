import { ArrowRight, Globe2, Hexagon, Music2, RadioTower, Waves } from "lucide-react";
import { Link } from "react-router-dom";

const previewCards = [
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {previewCards.map((card) => (
          <article
            key={card.to}
            className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
            <Link
              to={card.to}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
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

