/**
 * Per-route JSON-LD payloads — the single source for BOTH the hydrated
 * <RouteHead> and the build-time static stamping in
 * build/stampRouteHeadsPlugin.ts.
 *
 * RELATIVE IMPORTS ONLY in this module (and everything it pulls in): it is
 * imported from the Vite build plugin, and the config-loader does not apply
 * the app's `@/` alias. routeMeta.ts, structuredData.ts, content/cv.ts, and
 * content/work.ts are all alias-free by design.
 */

import {
  createPersonStructuredData,
  createToolStructuredData,
  type RouteStructuredData,
} from "../components/seo/structuredData";
import { ROUTE_META, type RouteKey } from "./routeMeta";
import { CV_PROFILE } from "../content/cv";
import { ARTIST_PROFILES } from "../content/work";

export const HOME_JSONLD: RouteStructuredData = createPersonStructuredData({
  name: "Zach Scheffler",
  jobTitle: "Data Scientist & Machine Learning Engineer",
  description:
    "Data scientist and machine learning engineer in the San Francisco Bay Area, building production ML systems and audio software.",
  canonicalPath: ROUTE_META.home.path,
  sameAs: [
    "https://www.linkedin.com/in/zscheff/",
    "https://github.com/ColonelKernel",
    "https://open.spotify.com/artist/3np4vEs0UOE5zFEXmFEc9L",
    "https://soundcloud.com/streetcarscandal",
    "https://www.youtube.com/@ColonelKernel22",
    "https://www.instagram.com/streetcarscandal/",
  ],
});

export const TOOLS_INDEX_JSONLD: RouteStructuredData = createToolStructuredData({
  name: "Music Tools",
  description:
    "A routed collection of interactive music tools for rhythm, harmony, theory, and composition.",
  canonicalPath: ROUTE_META.toolsIndex.path,
  educationalUse: ["music theory", "practice", "composition", "rhythm training"],
});

export const RHYTHM_JSONLD: RouteStructuredData = createToolStructuredData({
  name: "Rhythm Engine",
  description:
    "A rhythm sequencing and exploration workspace for global groove structures, cultural rhythm identity, and real-time playback.",
  canonicalPath: ROUTE_META.rhythm.path,
  educationalUse: ["rhythm training", "world music study", "composition"],
});

export const HARMONY_JSONLD: RouteStructuredData = createToolStructuredData({
  name: "Harmony Lab",
  description:
    "A harmony workspace combining mode visualization, progression building, theory references, and timing tools.",
  canonicalPath: ROUTE_META.harmony.path,
  educationalUse: ["music theory", "practice", "composition"],
});

export const CIRCLE_JSONLD: RouteStructuredData = createToolStructuredData({
  name: "Circle of Fifths",
  description:
    "An interactive circle of fifths that keeps key and mode in step with the harmony and Tonnetz tools.",
  canonicalPath: ROUTE_META.circle.path,
  educationalUse: ["music theory", "key relationships", "harmony practice"],
});

export const TONNETZ_JSONLD: RouteStructuredData = createToolStructuredData({
  name: "Tonnetz",
  description:
    "A Tonnetz harmonic space explorer that plays in the same key and tempo as the rest of the music tools.",
  canonicalPath: ROUTE_META.tonnetz.path,
  educationalUse: ["harmony analysis", "neo-riemannian theory", "composition"],
});

export const MUSIC_ANALYTICS_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Music Catalog Intelligence",
  description: ROUTE_META.musicAnalytics.description,
  applicationCategory: "BusinessApplication",
  url: ROUTE_META.musicAnalytics.path,
};

export const PROJECTS_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Projects by Zach Scheffler",
  description: ROUTE_META.projects.description,
  url: ROUTE_META.projects.path,
};

/**
 * The case study is an article about the software, so it is a TechArticle
 * rather than another SoftwareApplication — the app itself is described on the
 * /projects collection page.
 */
export const AUTOHARM_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "AutoHarm: a generative chord instrument in the browser",
  description: ROUTE_META.autoharm.description,
  url: ROUTE_META.autoharm.path,
  author: {
    "@type": "Person",
    name: "Zach Scheffler",
  },
  about: {
    "@type": "SoftwareApplication",
    name: "AutoHarm",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web browser",
    url: "https://autoharm.zachscheffler.com/",
  },
};

export const CATALOG_INTELLIGENCE_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "Music Catalog Intelligence: analyzing a modeled catalog dataset",
  description: ROUTE_META.catalogIntelligence.description,
  url: ROUTE_META.catalogIntelligence.path,
  author: {
    "@type": "Person",
    name: "Zach Scheffler",
  },
  about: {
    "@type": "SoftwareApplication",
    name: "Music Catalog Intelligence",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    url: ROUTE_META.musicAnalytics.path,
  },
};

export const TRANSIT_ATLAS_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "World Transit Atlas: assembling 201 transit networks from open data",
  description: ROUTE_META.transitAtlas.description,
  url: ROUTE_META.transitAtlas.path,
  author: {
    "@type": "Person",
    name: "Zach Scheffler",
  },
  about: {
    "@type": "SoftwareApplication",
    name: "World Transit Atlas",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Web browser",
    url: "https://colonelkernel.github.io/world-transit-atlas/",
  },
};

export const SESSION_STATE_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "Session-State Analyzer: measuring what four DAWs will tell you",
  description: ROUTE_META.sessionState.description,
  url: ROUTE_META.sessionState.path,
  author: {
    "@type": "Person",
    name: "Zach Scheffler",
  },
  about: {
    "@type": "SoftwareApplication",
    name: "Session-State Analyzer",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Python 3.10+",
    url: "https://github.com/ColonelKernel/session-state-analyzer",
  },
};

export const WORK_JSONLD: RouteStructuredData = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: "Streetcar Scandal",
  description:
    "Zach Scheffler's artist project — indie rock, electronic textures, and raw songwriting, produced since 2013.",
  sameAs: [ARTIST_PROFILES.spotify, ARTIST_PROFILES.soundcloud, ARTIST_PROFILES.youtube],
  url: ROUTE_META.work.path,
};

export const CV_JSONLD: RouteStructuredData = createPersonStructuredData({
  name: CV_PROFILE.name,
  jobTitle: CV_PROFILE.headline,
  description: CV_PROFILE.summary,
  canonicalPath: ROUTE_META.cv.path,
  sameAs: Object.values(CV_PROFILE.profiles),
});

/**
 * Map used by the build plugin to stamp static shells. Routes absent here
 * (notFound) get no structured data.
 */
export const ROUTE_JSONLD: Partial<Record<RouteKey, RouteStructuredData>> = {
  home: HOME_JSONLD,
  toolsIndex: TOOLS_INDEX_JSONLD,
  rhythm: RHYTHM_JSONLD,
  harmony: HARMONY_JSONLD,
  circle: CIRCLE_JSONLD,
  tonnetz: TONNETZ_JSONLD,
  musicAnalytics: MUSIC_ANALYTICS_JSONLD,
  projects: PROJECTS_JSONLD,
  autoharm: AUTOHARM_JSONLD,
  catalogIntelligence: CATALOG_INTELLIGENCE_JSONLD,
  transitAtlas: TRANSIT_ATLAS_JSONLD,
  sessionState: SESSION_STATE_JSONLD,
  work: WORK_JSONLD,
  cv: CV_JSONLD,
};
