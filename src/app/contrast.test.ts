import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Colour contrast, enforced by arithmetic rather than by a browser.
 *
 * Nothing else in this repo catches a contrast failure. The unit suite, the
 * Playwright suite, the type checker and the bundle budget all pass on
 * unreadable text, and — verified on the live site on 2026-09-21 — so does
 * Lighthouse: /cv scored accessibility 1.00 while carrying a 4.21:1 label,
 * because axe cannot always resolve an alpha-composited colour against the
 * surface behind it and reports "incomplete" rather than "fail".
 *
 * So the rule is enforced on the source text instead. Every foreground colour
 * on this site is a pure grey from index.css, and every surface it lands on is
 * one of three known greys, which makes the blend exactly computable:
 *
 *   surface            --background 7%   --card 10%   --secondary/--muted 14%
 *   muted-foreground       7.45             6.95            6.19
 *     at /80               5.16             4.91            4.50
 *     at /70               4.22             4.07            3.78   ← fails AA
 *     at /60               3.42             3.34            3.16   ← fails AA
 *     at /50               2.74             2.71            2.61   ← fails AA-large
 *
 * --muted-foreground is 64% lightness, and the minimum that clears 4.5:1 on
 * the darkest-contrast surface (--secondary) is 55%. There is therefore no
 * room for a "dimmer than muted" tier built out of opacity: hierarchy below
 * body text has to come from size, weight or spacing, not from alpha.
 *
 * --foreground is 92%, which stays above 4.5:1 down to /50, so it is not
 * restricted here.
 */

const SRC = join(__dirname, "..");

/** The lowest alpha on --muted-foreground that clears 4.5:1 on every surface. */
const MIN_MUTED_ALPHA = 80;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strips block and line comments before scanning.
 *
 * SystemsPreview.tsx documents the exact bug this file exists to prevent, and
 * a scanner that reads its own postmortem as a violation is a scanner nobody
 * keeps.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const FILES = sourceFiles(SRC).map((path) => ({
  path: path.slice(SRC.length + 1),
  body: code(readFileSync(path, "utf8")),
}));

describe("colour contrast", () => {
  it("scans a source tree that actually exists", () => {
    // A glob that silently matches nothing would make every assertion below
    // pass forever.
    expect(FILES.length).toBeGreaterThan(50);
    expect(FILES.some((f) => f.path.endsWith("Hero.tsx"))).toBe(true);
  });

  it("never dims --muted-foreground below the legibility floor", () => {
    const offenders: string[] = [];
    for (const { path, body } of FILES) {
      for (const match of body.matchAll(/\btext-muted-foreground\/(\d+)\b/g)) {
        const alpha = Number(match[1]);
        if (alpha < MIN_MUTED_ALPHA) {
          offenders.push(`${path}: text-muted-foreground/${alpha}`);
        }
      }
    }
    // Named rather than counted, so a failure says which file to open.
    expect(offenders).toEqual([]);
  });

  it("keeps every muted-foreground alpha that does survive above the floor", () => {
    // /80 clears 4.5:1 on --card (4.91) and lands exactly on it over
    // --secondary (4.50). It is allowed and it has no margin, so this asserts
    // the ceiling stays where the arithmetic put it rather than drifting up.
    const alphas = new Set<number>();
    for (const { body } of FILES) {
      for (const match of body.matchAll(/\btext-muted-foreground\/(\d+)\b/g)) {
        alphas.add(Number(match[1]));
      }
    }
    for (const alpha of alphas) {
      expect(alpha).toBeGreaterThanOrEqual(MIN_MUTED_ALPHA);
    }
  });

  it("documents the arithmetic it enforces", () => {
    // If the tokens move, the table in this file's header is wrong and the
    // floor above is no longer the right number. Pin them.
    const css = readFileSync(join(SRC, "index.css"), "utf8");
    for (const token of [
      "--background: 0 0% 7%",
      "--card: 0 0% 10%",
      "--secondary: 0 0% 14%",
      "--muted-foreground: 0 0% 64%",
      "--foreground: 0 0% 92%",
    ]) {
      expect(css, `${token} moved — recompute the floor in contrast.test.ts`).toContain(token);
    }
  });
});
