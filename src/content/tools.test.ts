import { describe, expect, it } from "vitest";

import { TOOLS, TOOL_NAV_LINKS, TOOL_COUNT } from "./tools";
import { TOOL_ICONS } from "./toolIcons";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * This list is the thing four files used to disagree about. These assertions
 * are the reason it can now be edited in one place: they fail if an entry
 * points at a route that does not exist, if a route that is obviously a tool
 * is missing from it, or if the nav loses its way back to the index.
 */

describe("TOOLS", () => {
  it("names only real routes, and names them from ROUTE_META", () => {
    for (const tool of TOOLS) {
      expect(ROUTE_META[tool.key], `no ROUTE_META entry for ${tool.key}`).toBeDefined();
      expect(tool.path).toBe(ROUTE_META[tool.key].path);
    }
  });

  it("covers every /tools/* route in the route table", () => {
    // The failure this catches: adding a tool route and forgetting the nav,
    // which is how /tools/map ended up listed in some places and not others.
    const toolRoutes = Object.values(ROUTE_META)
      .map((route) => route.path)
      .filter((path) => path.startsWith("/tools/"));

    expect([...TOOLS.map((t) => t.path)].sort()).toEqual([...toolRoutes].sort());
  });

  it("gives every tool both lengths of copy, and keeps them different", () => {
    for (const tool of TOOLS) {
      expect(tool.blurb.length).toBeGreaterThan(20);
      expect(tool.teaser.length).toBeGreaterThan(20);
      // If these ever match, one of the two call sites has lost its voice.
      expect(tool.teaser).not.toBe(tool.blurb);
    }
  });

  it("has an icon for every tool, though the icons live elsewhere", () => {
    // The icons were split out because Navbar imports this list and Navbar is
    // in the entry chunk. The split is only safe if nothing falls through it.
    for (const tool of TOOLS) {
      expect(TOOL_ICONS[tool.key], `no icon for ${tool.key}`).toBeTruthy();
    }
    expect(Object.keys(TOOL_ICONS).sort()).toEqual(TOOLS.map((t) => t.key).sort());
  });

  it("leads the nav with the index and then every tool in order", () => {
    expect(TOOL_NAV_LINKS[0]).toEqual({
      label: "Overview",
      to: ROUTE_META.toolsIndex.path,
      end: true,
    });
    expect(TOOL_NAV_LINKS.slice(1).map((l) => l.to)).toEqual(TOOLS.map((t) => t.path));
    expect(TOOL_COUNT).toBe(TOOLS.length);
  });
});
