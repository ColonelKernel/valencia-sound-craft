import { useFadeIn } from "@/hooks/useFadeIn";
import { ExternalLink, Briefcase } from "lucide-react";

const embeds = [
  {
    title: "Spotify – Artist",
    src: "https://open.spotify.com/embed/artist/3np4vEs0UOE5zFEXmFEc9L?utm_source=generator&theme=0",
    height: 352,
  },
  {
    title: "Spotify – Album",
    src: "https://open.spotify.com/embed/album/2gVtu10BAvTcuPJBD8gNhO?utm_source=generator&theme=0",
    height: 352,
  },
  {
    title: "YouTube",
    src: "https://www.youtube.com/embed/3aFWd74ffGE",
    height: 315,
  },
  {
    title: "SoundCloud",
    src: "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/streetcarscandal&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true",
    height: 300,
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

        <div className="fade-up grid md:grid-cols-2 gap-6">
          {embeds.map((embed) => (
            <div key={embed.title} className="rounded-sm overflow-hidden border border-border bg-card">
              <p className="px-4 py-3 text-sm font-display font-semibold border-b border-border">
                {embed.title}
              </p>
              <iframe
                title={embed.title}
                src={embed.src}
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

        <div className="fade-up mt-6">
          <a
            href="https://www.linkedin.com/in/zscheff/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-4 border border-border rounded-sm p-5 hover:border-foreground/20 transition-colors bg-card"
          >
            <div className="bg-foreground/5 rounded-sm p-3 group-hover:bg-foreground/10 transition-colors">
              <Briefcase size={20} className="text-foreground/60" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">LinkedIn</p>
              <p className="text-xs text-muted-foreground">Professional background and connections</p>
            </div>
            <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
