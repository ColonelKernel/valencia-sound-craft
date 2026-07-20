import { describe, expect, it } from "vitest";

import type { Cluster } from "./clustering";
import { SpatialIndex } from "./spatialIndex";
import { computeLOD } from "./lodManager";

interface Node {
  id: string;
  px: number;
  py: number;
  cx: number;
  cy: number;
}

function makeNodes(count: number): Node[] {
  const side = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, index) => {
    const x = ((index % side) + 0.5) / side;
    const y = (Math.floor(index / side) + 0.5) / side;
    return { id: `n${index}`, px: x, py: y, cx: x, cy: y };
  });
}

function makeCluster(id: string, px: number, py: number, representatives: string[]): Cluster {
  return {
    id,
    centroid: { px, py, cx: px, cy: py },
    size: representatives.length,
    avgSyncopation: 0.5,
    avgSwing: 0.5,
    avgDensity: 0.5,
    avgBpm: 120,
    dominantGenre: "funk",
    members: representatives,
    representatives,
    color: "hsl(140, 60%, 50%)",
  };
}

function setup(count = 64) {
  const nodes = makeNodes(count);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const spatial = new SpatialIndex<Node>();
  spatial.rebuild(nodes);
  return { nodes, nodeMap, spatial };
}

describe("computeLOD", () => {
  it("level 1 (zoom < 2): clusters only, no individual grooves", () => {
    const { nodes, nodeMap, spatial } = setup();
    const clusters = [
      makeCluster("c1", 0.5, 0.5, ["n0", "n1"]),
      makeCluster("c2", 5, 5, ["n2"]), // far outside the viewport
    ];

    const result = computeLOD({ x: 0.5, y: 0.5, zoom: 1 }, nodes, clusters, spatial, nodeMap);
    expect(result.level).toBe(1);
    expect(result.visibleGrooves).toEqual([]);
    expect(result.visibleClusters.map(c => c.id)).toEqual(["c1"]);
    expect(result.nodeScale).toBe(0.4);
  });

  it("level 2 (2 ≤ zoom < 5): cluster representatives only", () => {
    const { nodes, nodeMap, spatial } = setup();
    const clusters = [makeCluster("c1", 0.5, 0.5, ["n0", "n5", "n9"])];

    const result = computeLOD({ x: 0.5, y: 0.5, zoom: 3 }, nodes, clusters, spatial, nodeMap);
    expect(result.level).toBe(2);
    expect(result.visibleGrooves.map(g => g.id).sort()).toEqual(["n0", "n5", "n9"]);
    expect(result.showLabels).toBe(false);
    expect(result.nodeScale).toBe(0.7);
  });

  it("level 3 (zoom ≥ 5): spatial-index viewport query", () => {
    const { nodes, nodeMap, spatial } = setup(64);
    const camera = { x: 0.5, y: 0.5, zoom: 6 };

    const result = computeLOD(camera, nodes, [], spatial, nodeMap);
    expect(result.level).toBe(3);
    expect(result.showLabels).toBe(true);
    expect(result.nodeScale).toBe(1.0);
    // Every returned node must actually be near the padded viewport.
    const vpHalf = 1 / camera.zoom / 2 + 0.05 / camera.zoom;
    for (const groove of result.visibleGrooves) {
      expect(Math.abs(groove.cx - 0.5)).toBeLessThanOrEqual(vpHalf + 1e-9);
      expect(Math.abs(groove.cy - 0.5)).toBeLessThanOrEqual(vpHalf + 1e-9);
    }
    expect(result.visibleGrooves.length).toBeGreaterThan(0);
  });

  it("caps visible grooves at maxVisibleGrooves keeping the viewport-nearest", () => {
    const { nodes, nodeMap, spatial } = setup(400);

    const result = computeLOD({ x: 0.5, y: 0.5, zoom: 5 }, nodes, [], spatial, nodeMap, 10);
    expect(result.visibleGrooves).toHaveLength(10);

    // The kept nodes must be the 10 nearest to the viewport center among the
    // full spatial query — verify none of the dropped ones is strictly nearer.
    const kept = new Set(result.visibleGrooves.map(g => g.id));
    const maxKeptDistance = Math.max(
      ...result.visibleGrooves.map(g => (g.cx - 0.5) ** 2 + (g.cy - 0.5) ** 2),
    );
    const pad = 0.05 / 5;
    const vp = { x: 0.5 - 0.1 - pad, y: 0.5 - 0.1 - pad, w: 0.2 + 2 * pad, h: 0.2 + 2 * pad };
    const allInViewport = spatial.queryViewport(vp.x, vp.y, vp.w, vp.h);
    for (const groove of allInViewport) {
      if (kept.has(groove.id)) continue;
      const distance = (groove.cx - 0.5) ** 2 + (groove.cy - 0.5) ** 2;
      expect(distance).toBeGreaterThanOrEqual(maxKeptDistance - 1e-12);
    }
  });
});
