import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import AudioPlaylist from "./AudioPlaylist";
import EmbedFacade from "./EmbedFacade";
import { GLOBAL_PULSE, WORK_EMBEDS } from "@/content/work";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

const Portfolio = () => {
  const ref = useFadeIn();

  return (
    <section id="portfolio" className="section-padding !pt-8 bg-secondary/50" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Selected Work</p>
            <h2 className="type-h1">Music &amp; Video</h2>
          </div>
          <Link
            to="/work"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            See all work <ArrowRight size={16} />
          </Link>
        </div>

        <div className="fade-up grid md:grid-cols-2 gap-6">
          {WORK_EMBEDS.map((embed) => (
            <div key={embed.id} className={cardClasses({ padding: "none", flush: true })}>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-display font-semibold">{embed.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {embed.role} · {embed.year}
                </p>
              </div>
              <EmbedFacade embed={embed} />
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
