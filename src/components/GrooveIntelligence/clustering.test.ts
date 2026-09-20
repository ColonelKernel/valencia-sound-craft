import { describe, expect, it } from "vitest";

import { buildSimilarityCache, clusterGrooves } from "./clustering";
import type { NormalizedGroove } from "./types";

/**
 * The feel-space lens on /groove-atlas, and the conspicuous hole in this
 * directory's coverage: camera.ts, spatialIndex.ts and lodManager.ts are all
 * tested, and the clustering they exist to serve was not.
 *
 * Determinism is a *stated* property — the atlas page tells the reader
 * seeding is farthest-point rather than random, "and a clustering that
 * reshuffles on reload is a clustering nobody can reason about". Nothing
 * verified it. These do, along with the partition invariants that make the
 * LOD layers meaningful: every groove lands in exactly one cluster, and
 * representatives are drawn from members.
 */

let seq = 0;

/** A groove at a chosen point in the five-dimensional feature space. */
function groove(
  overrides: Partial<NormalizedGroove> & { px: number; py: number },
): NormalizedGroove {
  const { id = `g${seq++}`, ...rest } = overrides;
  return {
    genre: "rock",
    bpm: 120,
    duration: 4,
    note_density: 1,
    swing_ratio: 0.5,
    syncopation: 0.5,
    velocity_variance: 0.5,
    density: 1,
    norm_bpm: overrides.px,
    norm_density: overrides.py,
    norm_syncopation: 0.5,
    norm_swing: 0.5,
    norm_velocity: 0.5,
    radius: 1,
    color: "#fff",
    glowIntensity: 1,
    similar: [],
    ...rest,
    id,
  };
}

/**
 * A featureless scatter, which is what makes the determinism test worth
 * running. Three tidy blobs converge to the same partition from any seed, so
 * asserting determinism over them passes even with Math.random() in the
 * seeding loop — verified by mutation. On this input the same mutation
 * produces twelve different partitions in twelve runs, so the assertion has
 * something to catch.
 *
 * The generator is a fixed-seed LCG rather than Math.random so the fixture
 * itself is reproducible; a flaky fixture would undermine the very property
 * under test.
 */
function scatter(count: number): NormalizedGroove[] {
  seq = 0;
  let state = 12345;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  return Array.from({ length: count }, (_, i) =>
    groove({
      id: `s${i}`,
      genre: ["jazz", "funk", "latin", "rock"][i % 4],
      px: next(),
      py: next(),
      norm_syncopation: next(),
      norm_swing: next(),
      norm_velocity: next(),
    }),
  );
}

/** Three tight, well-separated blobs — a clustering with an obvious answer. */
function threeBlobs(): NormalizedGroove[] {
  seq = 0;
  const centres = [
    { x: 0.1, y: 0.1, genre: "jazz" },
    { x: 0.9, y: 0.1, genre: "funk" },
    { x: 0.5, y: 0.9, genre: "latin" },
  ];
  return centres.flatMap((c, ci) =>
    Array.from({ length: 6 }, (_, i) =>
      groove({
        id: `blob${ci}-${i}`,
        genre: c.genre,
        px: c.x + (i % 3) * 0.01,
        py: c.y + Math.floor(i / 3) * 0.01,
      }),
    ),
  );
}

