/**
 * Software projects — single source of truth for the /projects page and the
 * homepage teaser.
 *
 * Curate, don't catalog: every card links to something real and public — a
 * live app, an in-site route, or a repository with actual source. Every
 * external URL here was fetched and confirmed 200 before landing. Repos that
 * are scaffolds or unreleased stay off this page entirely.
 */

export type ProjectKind =
  | "data"
  | "web-app"
  | "in-site"
  | "audio-tooling"
  | "ableton-extension"
  | "research";

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
    id: "transit-atlas",
    kind: "data",
    title: "World Transit Atlas",
    tagline:
      "An interactive atlas of 201 metro, light-rail and tram systems \u2014 1,298 lines and 22,641 stations assembled from OpenStreetMap, citylines.co and public agency open data, with monthly ridership for the 33 systems that publish it. Real geometry, not schematic; 899k OSM vertices simplified to 217k so the whole thing ships as one static file.",
    stack: ["Python", "R", "Overpass API", "GeoJSON", "D3-style canvas"],
    links: [
      { label: "Case study", url: "/projects/transit-atlas" },
      { label: "Live atlas", url: "https://colonelkernel.github.io/world-transit-atlas/" },
      { label: "Source", url: "https://github.com/ColonelKernel/world-transit-atlas" },
    ],
  },
  {
    id: "this-site",
    kind: "web-app",
    title: "This Site",
    tagline:
      "zachscheffler.com itself — a React SPA whose four music tools share one Web Audio transport and clock. Every push and pull request has to pass typecheck, zero-warning lint, the unit suites, a production build, a Playwright end-to-end run, a 150KB gzip budget on the initial graph, and Lighthouse CI holding accessibility at 1.0 across all fourteen routes.",
    stack: ["TypeScript", "React", "Web Audio", "Vitest + Playwright", "GitHub Actions"],
    links: [
      { label: "Source", url: "https://github.com/ColonelKernel/valencia-sound-craft" },
      { label: "Tools", url: "/tools" },
    ],
  },
  {
    id: "autoharm",
    kind: "web-app",
    title: "AutoHarm",
    // Precise on purpose. "Machine learning" implied training that this repo
    // doesn't contain (it ships ONNX inference over checkpoints exported from
    // the original Max patch), and "any DAW" hid the real constraint: MIDI out
    // needs a virtual port and a Web MIDI browser — Safari can't route it.
    tagline:
      "Generative chord instrument — a four-corpus Markov blend (Nottingham, POP909, Bach, OpenBook) alongside JazzNet RNN and LSTM models running on-device in ONNX. Plays live MIDI into any DAW over a virtual port in Chrome, Edge, or Firefox, and exports every take as a .mid file. A web port of my Autoharmonizer Max patch.",
    stack: ["TypeScript", "Web MIDI", "ONNX inference"],
    links: [
      { label: "Case study", url: "/projects/autoharm" },
      { label: "Launch app", url: "https://autoharm.zachscheffler.com/" },
      { label: "Source", url: "https://github.com/ColonelKernel/AutoHarm-Web" },
    ],
  },
  {
    id: "music-analytics",
    kind: "in-site",
    title: "Music Catalog Intelligence",
    tagline:
      "Catalog analytics dashboard for music investment analysis — forecasting, risk scoring, and side-by-side comparison over a demonstration dataset of public Spotify popularity data.",
    stack: ["React", "Recharts", "Supabase"],
    links: [
      { label: "Open dashboard", url: "/music-analytics" },
      { label: "Case study", url: "/projects/catalog-intelligence" },
    ],
  },
  {
    id: "music-tools",
    kind: "in-site",
    title: "Interactive Music Tools",
    tagline:
      "Rhythm engine, harmony lab, rhythm map, circle of fifths, and Tonnetz — five workspaces sharing one key, tempo, and transport, driven by a lookahead Web Audio scheduler that gives each track its own subdivision of the bar for real cross-rhythms.",
    stack: ["React", "Web Audio", "Music theory"],
    links: [{ label: "Open tools", url: "/tools" }],
  },
  {
    id: "vcv-rack-mcp",
    kind: "audio-tooling",
    title: "VCV Rack MCP",
    tagline:
      "A Model Context Protocol server that lets an agent build modular patches in VCV Rack. The rack side is a C++ plugin that applies every edit as a transaction it can roll back; the TypeScript server validates the whole plan before anything touches the running rack.",
    stack: ["C++", "TypeScript", "CMake", "MCP"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/vcv-rack-mcp" }],
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
    id: "autoharmonizer",
    kind: "ableton-extension",
    title: "Autoharmonizer",
    tagline:
      "The Max for Live original that AutoHarm was ported from — a generative chord instrument built as a Max/MSP patch driving a Python side over OSC protocol v3, with an in-process ONNX and pure-JS bridge running the models.",
    stack: ["Max/MSP", "Python", "OSC", "ONNX"],
    links: [{ label: "Source", url: "https://github.com/ColonelKernel/Autoharmonizer" }],
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
  {
    id: "session-state",
    kind: "research",
    title: "Session-State Analyzer",
    tagline:
      "The analytical layer over four DAW session-state explorers — REAPER, Logic, Cubase, and Ableton Live — each gathering its evidence a different way behind one canonical contract, so a session can be compared across DAWs with measured observability and an explainable alignment.",
    stack: ["Python", "DAW project formats", "MIR"],
    links: [
      { label: "Case study", url: "/projects/session-state" },
      { label: "Source", url: "https://github.com/ColonelKernel/session-state-analyzer" },
    ],
  },
];

export const PROJECT_SECTIONS: Array<{ kind: ProjectKind; title: string }> = [
  // Data leads the page for the same reason the homepage leads with it: this
  // is the section a data-science reader is looking for, and it used to not
  // exist at all.
  { kind: "data", title: "Data & Geospatial" },
  { kind: "web-app", title: "Live Web Apps" },
  { kind: "in-site", title: "On This Site" },
  { kind: "audio-tooling", title: "Audio Tooling" },
  { kind: "ableton-extension", title: "Ableton Live Extensions" },
  { kind: "research", title: "Research" },
];
