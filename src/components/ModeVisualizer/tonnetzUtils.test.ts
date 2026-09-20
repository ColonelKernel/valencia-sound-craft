import { describe, expect, it } from "vitest";

import {
  ALL_NOTES,
  applyTransform,
  makeTriad,
  triadLabel,
  type TonnetzTriadData,
  type TransformType,
} from "./tonnetzUtils";

/**
 * The neo-Riemannian transforms behind /tools/tonnetz.
 *
 * These are worth testing because the answers are not a matter of taste:
 * P, L and R are involutions, each preserves exactly two of the three pitch
 * classes, LP generates the hexatonic cycle and PR the octatonic one. A bug
 * here produces a chord that is merely wrong rather than one that looks
 * wrong, and the tool draws it on a lattice where it will look plausible.
 *
 * Every triad is checked, not a sample: there are only 24.
 */

const ALL_TRIADS: TonnetzTriadData[] = Array.from({ length: 12 }, (_, root) => [
  makeTriad(root, "major"),
  makeTriad(root, "minor"),
]).flat();

const pcs = (t: TonnetzTriadData) => new Set(t.notes);
const same = (a: TonnetzTriadData, b: TonnetzTriadData) =>
  a.root === b.root && a.type === b.type;
const commonTones = (a: TonnetzTriadData, b: TonnetzTriadData) =>
  [...pcs(a)].filter((n) => pcs(b).has(n)).length;

const apply = (t: TonnetzTriadData, word: string) =>
  [...word].reduce((acc, step) => applyTransform(acc, step as TransformType), t);

describe("triad construction", () => {
  it("spells major as root + 4 + 7 and minor as root + 3 + 7", () => {
    expect(makeTriad(0, "major").notes).toEqual([0, 4, 7]);
    expect(makeTriad(0, "minor").notes).toEqual([0, 3, 7]);
    expect(makeTriad(9, "minor").notes).toEqual([9, 0, 4]); // A minor wraps
  });

  it("gives every triad three distinct pitch classes", () => {
    for (const t of ALL_TRIADS) expect(pcs(t).size).toBe(3);
  });

  it("labels minor with an m and major bare", () => {
    expect(triadLabel(makeTriad(0, "major"))).toBe("C");
    expect(triadLabel(makeTriad(9, "minor"))).toBe("Am");
    expect(ALL_NOTES).toHaveLength(12);
  });
});

describe("the textbook cases", () => {
  it.each([
    ["P", 0, "major", "Cm"],
    ["R", 0, "major", "Am"],
    ["L", 0, "major", "Em"],
    ["R", 9, "minor", "C"],
    ["L", 4, "minor", "C"],
    ["N", 0, "major", "Fm"], // Nebenverwandt
    ["S", 0, "major", "C#m"], // Slide
    ["H", 0, "major", "G#m"], // Hexatonic pole
  ] as const)("%s of %s %s is %s", (type, root, quality, expected) => {
    expect(triadLabel(applyTransform(makeTriad(root, quality), type))).toBe(expected);
  });
});

describe("involutions", () => {
  it.each(["P", "L", "R", "N", "S", "H"] as const)(
    "%s applied twice returns every triad to itself",
    (type) => {
      for (const t of ALL_TRIADS) {
        expect(same(applyTransform(applyTransform(t, type), type), t), triadLabel(t)).toBe(
          true,
        );
      }
    },
  );
});

describe("parsimony — the property that makes the lattice meaningful", () => {
  it.each(["P", "L", "R"] as const)("%s holds exactly two common tones", (type) => {
    for (const t of ALL_TRIADS) {
      expect(commonTones(t, applyTransform(t, type)), triadLabel(t)).toBe(2);
    }
  });

  it.each(["P", "L", "R"] as const)("%s always flips the quality", (type) => {
    for (const t of ALL_TRIADS) {
      expect(applyTransform(t, type).type).not.toBe(t.type);
    }
  });

  it("the hexatonic pole shares no tone at all", () => {
    // H is the maximally distant move on the lattice; if it shared a tone,
    // it would not be the pole.
    for (const t of ALL_TRIADS) {
      expect(commonTones(t, applyTransform(t, "H")), triadLabel(t)).toBe(0);
    }
  });

  it("Slide keeps the third and moves the other two", () => {
    for (const t of ALL_TRIADS) {
      expect(commonTones(t, applyTransform(t, "S")), triadLabel(t)).toBe(1);
    }
  });
});

describe("generated cycles", () => {
  it("LP closes the hexatonic cycle after six moves, and not before", () => {
    // C+ → e- → E+ → g#- → G#+ → c- → C+
    for (const t of ALL_TRIADS) {
      expect(same(apply(t, "LPLPLP"), t), `${triadLabel(t)} after LP³`).toBe(true);
      expect(same(apply(t, "LPLP"), t), `${triadLabel(t)} after LP²`).toBe(false);
    }
  });

  it("the hexatonic cycle visits six distinct triads", () => {
    const seen = new Set<string>();
    let current = makeTriad(0, "major");
    for (let i = 0; i < 6; i++) {
      seen.add(triadLabel(current));
      current = applyTransform(current, i % 2 === 0 ? "L" : "P");
    }
    expect(seen.size).toBe(6);
    expect([...seen]).toEqual(["C", "Em", "E", "G#m", "G#", "Cm"]);
  });

  it("RP closes the octatonic cycle after eight moves", () => {
    for (const t of ALL_TRIADS) {
      expect(same(apply(t, "RPRPRPRP"), t), triadLabel(t)).toBe(true);
    }
  });

  it("LR reaches all twenty-four triads before returning", () => {
    const seen = new Set<string>();
    let current = makeTriad(0, "major");
    for (let i = 0; i < 24; i++) {
      seen.add(triadLabel(current));
      current = applyTransform(current, i % 2 === 0 ? "R" : "L");
    }
    expect(seen.size).toBe(24);
    expect(same(current, makeTriad(0, "major"))).toBe(true);
  });
});

describe("the compounds are the compositions they claim to be", () => {
  it.each([
    ["N", "PLR"], // applied left to right: P first, then L, then R
    ["S", "RPL"],
    ["H", "LPL"],
  ] as const)("%s equals %s", (compound, word) => {
    for (const t of ALL_TRIADS) {
      expect(same(applyTransform(t, compound), apply(t, word)), triadLabel(t)).toBe(true);
    }
  });
});
