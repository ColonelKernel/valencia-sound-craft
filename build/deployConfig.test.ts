import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Deploy configuration, pinned across the three files that state it.
 *
 * The Supabase URL and publishable key are written down in three places that
 * nothing connected: DEPLOY.md (what a human sets in the Netlify UI),
 * ci.yml (what the build job compiles with) and supabase-keepalive.yml (what
 * the cron job pings). They disagreed for an unknown stretch — DEPLOY.md
 * carried a key that returns `401 Unregistered API key`, so the document that
 * exists to tell you how to configure the site would have configured it wrong,
 * and the contact form would have compiled down to its fallback panel with no
 * error anywhere.
 *
 * That went unnoticed because no test read these files. Now one does.
 *
 * These are publishable values, not secrets — they ship verbatim in the client
 * bundle and both workflows say so in their own comments. Pinning them here
 * leaks nothing that `curl https://zachscheffler.com` does not already hand
 * over. What it buys is that changing one file and not the others fails the
 * suite.
 *
 * This asserts agreement, not liveness. A key can be internally consistent and
 * still revoked, which is exactly the state this repo was in; run
 * `node scripts/check-supabase-key.mjs` for the network check.
 */

const root = join(__dirname, "..");
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const SOURCES = {
  "DEPLOY.md": read("DEPLOY.md"),
  ".github/workflows/ci.yml": read(".github", "workflows", "ci.yml"),
  ".github/workflows/supabase-keepalive.yml": read(
    ".github",
    "workflows",
    "supabase-keepalive.yml",
  ),
};

/**
 * The live values, as of 2026-09-21.
 *
 * Established by measurement rather than by picking one of the two candidates:
 * crawled out of the deployed asset graph, then confirmed with a read-only
 * REST ping (200 for this key, 401 for the one DEPLOY.md used to carry).
 */
const PROJECT_URL = "https://uqcjivqzilisngdwtdzl.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_hzOztH5IFInSeS1yIJnCNA_8LpEsKTD";

/** The revoked key, kept so it can never quietly reappear. */
const REVOKED_KEY = "sb_publishable_k8udo0mt3Rem4VtHagQpsg_rHG6s1qV";

describe("deploy configuration", () => {
  it("reads all three files", () => {
    for (const [name, body] of Object.entries(SOURCES)) {
      expect(body.length, `${name} is empty`).toBeGreaterThan(200);
    }
  });

  it("names one Supabase project everywhere", () => {
    for (const [name, body] of Object.entries(SOURCES)) {
      const refs = new Set(body.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) ?? []);
      expect([...refs], `${name} names an unexpected project`).toEqual([PROJECT_URL]);
    }
  });

  it("uses one publishable key everywhere", () => {
    for (const [name, body] of Object.entries(SOURCES)) {
      const keys = new Set(body.match(/sb_publishable_[A-Za-z0-9_-]+/g) ?? []);
      // DEPLOY.md also quotes the revoked key in the note explaining the fix,
      // which is the one place it is allowed to appear.
      keys.delete(REVOKED_KEY);
      expect([...keys], `${name} carries the wrong key`).toEqual([PUBLISHABLE_KEY]);
    }
  });

  it("never reinstates the revoked key as live configuration", () => {
    // ci.yml and the keepalive job must not mention it at all; DEPLOY.md may,
    // but only inside the blockquote that documents the correction.
    for (const name of [
      ".github/workflows/ci.yml",
      ".github/workflows/supabase-keepalive.yml",
    ] as const) {
      expect(SOURCES[name]).not.toContain(REVOKED_KEY);
    }
    const deploy = SOURCES["DEPLOY.md"];
    const mentions = deploy.split(REVOKED_KEY).length - 1;
    expect(mentions).toBeLessThanOrEqual(1);
    if (mentions === 1) {
      const line = deploy
        .split("\n")
        .find((candidate) => candidate.includes(REVOKED_KEY));
      expect(line?.trimStart().startsWith(">"), "the revoked key must stay inside the note").toBe(
        true,
      );
    }
  });

  it("still points Netlify at the portfolio branch, not the dossier", () => {
    // Shipping the dossier to zachscheffler.com is the other way this file
    // can be wrong, and it is a worse failure than a bad key.
    expect(SOURCES["DEPLOY.md"]).toContain("portfolio/rebuild");
  });
});
