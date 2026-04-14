/**
 * Precomputed clustering for LOD system.
 * K-means on normalized groove features with cached neighbors.
 */

import type { NormalizedGroove } from "./types";
import { grooveDistance } from "./utils";

export interface Cluster {
  id: string;
  centroid: { px: number; py: number; cx: number; cy: number };
  size: number;
  avgSyncopation: number;
  avgSwing: number;
  avgDensity: number;
  avgBpm: number;
  dominantGenre: string;
  members: string[];           // groove IDs
  representatives: string[];   // top 3-5 IDs for mid-zoom
  color: string;
}

export interface SimilarityCache {
  neighbors: Map<string, string[]>;  // id → top 5 neighbor IDs
}

/** Simple k-means clustering */
export function clusterGrooves(grooves: NormalizedGroove[], k: number): Cluster[] {
  if (grooves.length === 0) return [];
  k = Math.min(k, grooves.length);

  // Initialize centroids with k-means++ style
  const centroids: number[][] = [];
  const indices = new Set<number>();
  indices.add(Math.floor(Math.random() * grooves.length));
  centroids.push(featureVec(grooves[[...indices][0]]));

  while (centroids.length < k) {
    let maxDist = -1;
    let bestIdx = 0;
    for (let i = 0; i < grooves.length; i++) {
      if (indices.has(i)) continue;
      const fv = featureVec(grooves[i]);
      const minD = Math.min(...centroids.map(c => vecDist(fv, c)));
      if (minD > maxDist) { maxDist = minD; bestIdx = i; }
    }
    indices.add(bestIdx);
    centroids.push(featureVec(grooves[bestIdx]));
  }

  // Iterate
  const assignments = new Int32Array(grooves.length);
  for (let iter = 0; iter < 15; iter++) {
    // Assign
    for (let i = 0; i < grooves.length; i++) {
      const fv = featureVec(grooves[i]);
      let minD = Infinity, minC = 0;
      for (let c = 0; c < k; c++) {
        const d = vecDist(fv, centroids[c]);
        if (d < minD) { minD = d; minC = c; }
      }
      assignments[i] = minC;
    }

    // Update centroids
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0, 0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < grooves.length; i++) {
      const c = assignments[i];
      const fv = featureVec(grooves[i]);
      for (let d = 0; d < 5; d++) sums[c][d] += fv[d];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let d = 0; d < 5; d++) centroids[c][d] = sums[c][d] / counts[c];
    }
  }

  // Build clusters
  const clusterMap = new Map<number, NormalizedGroove[]>();
  for (let i = 0; i < grooves.length; i++) {
    const c = assignments[i];
    if (!clusterMap.has(c)) clusterMap.set(c, []);
    clusterMap.get(c)!.push(grooves[i]);
  }

  const clusters: Cluster[] = [];
  for (const [cIdx, members] of clusterMap) {
    if (members.length === 0) continue;

    const avgPx = members.reduce((s, m) => s + m.px, 0) / members.length;
    const avgPy = members.reduce((s, m) => s + m.py, 0) / members.length;
    const avgSync = members.reduce((s, m) => s + m.norm_syncopation, 0) / members.length;
    const avgSw = members.reduce((s, m) => s + m.norm_swing, 0) / members.length;
    const avgDen = members.reduce((s, m) => s + m.norm_density, 0) / members.length;
    const avgBpm = members.reduce((s, m) => s + m.norm_bpm, 0) / members.length;

    // Dominant genre
    const genreCount = new Map<string, number>();
    for (const m of members) genreCount.set(m.genre, (genreCount.get(m.genre) || 0) + 1);
    let domGenre = "", domCount = 0;
    for (const [g, c] of genreCount) {
      if (c > domCount) { domGenre = g; domCount = c; }
    }

    // Representatives: most central members
    const sortedByDist = members
      .map(m => ({ m, d: Math.hypot(m.px - avgPx, m.py - avgPy) }))
      .sort((a, b) => a.d - b.d);
    const reps = sortedByDist.slice(0, Math.min(5, members.length)).map(x => x.m.id);

    const h = 220 - avgSync * 200;
    clusters.push({
      id: `cluster-${cIdx}`,
      centroid: { px: avgPx, py: avgPy, cx: avgPx, cy: avgPy },
      size: members.length,
      avgSyncopation: avgSync,
      avgSwing: avgSw,
      avgDensity: avgDen,
      avgBpm: avgBpm,
      dominantGenre: domGenre,
      members: members.map(m => m.id),
      representatives: reps,
      color: `hsl(${h}, 70%, 55%)`,
    });
  }

  return clusters;
}

/** Precompute top-K neighbors for each groove */
export function buildSimilarityCache(grooves: NormalizedGroove[], k = 5): SimilarityCache {
  const neighbors = new Map<string, string[]>();

  for (const g of grooves) {
    const dists: { id: string; d: number }[] = [];
    for (const other of grooves) {
      if (other.id === g.id) continue;
      dists.push({ id: other.id, d: grooveDistance(g, other) });
    }
    dists.sort((a, b) => a.d - b.d);
    neighbors.set(g.id, dists.slice(0, k).map(x => x.id));
  }

  return { neighbors };
}

function featureVec(g: NormalizedGroove): number[] {
  return [g.norm_bpm, g.norm_density, g.norm_syncopation, g.norm_swing, g.norm_velocity];
}

function vecDist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}
