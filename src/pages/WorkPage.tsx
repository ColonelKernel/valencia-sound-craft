import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import AudioPlaylist from "@/components/AudioPlaylist";
import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { ARTIST_PROFILES, GLOBAL_PULSE, WORK_EMBEDS } from "@/content/work";
import { useFadeIn } from "@/hooks/useFadeIn";

const WorkPage = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.work.title}
        description={ROUTE_META.work.description}
        canonicalPath={ROUTE_META.work.path}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MusicGroup",
          name: "Streetcar Scandal",
          description:
            "Zach Scheffler's artist project — indie rock, electronic textures, and raw songwriting, produced since 2013.",
          sameAs: [ARTIST_PROFILES.spotify, ARTIST_PROFILES.soundcloud, ARTIST_PROFILES.youtube],
          url: ROUTE_META.work.path,
        }}
      />
      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-12 max-w-2xl">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Selected Work</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Music &amp; Video</h1>
              <p className="text-muted-foreground leading-relaxed">
                Everything here is work I can put my name on: the EP I wrote and produced at
                Berklee Valencia, sessions I recorded for other artists, and video work for
                collaborators. I release my own music as{" "}
                <span className="text-foreground font-semibold">Streetcar Scandal</span> — I've
                been producing since 2013. Press play on anything.
              </p>
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
                  <p className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
                    {embed.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding !pt-0 bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-8 max-w-2xl">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">The EP</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{GLOBAL_PULSE.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{GLOBAL_PULSE.subtitle}</p>
              <p className="text-muted-foreground leading-relaxed">{GLOBAL_PULSE.description}</p>
            </div>

            <div className="fade-up grid lg:grid-cols-2 gap-6 items-start">
              <AudioPlaylist title={GLOBAL_PULSE.title} tracks={GLOBAL_PULSE.tracks} />

              <div className="rounded-sm border border-border bg-card divide-y divide-border">
                {GLOBAL_PULSE.tracks.map((track) => (
                  <div key={track.title} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{track.title}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{track.style}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{track.credits}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up mt-12">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WorkPage;
