/**
 * Single source of truth for every route's path, document title, and meta
 * description. App.tsx builds the router from this table, and each page
 * feeds its <RouteHead> from its entry here — paths and titles cannot
 * drift between the router and the page heads.
 *
 * Keep this module dependency-free: the Playwright suite imports it
 * directly to assert titles during navigation.
 */

export const SITE_NAME = "Valencia Sound Craft";

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
    title: "Zach Scheffler — Music Producer & Creative Technologist | Valencia Sound Craft",
    description:
      "Zach Scheffler: music producer and creative technologist in Valencia. Audio software and interactive music tools, catalog analytics, and production credits. CV, projects, and contact.",
  },
  toolsIndex: {
    path: "/tools",
    title: "Music Tools | Valencia Sound Craft",
    description:
      "Interactive music tools for rhythm, harmony, and theory: a world rhythm engine, harmony lab, rhythm map, circle of fifths, and Tonnetz — all playing in sync.",
  },
  rhythm: {
    path: "/tools/rhythm",
    title: "Rhythm Engine | Valencia Sound Craft",
    description:
      "Play and sequence rhythms from around the world — a rhythm atlas, browser, and step sequencer that stay in sync.",
  },
  harmony: {
    path: "/tools/harmony",
    title: "Harmony Lab | Valencia Sound Craft",
    description:
      "Visualize modes, build chord progressions, and practice with a metronome and theory references in one connected workspace.",
  },
  map: {
    path: "/tools/map",
    title: "Rhythm Map | Valencia Sound Craft",
    description:
      "Explore a world rhythm atlas by country and tradition, and hear each groove play as you browse.",
  },
  circle: {
    path: "/tools/circle",
    title: "Circle of Fifths | Valencia Sound Craft",
    description:
      "An interactive circle of fifths for exploring key relationships, connected to the full music tool system.",
  },
  tonnetz: {
    path: "/tools/tonnetz",
    title: "Tonnetz | Valencia Sound Craft",
    description:
      "An interactive Tonnetz for exploring harmonic space, playing in the same key and tempo as the rest of the music tools.",
  },
  musicAnalytics: {
    path: "/music-analytics",
    title: "Music Catalog Intelligence | Valencia Sound Craft",
    description:
      "Catalog analytics dashboard for music investment analysis: forecasting, risk scoring, and side-by-side comparison over a demonstration dataset derived from public Spotify popularity data.",
  },
  grooveAtlas: {
    path: "/groove-atlas",
    title: "Groove Atlas | Valencia Sound Craft",
    description:
      "A world atlas of rhythm traditions with cited ethnomusicological sources, paired with an interactive feel-space lab for exploring groove families.",
  },
  projects: {
    path: "/projects",
    title: "Projects | Valencia Sound Craft",
    description:
      "Software by Zach Scheffler: the AutoHarm chord instrument, Ableton Live extensions, in-browser music systems, and music-tech research.",
  },
  // Key order here is load-bearing: build/stampRouteHeadsPlugin.ts zips it
  // against the lazy-import order in src/App.tsx, so this entry and the PAGES
  // entry must sit at the same ordinal position.
  autoharm: {
    path: "/projects/autoharm",
    title: "AutoHarm Case Study | Valencia Sound Craft",
    description:
      "How AutoHarm works: a four-corpus Markov blend and two JazzNet ONNX models running in the browser, playing live MIDI into a DAW — ported from a Max for Live device.",
  },
  work: {
    path: "/work",
    title: "Work | Valencia Sound Craft",
    description:
      "Selected music and video work by Zach Scheffler: the Global Pulse EP, session recordings for Valencia artists, and releases as Streetcar Scandal.",
  },
  cv: {
    path: "/cv",
    title: "CV | Valencia Sound Craft",
    description:
      "Curriculum vitae for Zach Scheffler: music production, creative technology, and a decade of data work across the World Bank, NORC, and Rios Partners.",
  },
  notFound: {
    path: "*",
    title: "Page Not Found | Valencia Sound Craft",
    description: "The page you are looking for does not exist or has moved.",
  },
} as const satisfies Record<string, AppRouteMeta>;

export type RouteKey = keyof typeof ROUTE_META;
