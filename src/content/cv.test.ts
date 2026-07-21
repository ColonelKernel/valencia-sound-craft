import { describe, expect, it } from "vitest";

import { CAREER_TIMELINE, CV_PROFILE, EDUCATION, SKILLS } from "./cv";

/**
 * The CV model backs the /cv page and its generated PDF. Two of these tests are
 * publishing safeguards rather than style checks:
 *
 *   - Zach's phone number was deliberately removed from the site; the résumé
 *     PDF it came from must never re-introduce it through this model.
 *   - Older résumés and LinkedIn call the Berklee degree "M.A., Music
 *     Technology". The verified credential is "M.M. Music Production,
 *     Technology & Innovation", and the site must not contradict itself.
 */

/** Everything the CV model would ever render, flattened to one string. */
const serialized = JSON.stringify({ CV_PROFILE, CAREER_TIMELINE, EDUCATION, SKILLS });

describe("CV publishing safeguards", () => {
  it("contains no phone number", () => {
    // Classic NANP shapes: 510.435.6431, 510-435-6431, (510) 435 6431, +1 510 435 6431
    const phonePattern = /(?:\+?\d{1,2}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;
    expect(phonePattern.test(serialized)).toBe(false);
    expect(serialized).not.toContain("510.435.6431");
  });

  it("never states the stale Berklee credential", () => {
    expect(serialized).not.toMatch(/Master of Arts/i);
    expect(serialized).not.toMatch(/\bM\.?A\.?,\s*Music Technology/i);
  });

  it("states the verified Berklee credential exactly once, in full", () => {
    const berklee = EDUCATION.find((entry) => entry.institution.includes("Berklee"));
    expect(berklee).toBeDefined();
    expect(berklee?.credential).toBe("M.M. Music Production, Technology & Innovation");

    const timelineEntry = CAREER_TIMELINE.find((entry) => entry.role.includes("Berklee"));
    expect(timelineEntry?.note).toBe("M.M. Music Production, Technology & Innovation");
  });
});

describe("CAREER_TIMELINE", () => {
  it("is complete and chronologically ordered by start year", () => {
    expect(CAREER_TIMELINE.length).toBeGreaterThan(5);
    const startYears = CAREER_TIMELINE.map((entry) => Number(entry.years.slice(0, 4)));
    for (const year of startYears) {
      expect(Number.isFinite(year)).toBe(true);
    }
    expect([...startYears].sort((a, b) => a - b)).toEqual(startYears);
  });

  it("has a years, role, and note on every entry", () => {
    for (const entry of CAREER_TIMELINE) {
      expect(entry.years.length).toBeGreaterThan(3);
      expect(entry.role.length).toBeGreaterThan(2);
      expect(entry.note.length).toBeGreaterThan(10);
    }
  });
});

describe("EDUCATION", () => {
  it("has complete entries", () => {
    expect(EDUCATION.length).toBeGreaterThan(2);
    for (const entry of EDUCATION) {
      expect(entry.institution.length).toBeGreaterThan(2);
      expect(entry.credential.length).toBeGreaterThan(2);
      expect(entry.location.length).toBeGreaterThan(2);
      expect(entry.years.length).toBeGreaterThan(3);
      expect(entry.detail.length).toBeGreaterThan(10);
    }
  });
});

describe("SKILLS", () => {
  it("has non-empty groups", () => {
    expect(SKILLS.length).toBeGreaterThan(2);
    for (const group of SKILLS) {
      expect(group.label.length).toBeGreaterThan(2);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});

describe("CV_PROFILE", () => {
  it("exposes only https links", () => {
    const urls = [CV_PROFILE.site, CV_PROFILE.research, ...Object.values(CV_PROFILE.profiles)];
    for (const url of urls) {
      expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("routes contact through the site, not a raw phone or address", () => {
    expect(CV_PROFILE.contactPath.startsWith("/")).toBe(true);
    expect(CV_PROFILE.summary.length).toBeGreaterThan(40);
  });
});
