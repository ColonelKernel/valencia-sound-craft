import { useFadeIn } from "@/hooks/useFadeIn";
import { Play, ExternalLink } from "lucide-react";

const projects = [
  {
    title: "Midnight Sessions EP",
    category: "Music Production",
    description: "Full production and mixing for a 5-track indie rock EP.",
  },
  {
    title: "Acoustic Live Session",
    category: "Video / Live Sessions",
    description: "Multi-camera live recording for an acoustic duo.",
  },
  {
    title: "Neon Pulse",
    category: "Mixing Work",
    description: "Mix and master for an electronic pop single release.",
  },
  {
    title: "Flamenco Fusion",
    category: "Performance",
    description: "Guitar arrangement and live performance recording.",
  },
  {
    title: "Debut Album — Alma",
    category: "Music Production",
    description: "Produced and mixed a full-length debut album across genres.",
  },
  {
    title: "Studio Sessions Vol. 1",
    category: "Video / Live Sessions",
    description: "Studio live session series for emerging Latin artists.",
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
