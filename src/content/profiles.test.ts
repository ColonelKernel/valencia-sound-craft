import { describe, expect, it } from "vitest";

import { ARTIST_PROFILES } from "./profiles";

/**
 * These six URLs are read by the JSON-LD sameAs, the navbar icon row, the
 * footer, the contact page and the CV. They were string literals in four of
 * those places before, which is how the navbar and footer ended up publishing
 * a Spotify link with a "?si=" share token that the canonical URL did not
 * carry — the structured data and the visible link disagreed.
 */

describe("ARTIST_PROFILES", () => {
  it("every profile is a well-formed https URL", () => {
    for (const url of Object.values(ARTIST_PROFILES)) {
      expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("carries no share or tracking parameters", () => {
    // Pasting a link out of the Spotify or YouTube UI appends one of these.
    // They identify the sharer, nobody chose to publish them, and they make
    // the same destination look like two different URLs to a crawler.
    for (const [name, url] of Object.entries(ARTIST_PROFILES)) {
      const { searchParams, search } = new URL(url);
      expect(search, `${name} carries a query string`).toBe("");
      for (const param of ["si", "utm_source", "utm_medium", "utm_campaign", "igsh"]) {
        expect(searchParams.has(param), `${name} carries ?${param}=`).toBe(false);
      }
    }
  });

  it("has no duplicate destinations", () => {
    const urls = Object.values(ARTIST_PROFILES);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
