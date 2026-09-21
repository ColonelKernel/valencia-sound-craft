import { Globe2, Hexagon, Music2, Waves, type LucideIcon } from "lucide-react";

import type { ToolEntry } from "./tools";

/**
 * Icons for the tool cards, kept apart from the list itself.
 *
 * src/content/tools.ts is imported by Navbar, which lives in the entry chunk.
 * Hanging the icons off those entries pulled four lucide components into the
 * shell of every route — +0.7 KB gzip on the initial graph, measured — to
 * serve two card grids that are both lazy. Only the grids import this.
 *
 * tools.test.ts asserts every entry has one, so the split cannot silently
 * leave a card iconless.
 */
export const TOOL_ICONS: Record<ToolEntry["key"], LucideIcon> = {
  rhythm: Globe2,
  harmony: Music2,
  circle: Waves,
  tonnetz: Hexagon,
};
