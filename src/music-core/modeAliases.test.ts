import { describe, expect, it } from "vitest";

import { normalizeMode } from "./modeAliases";

describe("normalizeMode", () => {
  it("maps the scale-style aliases to canonical mode names", () => {
    expect(normalizeMode("major")).toBe("Ionian");
    expect(normalizeMode("minor")).toBe("Aeolian");
  });

  it("matches case-insensitively", () => {
    expect(normalizeMode("MAJOR")).toBe("Ionian");
    expect(normalizeMode("Minor")).toBe("Aeolian");
  });

  it("passes through an already-canonical or unknown mode unchanged", () => {
    expect(normalizeMode("Dorian")).toBe("Dorian");
    expect(normalizeMode("Mixolydian")).toBe("Mixolydian");
  });
});