describe("clusterGrooves", () => {
  it("returns nothing for no grooves", () => {
    expect(clusterGrooves([], 5)).toEqual([]);
  });

  it("never asks for more clusters than there are grooves", () => {
    const clusters = clusterGrooves([groove({ px: 0.2, py: 0.2 })], 8);
    expect(clusters.length).toBeLessThanOrEqual(1);
  });

  it("is deterministic across runs — the property the atlas page claims", () => {
    const a = clusterGrooves(scatter(40), 5);
    const b = clusterGrooves(scatter(40), 5);
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a));
  });

  it("seeds from the groove nearest the middle of the field", () => {
    // The first centroid is stated to be the most central groove, and every
    // later one is chosen farthest from those already taken. Determinism
    // alone does not cover this: seeding from index 0 instead is perfectly
    // stable run-to-run and still moves the whole layout.
    //
    // The seed is not directly observable, so this characterizes the
    // partition it produces. On this scatter, seeding from index 0 yields
    // 6/16/18 — so the assertion has something to catch. (An earlier version
    // of this test used k = 1, where every groove joins the single cluster
    // whatever the seed, and caught nothing at all.)
    const sizes = clusterGrooves(scatter(40), 3)
      .map((c) => c.size)
      .sort((a, b) => a - b);
    expect(sizes).toEqual([9, 15, 16]);
  });

  it("recovers well-separated blobs", () => {
    const clusters = clusterGrooves(threeBlobs(), 3);
    expect(clusters).toHaveLength(3);
    expect(clusters.map((c) => c.size).sort()).toEqual([6, 6, 6]);
    // Each blob is one genre, so a correct partition has three distinct
    // dominant genres rather than the same one three times.
    expect(new Set(clusters.map((c) => c.dominantGenre)).size).toBe(3);
  });

  it("partitions: every groove appears in exactly one cluster", () => {
    const grooves = scatter(40);
    const members = clusterGrooves(grooves, 4).flatMap((c) => c.members);
    expect(members).toHaveLength(grooves.length);
    expect(new Set(members).size).toBe(grooves.length);
  });

  it("reports a size that matches its member list", () => {
    for (const cluster of clusterGrooves(threeBlobs(), 3)) {
      expect(cluster.size).toBe(cluster.members.length);
    }
  });

  it("draws representatives from members, capped at five", () => {
    // The LOD manager renders these at mid-zoom; a representative that is not
    // a member would draw a point that belongs to another cluster.
    for (const cluster of clusterGrooves(threeBlobs(), 2)) {
      expect(cluster.representatives.length).toBeLessThanOrEqual(5);
      expect(cluster.representatives.length).toBeLessThanOrEqual(cluster.size);
      for (const rep of cluster.representatives) {
        expect(cluster.members).toContain(rep);
      }
    }
  });

  it("places each centroid at the mean of its members", () => {
    const grooves = threeBlobs();
    const byId = new Map(grooves.map((g) => [g.id, g]));
    for (const cluster of clusterGrooves(grooves, 3)) {
      const members = cluster.members.map((id) => byId.get(id)!);
      const meanPx = members.reduce((s, m) => s + m.px, 0) / members.length;
      expect(cluster.centroid.px).toBeCloseTo(meanPx, 10);
      // cx/cy mirror px/py; the renderer reads one pair and the LOD the other.
      expect(cluster.centroid.cx).toBe(cluster.centroid.px);
    }
  });

  it("survives every groove sitting on the same point", () => {
    // Degenerate input: farthest-point seeding has no distinct candidate to
    // pick, so this is where a naive implementation divides by zero or hangs.
    const identical = Array.from({ length: 5 }, (_, i) =>
      groove({ id: `same-${i}`, px: 0.4, py: 0.4 }),
    );
    const clusters = clusterGrooves(identical, 3);
    expect(clusters.flatMap((c) => c.members)).toHaveLength(5);
    for (const c of clusters) {
      expect(Number.isFinite(c.centroid.px)).toBe(true);
      expect(Number.isFinite(c.avgBpm)).toBe(true);
    }
  });
});

describe("buildSimilarityCache", () => {
  it("gives every groove neighbours, and never itself", () => {
    const grooves = threeBlobs();
    const { neighbors } = buildSimilarityCache(grooves, 5);
    expect(neighbors.size).toBe(grooves.length);
    for (const g of grooves) {
      const near = neighbors.get(g.id)!;
      expect(near).toHaveLength(5);
      expect(near).not.toContain(g.id);
      expect(new Set(near).size).toBe(near.length);
    }
  });

  it("caps at k even when k exceeds the population", () => {
    const three = Array.from({ length: 3 }, (_, i) => groove({ id: `t${i}`, px: i / 3, py: 0.5 }));
    const { neighbors } = buildSimilarityCache(three, 10);
    // Two others exist, so two is the most it can honestly return.
    expect(neighbors.get("t0")).toHaveLength(2);
  });
});
