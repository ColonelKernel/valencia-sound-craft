import { useState } from "react";
import { Play } from "lucide-react";

import type { WorkEmbed } from "@/content/work";

/**
 * Click-to-load facade for third-party players (Spotify / YouTube /
 * SoundCloud). The real iframe — megabytes of player JS plus its cookies —
 * only loads after an explicit tap, which keeps the homepage and /work light
 * on mobile. YouTube loads through the nocookie domain.
 */

const PROVIDER_LABELS: Record<WorkEmbed["kind"], string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
};

function youtubeVideoId(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function loadUrl(embed: WorkEmbed): string {
  if (embed.kind === "youtube") {
    return embed.embedUrl.replace("www.youtube.com", "www.youtube-nocookie.com");
  }
  return embed.embedUrl;
}

const EmbedFacade = ({ embed }: { embed: WorkEmbed }) => {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title={embed.title}
        src={loadUrl(embed)}
        width="100%"
        height={embed.height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block"
      />
    );
  }

  const videoId = embed.kind === "youtube" ? youtubeVideoId(embed.embedUrl) : null;

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Load ${embed.title} player`}
      className="relative block w-full group text-left"
      style={{ height: embed.height }}
    >
      {videoId && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
        />
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
        <span className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <Play size={22} className="ml-1" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-white/90">
          Load {PROVIDER_LABELS[embed.kind]} player
        </span>
      </span>
    </button>
  );
};

export default EmbedFacade;
