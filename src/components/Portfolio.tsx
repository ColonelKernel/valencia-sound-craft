import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import AudioPlaylist from "./AudioPlaylist";
import { GLOBAL_PULSE, WORK_EMBEDS } from "@/content/work";
import { useFadeIn } from "@/hooks/useFadeIn";

const Portfolio = () => {
  const ref = useFadeIn();

  return (
    <section id="portfolio" className="section-padding !pt-8 bg-secondary/50" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Selected Work</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Music &amp; Video</h2>
          </div>
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground border border-border rounded-2xl px-4 py-2.5 hover:bg-accent transition-colors"
          >
            See all work <ArrowRight size={16} />
          </Link>
        </div>

        <div className="fade-up grid md:grid-cols-2 gap-6">
          {WORK_EMBEDS.map((embed) => (
            <div key={embed.id} className="rounded-sm overflow-hidden border border-border bg-card">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-display font-semibold">{embed.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {embed.role} · {embed.year}
                </p>
              </div>
              <iframe
                title={embed.title}
                src={embed.embedUrl}
                width="100%"
                height={embed.height}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block"
              />
            </div>
          ))}
        </div>

        <div className="fade-up mt-6 max-w-2xl">
          <AudioPlaylist title={GLOBAL_PULSE.title} tracks={GLOBAL_PULSE.tracks} />
          <p className="mt-3 text-xs text-muted-foreground">
            {GLOBAL_PULSE.subtitle} —{" "}
            <Link to="/work" className="underline underline-offset-2 hover:text-foreground">
              full credits on the work page
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
