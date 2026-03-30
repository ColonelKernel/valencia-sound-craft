import { useFadeIn } from "@/hooks/useFadeIn";
import { ExternalLink, Music, Briefcase, Youtube } from "lucide-react";

const externalLinks = [
  {
    title: "SoundCloud",
    description: "Listen to tracks, demos, and productions",
    url: "https://soundcloud.com/streetcarscandal",
    icon: Music,
  },
  {
    title: "Spotify",
    description: "Stream released music on Spotify",
    url: "https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L",
    icon: Music,
  },
  {
    title: "YouTube",
    description: "Watch live performances and videos",
    url: "https://youtu.be/3aFWd74ffGE?list=RD3aFWd74ffGE",
    icon: Youtube,
  },
  {
    title: "LinkedIn",
    description: "Professional background and connections",
    url: "https://www.linkedin.com/in/zscheff/",
    icon: Briefcase,
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

        <div className="fade-up grid sm:grid-cols-3 gap-4">
          {externalLinks.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 border border-border rounded-sm p-5 hover:border-foreground/20 transition-colors bg-card"
            >
              <div className="bg-foreground/5 rounded-sm p-3 group-hover:bg-foreground/10 transition-colors">
                <link.icon size={20} className="text-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
