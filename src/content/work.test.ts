import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARTIST_PROFILES, GLOBAL_PULSE, WORK_EMBEDS } from "./work";

/**
 * The work content model feeds the /work page and the homepage Work section.
 * These tests pin the curate-not-catalog contract: every item is complete,
 * every URL is well-formed https on its expected host, and every playlist
 * track points at an audio file that actually ships in public/audio.
 */

const root = join(__dirname, "..", "..");

const EXPECTED_HOSTS: Record<string, string> = {
  spotify: "open.spotify.com",
  youtube: "www.youtube.com",
  soundcloud: "w.soundcloud.com",
};

describe("WORK_EMBEDS", () => {
  it("has unique ids", () => {
    const ids = WORK_EMBEDS.map((embed) => embed.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every embed is complete — no generic placeholder labels", () => {
    for (const embed of WORK_EMBEDS) {
      expect(embed.title.length).toBeGreaterThan(3);
      // The pre-model labels were bare platform names; those must never return.
      expect(["YouTube", "Spotify", "SoundCloud", "Spotify – Artist", "Spotify – Album"]).not.toContain(
        embed.title,
      );
      expect(embed.role.length).toBeGreaterThan(0);
      expect(embed.year).toMatch(/^\d{4}/);
      expect(embed.description.length).toBeGreaterThan(0);
      expect(embed.height).toBeGreaterThan(0);
    }
  });

  it("every embedUrl is https on the expected host for its kind", () => {
    for (const embed of WORK_EMBEDS) {
      const url = new URL(embed.embedUrl);
      expect(url.protocol).toBe("https:");
      expect(url.host).toBe(EXPECTED_HOSTS[embed.kind]);
    }
  });
});

describe("GLOBAL_PULSE", () => {
  it("is the five-track EP with credits on every track", () => {
    expect(GLOBAL_PULSE.tracks).toHaveLength(5);
    for (const track of GLOBAL_PULSE.tracks) {
      expect(track.title.length).toBeGreaterThan(0);
      expect(track.style.length).toBeGreaterThan(0);
      expect(track.credits).toContain("Zach Scheffler");
    }
  });

  it("every track src exists in public/audio", () => {
    for (const track of GLOBAL_PULSE.tracks) {
      expect(track.src.startsWith("/audio/")).toBe(true);
      expect(existsSync(join(root, "public", track.src)), `${track.src} missing`).toBe(true);
    }
  });
});

describe("ARTIST_PROFILES", () => {
  it("every profile is a well-formed https URL", () => {
    for (const url of Object.values(ARTIST_PROFILES)) {
      expect(new URL(url).protocol).toBe("https:");
    }
  });
});
