import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useFadeIn } from "@/hooks/useFadeIn";
import AudioPlaylist from "./AudioPlaylist";

const globalPulseTracks = [
  { title: "Ride", src: "/audio/5_Step_v13.m4a" },
  { title: "Activate", src: "/audio/Activate_v14.m4a" },
  { title: "Feeling Low", src: "/audio/Feeling_Low_v10.m4a" },
  { title: "Odysseus", src: "/audio/Odysseus_v12.m4a" },
  { title: "Spiral of Doubt", src: "/audio/Spiral_of_Doubt_FINAL_v14.m4a" },
];

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
    title: "YouTube",
    src: "https://www.youtube.com/embed/cnGRi_fasyE",
    height: 315,
  },
  {
    title: "YouTube",
    src: "https://www.youtube.com/embed/KtgLL1YZW4c",
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
  // Work is visible on first load; the toggle only lets visitors tuck it
  // away — never the reverse (a hidden portfolio reads as an empty one).
  const [expanded, setExpanded] = useState(true);

  return (
    <section id="portfolio" className="section-padding !pt-8 bg-secondary/50" ref={ref}>
      <div className="container mx-auto">
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="fade-up mb-10 w-full flex items-center justify-between group"
        >
          <div className="text-left">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Selected Work</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Portfolio</h2>
          </div>
          <div className="shrink-0 ml-4 w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-accent transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {expanded && (
          <>
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

            <div className="fade-up mt-6 max-w-2xl">
              <AudioPlaylist title="Global Pulse" tracks={globalPulseTracks} />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
