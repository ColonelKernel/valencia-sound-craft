/**
 * Selected music & video work — single source of truth for the /work page and
 * the homepage Work section.
 *
 * Curate, don't catalog: every item is released or publicly viewable, and every
 * title, credit, and role is verified against primary sources (the Global Pulse
 * culminating-experience paper's credits appendix, platform metadata, and
 * session archives). Nothing lands here that can't be traced to a source.
 */

export type WorkEmbedKind = "spotify" | "youtube" | "soundcloud";

export interface WorkEmbed {
  id: string;
  kind: WorkEmbedKind;
  title: string;
  /** Zach's role on the work. */
  role: string;
  year: string;
  embedUrl: string;
  height: number;
  description: string;
}

export interface WorkTrack {
  title: string;
  src: string;
  style: string;
  credits: string;
}

export const WORK_EMBEDS: WorkEmbed[] = [
  {
    id: "spotify-streetcar-scandal",
    kind: "spotify",
    title: "Streetcar Scandal",
    role: "Artist & producer",
    year: "2013–present",
    embedUrl: "https://open.spotify.com/embed/artist/3np4vEs0UOE5zFEXmFEc9L?utm_source=generator&theme=0",
    height: 352,
    description:
      "My artist project — indie rock, electronic textures, and raw songwriting. I've been producing under this name since 2013.",
  },
  {
    id: "spotify-verva-russafa-archives",
    kind: "spotify",
    title: "Verva — Russafa Archives",
    role: "Session recording",
    year: "2025",
    embedUrl: "https://open.spotify.com/embed/album/2gVtu10BAvTcuPJBD8gNhO?utm_source=generator&theme=0",
    height: 352,
    description:
      "Verva's album, named for the Russafa neighborhood in Valencia. I recorded the band's sessions at Berklee Valencia's studios.",
  },
  {
    id: "youtube-chiaburu-momentum",
    kind: "youtube",
    title: "Cristian Chiaburu — Momentum (Live Studio Session)",
    role: "Video production",
    year: "2025",
    embedUrl: "https://www.youtube.com/embed/3aFWd74ffGE",
    height: 315,
    description:
      "Live studio session video for bassist Cristian Chiaburu, who plays across the Global Pulse EP.",
  },
  {
    id: "youtube-verva-icipop",
    kind: "youtube",
    title: "Verva — Icipop",
    role: "Session recording",
    year: "2025",
    embedUrl: "https://www.youtube.com/embed/cnGRi_fasyE",
    height: 315,
    description: "From the Russafa Archives sessions I recorded at Berklee Valencia.",
  },
  {
    id: "youtube-la-vitti-song-2",
    kind: "youtube",
    title: "La Vitti — Song 2 (Live Session)",
    role: "Recording & video",
    year: "2026",
    embedUrl: "https://www.youtube.com/embed/KtgLL1YZW4c",
    height: 315,
    description: "From a five-song live session I recorded with La Vitti in Valencia.",
  },
  {
    id: "soundcloud-streetcar-scandal",
    kind: "soundcloud",
    title: "Streetcar Scandal on SoundCloud",
    role: "Artist & producer",
    year: "2013–present",
    embedUrl:
      "https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/streetcarscandal&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true",
    height: 300,
    description: "Demos, experiments, and releases that live outside the streaming catalog.",
  },
];

/**
 * Global Pulse — five-track debut EP, the Berklee Valencia culminating
 * experience (2025). Track order, styles, and credits follow the CE paper's
 * credits appendix verbatim.
 */
export const GLOBAL_PULSE = {
  title: "Global Pulse",
  subtitle: "Debut EP · Berklee Valencia culminating experience · 2025",
  description:
    "Five tracks moving through Neo Soul/R&B, experimental electronic, rock, and 1970s textures — built from field recordings, modular synthesis, AI-assisted vocal processing, and a multi-DAW pipeline.",
  tracks: [
    {
      title: "Activate",
      src: "/audio/Activate_v14.m4a",
      style: "Neo Soul / R&B",
      credits:
        "Alex Varvargos (vocals), Enrico Erok Manfrin (co-production, piano), Cristian Chiaburu (bass). Produced, co-written & mixed by Zach Scheffler.",
    },
    {
      title: "Odysseus",
      src: "/audio/Odysseus_v12.m4a",
      style: "Experimental Electronic",
      credits: "Written & produced by Zach Scheffler.",
    },
    {
      title: "Ride",
      src: "/audio/5_Step_v13.m4a",
      style: "Experimental Rock",
      credits:
        "Robin Wilson (keys), Tony Ma (drums), Cristian Chiaburu (bass), Jeries Babish (assistant production). Produced, written, sung & mixed by Zach Scheffler.",
    },
    {
      title: "Feeling Low",
      src: "/audio/Feeling_Low_v10.m4a",
      style: "Experimental Electronic",
      credits:
        "Anne Noor Schepers (vocals), Cristian Chiaburu (bass), Jeries Babish (assistant production). Produced & co-written by Zach Scheffler.",
    },
    {
      title: "Spiral of Doubt",
      src: "/audio/Spiral_of_Doubt_FINAL_v14.m4a",
      style: "Classic 1970s Rock",
      credits:
        "Robin Wilson (keys), Tony Ma (drums), Cristian Chiaburu (bass), Jeries Babish (assistant production). Produced, written & mixed by Zach Scheffler.",
    },
  ] satisfies WorkTrack[],
};

/** Public profiles for JSON-LD sameAs and the site footer. */
export const ARTIST_PROFILES = {
  spotify: "https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L",
  soundcloud: "https://soundcloud.com/streetcarscandal",
  youtube: "https://www.youtube.com/@ColonelKernel22",
  instagram: "https://www.instagram.com/streetcarscandal/",
  linkedin: "https://www.linkedin.com/in/zscheff/",
  github: "https://github.com/ColonelKernel",
};
