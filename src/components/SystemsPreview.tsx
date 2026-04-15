import { ArrowRight, Globe2, Hexagon, Music2, RadioTower, Waves } from "lucide-react";
import { Link } from "react-router-dom";

const systems = [
  {
    to: "/tools/rhythm",
    icon: Globe2,
    title: "TransitSynth / Rhythm Atlas",
    description: "A system for exploring and generating rhythm through structured pattern spaces — mapping topology to sound.",
  },
  {
    to: "/tools/harmony",
    icon: Music2,
    title: "Harmony Lab",
    description: "Mode visualization, chord building, notation, and practice tools — a hybrid recommendation system combining audio features and metadata.",
  },
  {
    to: "/tools/map",
    icon: RadioTower,
    title: "Rhythm Map",
    description: "Geographic selection to playable rhythm state — generative engine driven by cultural pattern data.",
  },
  {
    to: "/tools/circle",
    icon: Waves,
    title: "Circle of Fifths",
    description: "Interactive key relationships with shared global key, mode, and transport state.",
  },
  {
    to: "/tools/tonnetz",
    icon: Hexagon,
    title: "Tonnetz",
    description: "Neo-Riemannian harmonic navigation with bi-directional sync and real-time voicing.",
  },
  {
    to: "/tools/chord-atlas",
    icon: Music2,
    title: "Chord Atlas",
    description: "Map every chord in any key to the guitar neck — voicings, harmonic functions, and position-constrained improvisation.",
  },
];

const SystemsPreview = () => (
  <section id="systems" className="section-padding border-y border-border/70 bg-secondary/50 scroll-mt-24">
    <div className="container mx-auto space-y-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Featured Systems</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Interactive Music Systems
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Each project is a playable system — not a portfolio piece. Open any tool directly,
              share links, and keep state connected across the app.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Open All Systems
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {systems.map((card) => (
          <article
            key={card.to}
            className="group rounded-xl border border-border/70 bg-card/75 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)] hover:border-foreground/15 transition-colors"
          >
            <card.icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
            <Link
              to={card.to}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:gap-3 transition-all"
            >
              Open System <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default SystemsPreview;
