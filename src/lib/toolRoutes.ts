export type ToolRouteSlug =
  | "overview"
  | "rhythm"
  | "harmony"
  | "map"
  | "circle"
  | "tonnetz"
  | "chord-atlas";

export interface ToolRouteDefinition {
  slug: ToolRouteSlug;
  path: string;
  labelKey: string;
  titleKey: string;
  descriptionKey?: string;
  label: string;
  title: string;
  description?: string;
  segment?: string;
  end?: boolean;
}

export const TOOL_ROUTE_DEFINITIONS: ToolRouteDefinition[] = [
  {
    slug: "overview",
    path: "/tools",
    labelKey: "tools.overview.label",
    titleKey: "tools.overview.title",
    label: "Overview",
    title: "Tools Overview",
    end: true,
  },
  {
    slug: "rhythm",
    path: "/tools/rhythm",
    segment: "rhythm",
    labelKey: "tools.rhythm.label",
    titleKey: "tools.rhythm.title",
    descriptionKey: "tools.rhythm.description",
    label: "Rhythm",
    title: "Rhythm Engine",
    description: "Play, browse, and sequence global rhythm structures from a shared atlas-backed state.",
  },
  {
    slug: "harmony",
    path: "/tools/harmony",
    segment: "harmony",
    labelKey: "tools.harmony.label",
    titleKey: "tools.harmony.title",
    descriptionKey: "tools.harmony.description",
    label: "Harmony",
    title: "Harmony Lab",
    description: "Visualize scales, build progressions, and practice against the shared transport.",
  },
  {
    slug: "map",
    path: "/tools/map",
    segment: "map",
    labelKey: "tools.map.label",
    titleKey: "tools.map.title",
    descriptionKey: "tools.map.description",
    label: "Map",
    title: "Rhythm Map",
    description: "Jump straight into the atlas and keep region, rhythm, and playback aligned.",
  },
  {
    slug: "circle",
    path: "/tools/circle",
    segment: "circle",
    labelKey: "tools.circle.label",
    titleKey: "tools.circle.title",
    descriptionKey: "tools.circle.description",
    label: "Circle",
    title: "Circle of Fifths",
    description: "Explore related keys while updating the shared tonal center.",
  },
  {
    slug: "tonnetz",
    path: "/tools/tonnetz",
    segment: "tonnetz",
    labelKey: "tools.tonnetz.label",
    titleKey: "tools.tonnetz.title",
    descriptionKey: "tools.tonnetz.description",
    label: "Tonnetz",
    title: "Tonnetz",
    description: "Navigate harmonic space with the same key, tempo, and transport as the rest of the app.",
  },
  {
    slug: "chord-atlas",
    path: "/tools/chord-atlas",
    segment: "chord-atlas",
    labelKey: "tools.chordAtlas.label",
    titleKey: "tools.chordAtlas.title",
    descriptionKey: "tools.chordAtlas.description",
    label: "Chord Atlas",
    title: "Chord Atlas",
    description: "Map every chord in any key to the guitar neck with voicings, functions, and interval colors.",
  },
];

export const TOOL_NAV_ROUTES = TOOL_ROUTE_DEFINITIONS;

export const TOOL_CARD_ROUTES = TOOL_ROUTE_DEFINITIONS.filter(
  (route) => route.slug !== "overview",
);

export const TOOL_ROUTE_BY_SLUG = TOOL_ROUTE_DEFINITIONS.reduce<
  Record<ToolRouteSlug, ToolRouteDefinition>
>((accumulator, route) => {
  accumulator[route.slug] = route;
  return accumulator;
}, {} as Record<ToolRouteSlug, ToolRouteDefinition>);
