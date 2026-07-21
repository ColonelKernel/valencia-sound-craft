/**
 * Software projects — single source of truth for the /projects page and the
 * homepage teaser.
 *
 * Curate, don't catalog: every card links to something real and public — a
 * live app, an in-site route, or a repository with actual source. Every
 * external URL here was fetched and confirmed 200 before landing. Repos that
 * are scaffolds or unreleased stay off this page entirely.
 */

export type ProjectKind = "web-app" | "in-site" | "ableton-extension" | "research";

export interface ProjectLink {
  label: string;
  /** Absolute https URL, or an in-app route starting with "/". */
  url: string;
}

export interface Project {
  id: string;
  kind: ProjectKind;
  title: string;
  tagline: string;
  stack: string[];
  links: ProjectLink[];
}

export const PROJECTS: Project[] = [
  {
    id: "autoharm",
    kind: "web-app",
    title: "AutoHarm",
    tagline:
      "Generative chord instrument — Markov corpus blend plus a JazzNet RNN/LSTM, playing live MIDI into any DAW. A web port of the Autoharmonizer Max patch.",
    stack: ["TypeScript", "Web MIDI", "Machine learning"],
    links: [
      { label: "Launch app", url: "https://colonelkernel.github.io/AutoHarm-Web/" },
      { label: "Source", url: "https://github.com/ColonelKernel/AutoHarm-Web" },
    ],
  },
  {
    id: "groove-atlas",
    kind: "in-site",
    title: "Groove Atlas",
    tagline:
      "A world map of rhythm traditions with verified ethnomusicological citations, paired with a canvas feel-space lab over a drum-performance dataset.",
    stack: ["React", "Leaflet", "Canvas", "Web Audio"],
    links: [{ label: "Open atlas", url: "/groove-atlas" }],
  },
  {
    id: "music-analytics",
    kind: "in-site",
    title: "Music Catalog Intelligence",
    tagline:
      "Catalog analytics dashboard for music investment analysis — forecasting and AI-assisted analysis over a demonstration dataset of public Spotify popularity data.",
    stack: ["React", "Recharts", "Supabase"],
    links: [{ label: "Open dashboard", url: "/music-analytics" }],
  },
  {
    id: "music-tools",
    kind: "in-site",
    title: "Interactive Music Tools",
    tagline:
      "Rhythm engine, harmony lab, rhythm map, circle of fifths, and Tonnetz — five workspaces sharing one key, tempo, and transport.",
    stack: ["React", "Web Audio", "Music theory"],
    links: [{ label: "Open tools", url: "/tools" }],
  },
  {
    id: "drum-cartographer",
    kind: "ableton-extension",
    title: "Drum Rack Cartographer",
    tagline: "Analyzes, labels, previews, and remaps drum MIDI into a readable Drum Rack map.",
    stack: ["TypeScript", "Ableton Extensions SDK"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/AbletonDrumCartographer" }],
  },
  {
    id: "track-doctor",
    kind: "ableton-extension",
    title: "Track Doctor",
    tagline: "Cleans up messy Live sets with smart, reviewable track renames.",
    stack: ["TypeScript", "Ableton Extensions SDK"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/AbletonTrackDoctor" }],
  },
  {
    id: "arrangement-architect",
    kind: "ableton-extension",
    title: "Arrangement Architect",
    tagline:
      "Scans a Live Set, maps scenes and track roles, scores arrangement health, and generates a section-by-section plan.",
    stack: ["TypeScript", "Ableton Extensions SDK"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/ArrangementArchitect" }],
  },
  {
    id: "live-console",
    kind: "ableton-extension",
    title: "Live Console",
    tagline:
      "Command-palette workflow utility for Ableton Live, inspired by REAPER's ReaConsole — type short commands instead of clicking through the set.",
    stack: ["TypeScript", "Ableton Extensions SDK"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/AbletonLiveConsole" }],
  },
  {
    id: "research",
    kind: "research",
    title: "Music-Tech Research",
    tagline:
      "The research dossier behind the tools: session-state analysis across DAWs, the Autoharmonizer instrument, and a proposed research trajectory.",
    stack: ["Python", "Max/MSP", "MIR"],
    links: [{ label: "research.zachscheffler.com", url: "https://research.zachscheffler.com/" }],
  },
];

export const PROJECT_SECTIONS: Array<{ kind: ProjectKind; title: string }> = [
  { kind: "web-app", title: "Live Web Apps" },
  { kind: "in-site", title: "On This Site" },
  { kind: "ableton-extension", title: "Ableton Live Extensions" },
  { kind: "research", title: "Research" },
];
