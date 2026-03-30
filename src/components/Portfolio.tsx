import { useFadeIn } from "@/hooks/useFadeIn";
import { Play, ExternalLink } from "lucide-react";

const projects = [
  {
    title: "Midnight Sessions EP",
    category: "Production & Mixing",
    description: "Indie rock — full production, arrangement, and mix for a 5-track EP.",
  },
  {
    title: "Acoustic Live Session",
    category: "Video / Live Sessions",
    description: "Singer-songwriter — multi-camera live recording with studio-quality audio.",
  },
  {
    title: "Neon Pulse",
    category: "Mixing",
    description: "Electronic pop — mix and master bringing clarity and punch to a synth-driven single.",
  },
  {
    title: "Flamenco Fusion",
    category: "Performance & Production",
    description: "Latin-jazz fusion — guitar arrangement, live performance, and final mix.",
  },
  {
    title: "Debut Album — Alma",
    category: "Production & Mixing",
    description: "Cross-genre debut — produced and mixed 10 tracks blending rock, electronic, and Latin influences.",
  },
  {
    title: "Studio Sessions Vol. 1",
    category: "Video / Live Sessions",
    description: "Latin pop — live session series produced for emerging artists, optimized for social media.",
  },
];

const Portfolio = () => {
  const ref = useFadeIn();

  return (
    <section id="portfolio" className="section-padding bg-secondary/50" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-16">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Selected Work</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Portfolio</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <div
              key={p.title}
              className="fade-up group relative bg-card border border-border rounded-sm overflow-hidden hover:border-foreground/20 transition-colors cursor-pointer"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Placeholder visual */}
              <div className="aspect-video bg-foreground/5 flex items-center justify-center relative overflow-hidden">
                <div className="flex items-end gap-[2px] h-12">
                  {Array.from({ length: 24 }).map((_, j) => (
                    <div
                      key={j}
                      className="bg-foreground/15 w-[3px] rounded-t-full group-hover:bg-foreground/30 transition-colors"
                      style={{
                        height: `${Math.sin((j + i * 5) * 0.4) * 60 + 40}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-foreground/80 rounded-full p-3">
                    <Play size={18} className="text-background ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                  {p.category}
                </p>
                <h3 className="text-base font-display font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
