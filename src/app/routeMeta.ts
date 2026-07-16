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
    title: "Valencia Sound Craft",
    description:
      "Music systems design, creative technology, and direct-linkable rhythm and harmony tools.",
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
    title: "Music Catalog Intelligence – Valencia Sound Craft",
    description:
      "Catalog analytics dashboard for music investment analysis. Demonstration dataset derived from public Spotify popularity data, with forecasting and AI-assisted analysis.",
  },
  grooveIntelligence: {
    path: "/groove-intelligence",
    title: "Groove Intelligence | Valencia Sound Craft",
    description:
      "An interactive lab for exploring groove families and rhythmic feel with real-time playback.",
  },
  notFound: {
    path: "*",
    title: "Page Not Found | Valencia Sound Craft",
    description: "The page you are looking for does not exist or has moved.",
  },
} as const satisfies Record<string, AppRouteMeta>;

export type RouteKey = keyof typeof ROUTE_META;
