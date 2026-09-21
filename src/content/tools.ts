import { ROUTE_META } from "@/app/routeMeta";

/**
 * The four music tools, in one place.
 *
 * This list existed four times in four shapes — Navbar's `toolLinks`,
 * ToolSubnav's `TOOL_LINKS`, ToolsIndex's `toolCards` and SystemsPreview's
 * `tools` — so adding or removing a tool meant editing four files and noticing
 * that you had to. Retiring /tools/map was exactly that edit, and the e2e
 * suite caught a fifth copy in a test fixture that nobody had thought of as
 * one.
 *
 * Paths come from ROUTE_META rather than string literals, so a route that
 * moves cannot leave a dead nav link behind; tools.test.ts pins the pairing.
 *
 * Icons deliberately live in toolIcons.ts, not here. Navbar imports this
 * module and Navbar is in the entry chunk, so putting four lucide icons on
 * this object put them in the shell of every route — measured at +0.7 KB gzip
 * on the initial graph, for a nav that draws none of them.
 *
 * Two descriptions on purpose: the tools index has room to explain, and the
 * homepage grid does not. They are different copy for different widths, not
 * duplication — the shared fields above them are what was duplicated.
 */
export interface ToolEntry {
  /** Stable key, also the ROUTE_META key. */
  key: "rhythm" | "harmony" | "circle" | "tonnetz";
  path: string;
  /** One word, for the nav and the subnav. */
  label: string;
  /** Full name, for cards and headings. */
  title: string;
  /** The tools index, where there is room for a sentence. */
  blurb: string;
  /** The homepage grid, where there is not. */
  teaser: string;
}

export const TOOLS: ToolEntry[] = [
  {
    key: "rhythm",
    path: ROUTE_META.rhythm.path,
    label: "Rhythm",
    title: "Rhythm Engine",
    blurb: "Play, browse, and sequence rhythms from around the world.",
    teaser: "Atlas-backed sequencing over the world rhythm map.",
  },
  {
    key: "harmony",
    path: ROUTE_META.harmony.path,
    label: "Harmony",
    title: "Harmony Lab",
    blurb: "Visualize scales, build progressions, and practice in time with the whole system.",
    teaser: "Modes, chord building, notation and practice in one workspace.",
  },
  {
    key: "circle",
    path: ROUTE_META.circle.path,
    label: "Circle",
    title: "Circle of Fifths",
    blurb: "Explore related keys — your key choice follows you into every other tool.",
    teaser: "Key relationships, sharing global key and mode state.",
  },
  {
    key: "tonnetz",
    path: ROUTE_META.tonnetz.path,
    label: "Tonnetz",
    title: "Tonnetz",
    blurb: "Navigate harmonic space with the same key, tempo, and transport as the rest of the app.",
    teaser: "Neo-Riemannian motion over a shared transport and tonal center.",
  },
];

/** The nav and subnav both lead with the index, which is not a tool. */
export const TOOL_NAV_LINKS: Array<{ label: string; to: string; end?: boolean }> = [
  { label: "Overview", to: ROUTE_META.toolsIndex.path, end: true },
  ...TOOLS.map((tool) => ({ label: tool.label, to: tool.path })),
];

/** Rendered in the copy that counts them, so the number cannot drift. */
export const TOOL_COUNT = TOOLS.length;
