import { describe, expect, it } from "vitest";

import {
  getBarDurationSeconds,
  getStepDurationSeconds,
  getSubdivisionBoundaries,
  getTimeSignatureMetaValue,
  parseMeter,
  sanitizeFileStem,
} from "./rhythmUtils";

describe("parseMeter", () => {
  it("parses a well-formed signature", () => {
    expect(parseMeter("7/8")).toEqual([7, 8]);
    expect(parseMeter("4/4")).toEqual([4, 4]);
  });

  it("falls back to 4/4 on malformed, non-finite, or non-positive input", () => {
    expect(parseMeter("bad")).toEqual([4, 4]);
    expect(parseMeter("4")).toEqual([4, 4]);
    expect(parseMeter("x/y")).toEqual([4, 4]);
    expect(parseMeter("0/4")).toEqual([4, 4]);
    expect(parseMeter("4/0")).toEqual([4, 4]);
  });
});

describe("bar/step duration", () => {
  it("computes a known step duration", () => {
    expect(getBarDurationSeconds(120, [4, 4])).toBeCloseTo(2, 10);
    expect(getStepDurationSeconds(120, [4, 4], 16)).toBeCloseTo(0.125, 10);
  });

  it("clamps non-positive bpm/subdivisions instead of dividing by zero", () => {
    const bar = getStepDurationSeconds(0, [4, 4], 16);
    expect(Number.isFinite(bar)).toBe(true);
    const step = getStepDurationSeconds(120, [4, 4], 0);
    expect(Number.isFinite(step)).toBe(true);
    expect(step).toBeGreaterThan(0);
  });
});

describe("getSubdivisionBoundaries", () => {
  it("builds prefix-sum boundaries from pulse groupings", () => {
    expect([...getSubdivisionBoundaries([3, 3, 2])]).toEqual([0, 3, 6]);
    expect([...getSubdivisionBoundaries([4, 4, 4, 4])]).toEqual([0, 4, 8, 12]);
  });
});

describe("sanitizeFileStem", () => {
  it("lowercases, collapses separators, and strips trailing underscores", () => {
    expect(sanitizeFileStem("Son Clave 3-2!")).toBe("son_clave_3_2");
  });

  it("returns the 'rhythm' fallback for empty or all-separator input", () => {
    expect(sanitizeFileStem("")).toBe("rhythm");
    expect(sanitizeFileStem("!!!")).toBe("rhythm");
  });
});

describe("getTimeSignatureMetaValue", () => {
  it("computes log2 of the denominator", () => {
    expect(getTimeSignatureMetaValue(4)).toBe(2);
    expect(getTimeSignatureMetaValue(8)).toBe(3);
    expect(getTimeSignatureMetaValue(16)).toBe(4);
  });
});
