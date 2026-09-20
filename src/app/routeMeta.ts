/**
 * Single source of truth for every route's path, document title, and meta
 * description. App.tsx builds the router from this table, and each page
 * feeds its <RouteHead> from its entry here — paths and titles cannot
 * drift between the router and the page heads.
 *
 * Keep this module dependency-free: the Playwright suite imports it
 * directly to assert titles during navigation.
 */

export interface AppRouteMeta {
  /** react-router path pattern; also the canonical path for real pages */
  path: string;
  title: string;
  description: string;
}

export const ROUTE_META = {
  home: {
    path: "/",
    // Matches the static index.html title exactly, so the pre-hydration and
    // hydrated titles never differ.
    title: "Zach Scheffler — Data Scientist & ML Engineer",
    description:
      "Data scientist and ML engineer in the San Francisco Bay Area, open to remote. Applied data work across the World Bank, NORC, and Rios Partners, plus production ML and audio software.",
  },
  toolsIndex: {
    path: "/tools",
    title: "Music Tools | Zach Scheffler",
    description:
      "Interactive music tools for rhythm, harmony, and theory: a world rhythm engine, harmony lab, rhythm map, circle of fifths, and Tonnetz — all playing in sync.",
  },
  rhythm: {
    path: "/tools/rhythm",
    title: "Rhythm Engine | Zach Scheffler",
    description:
      "Play and sequence rhythms from around the world — a rhythm atlas, browser, and step sequencer that stay in sync.",
  },
  harmony: {
    path: "/tools/harmony",
    title: "Harmony Lab | Zach Scheffler",
    description:
      "Visualize modes, build chord progressions, and practice with a metronome and theory references in one connected workspace.",
  },
  map: {
    path: "/tools/map",
    title: "Rhythm Map | Zach Scheffler",
    description:
      "Explore a world rhythm atlas by country and tradition, and hear each groove play as you browse.",
  },
  circle: {
    path: "/tools/circle",
    title: "Circle of Fifths | Zach Scheffler",
    description:
      "An interactive circle of fifths for exploring key relationships, connected to the full music tool system.",
  },
  tonnetz: {
    path: "/tools/tonnetz",
    title: "Tonnetz | Zach Scheffler",
    description:
      "An interactive Tonnetz for exploring harmonic space, playing in the same key and tempo as the rest of the music tools.",
  },
  musicAnalytics: {
    path: "/music-analytics",
    title: "Music Catalog Intelligence | Zach Scheffler",
    description:
      "Catalog analytics dashboard for music investment analysis: forecasting, risk scoring, and side-by-side comparison over a demonstration dataset derived from public Spotify popularity data.",
  },
  grooveAtlas: {
    path: "/groove-atlas",
    title: "Groove Atlas | Zach Scheffler",
    description:
      "A world atlas of rhythm traditions with cited ethnomusicological sources, paired with an interactive feel-space lab for exploring groove families.",
  },
  projects: {
    path: "/projects",
    title: "Projects | Zach Scheffler",
    description:
      "Software by Zach Scheffler: the AutoHarm chord instrument, Ableton Live extensions, in-browser music systems, and music-tech research.",
  },
  // Key order here is load-bearing: build/stampRouteHeadsPlugin.ts zips it
  // against the lazy-import order in src/App.tsx, so this entry and the PAGES
  // entry must sit at the same ordinal position.
  autoharm: {
    path: "/projects/autoharm",
    title: "AutoHarm Case Study | Zach Scheffler",
    description:
      "How AutoHarm works: a four-corpus Markov blend and two JazzNet ONNX models running in the browser, playing live MIDI into a DAW — ported from a Max for Live device.",
  },
  catalogIntelligence: {
    path: "/projects/catalog-intelligence",
    title: "Music Catalog Intelligence: Case Study | Zach Scheffler",
    description:
      "How the catalog analytics platform works: a modeled Spotify dataset, a trailing-median rule for sparse buckets, a hand-weighted acquisition score, and the prediction interval's known limitation.",
  },
  transitAtlas: {
    path: "/projects/transit-atlas",
    title: "World Transit Atlas: Case Study | Zach Scheffler",
    description:
      "How the transit atlas works: 201 metro and light-rail systems assembled from OpenStreetMap and open agency data, 899k vertices simplified to fit one static file, and why only 33 of them carry ridership.",
  },
  sessionState: {
    path: "/projects/session-state",
    title: "Session-State Analyzer: Case Study | Zach Scheffler",
    description:
      "How the session-state analyzer works: one canonical schema across four DAWs, partial observability as a first-class evidence tag, a reached-set compatibility profile, and a role classifier benchmarked against MedleyDB.",
  },
  work: {
    path: "/work",
    title: "Work | Zach Scheffler",
    // Leads with the capability, not the postcode. This read "session
    // recordings for Valencia artists", which is what Google indexed and what
    // a recruiter searching the name saw — a local session résumé rather than
    // audio engineering depth. The Berklee Valencia credit stays on the page
    // itself, where it is a credential rather than an address.
    description:
      "Selected music and video work by Zach Scheffler: the Global Pulse EP, studio and live-session recording, mixing and video production, and releases as Streetcar Scandal.",
  },
  cv: {
    path: "/cv",
    title: "CV | Zach Scheffler",
    description:
      "Curriculum vitae for Zach Scheffler: data science and machine learning across the World Bank, NORC, and Rios Partners, plus audio software and music production.",
  },
  notFound: {
    path: "*",
    title: "Page Not Found | Zach Scheffler",
    description: "The page you are looking for does not exist or has moved.",
  },
} as const satisfies Record<string, AppRouteMeta>;

export type RouteKey = keyof typeof ROUTE_META;
