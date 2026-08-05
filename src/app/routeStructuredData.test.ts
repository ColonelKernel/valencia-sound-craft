import { describe, expect, it } from "vitest";

import { ROUTE_META } from "./routeMeta";
import { CV_JSONLD, ROUTE_JSONLD, WORK_JSONLD } from "./routeStructuredData";
import { CV_PROFILE } from "../content/cv";
import { ARTIST_PROFILES } from "../content/work";

/**
 * ROUTE_JSONLD feeds both the hydrated <RouteHead> and the build-time static
 * stamping (build/stampRouteHeadsPlugin.ts). These tests pin the map to
 * ROUTE_META and to the verified content modules so neither surface can ship
 * divergent or malformed structured data.
 */

describe("routeStructuredData", () => {
  it("only contains keys that exist in ROUTE_META, and covers every real route", () => {
    const metaKeys = new Set(Object.keys(ROUTE_META));
    for (const key of Object.keys(ROUTE_JSONLD)) {
      expect(metaKeys).toContain(key);
    }

    // Every real (non-404) route ships structured data.
    const expected = Object.keys(ROUTE_META).filter((key) => key !== "notFound");
    expect(Object.keys(ROUTE_JSONLD).sort()).toEqual(expected.sort());
  });

  it("every entry carries the required schema.org fields", () => {
    for (const [key, entry] of Object.entries(ROUTE_JSONLD)) {
      expect(entry["@context"], key).toBe("https://schema.org");
      expect(entry["@type"], key).toBeTruthy();
      expect(entry.name, key).toBeTruthy();
      expect(entry.description, key).toBeTruthy();
    }
  });

  it("the CV entry mirrors the verified CV profile", () => {
    expect(CV_JSONLD["@type"]).toBe("Person");
    expect(CV_JSONLD.name).toBe(CV_PROFILE.name);
    expect(CV_JSONLD.jobTitle).toBe(CV_PROFILE.headline);
    expect(CV_JSONLD.description).toBe(CV_PROFILE.summary);
    expect(CV_JSONLD.sameAs).toEqual(Object.values(CV_PROFILE.profiles));
  });

  it("the work entry mirrors the verified artist profiles", () => {
    expect(WORK_JSONLD["@type"]).toBe("MusicGroup");
    expect(WORK_JSONLD.sameAs).toEqual([
      ARTIST_PROFILES.spotify,
      ARTIST_PROFILES.soundcloud,
      ARTIST_PROFILES.youtube,
    ]);
  });

  it("never leaks a phone number", () => {
    const serialized = JSON.stringify(ROUTE_JSONLD);
    expect(serialized).not.toMatch(/\d{3}[.\-\s]\d{3}[.\-\s]\d{4}/);
  });
});
