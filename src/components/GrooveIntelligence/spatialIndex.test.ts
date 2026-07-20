import { describe, expect, it } from "vitest";

import { SpatialIndex } from "./spatialIndex";

interface Point {
  id: string;
  cx: number;
  cy: number;
}

function grid(count: number): Point[] {
  // Deterministic points spread across [0,1]²
  const side = Math.ceil(Math.sqrt(count));
  const points: Point[] = [];
  for (let index = 0; index < count; index++) {
    const col = index % side;
    const row = Math.floor(index / side);
    points.push({ id: `p${index}`, cx: (col + 0.5) / side, cy: (row + 0.5) / side });
  }
  return points;
}

describe("SpatialIndex", () => {
  it("queryViewport returns exactly the points inside the rect", () => {
    const points = grid(100);
    const index = new SpatialIndex<Point>();
    index.rebuild(points);

    const rect = { x: 0.2, y: 0.2, w: 0.4, h: 0.4 };
    const expected = points
      .filter(p => p.cx >= rect.x && p.cx < rect.x + rect.w && p.cy >= rect.y && p.cy < rect.y + rect.h)
      .map(p => p.id)
      .sort();
    const actual = index.queryViewport(rect.x, rect.y, rect.w, rect.h).map(p => p.id).sort();
    expect(actual).toEqual(expected);
  });

  it("queryNearest respects the circular bound, not the bounding square", () => {
    const index = new SpatialIndex<Point>();
    const center = { id: "center", cx: 0.5, cy: 0.5 };
    // Corner point: inside the bounding square of radius r, outside the circle.
    const corner = { id: "corner", cx: 0.5 + 0.09, cy: 0.5 + 0.09 }; // dist ≈ 0.127
    const near = { id: "near", cx: 0.5 + 0.05, cy: 0.5 }; // dist = 0.05
    index.rebuild([center, corner, near]);

    const ids = index.queryNearest(0.5, 0.5, 0.1).map(p => p.id).sort();
    expect(ids).toEqual(["center", "near"]);
  });

  it("keeps all co-located points retrievable after subdivision", () => {
    // More than MAX_ITEMS (16) identical positions force max-depth subdivision.
    const stacked: Point[] = Array.from({ length: 40 }, (_, index) => ({
      id: `s${index}`,
      cx: 0.333,
      cy: 0.667,
    }));
    const index = new SpatialIndex<Point>();
    index.rebuild(stacked);

    expect(index.queryNearest(0.333, 0.667, 0.01)).toHaveLength(40);
    expect(index.queryViewport(0.3, 0.6, 0.1, 0.1)).toHaveLength(40);
  });

  it("silently drops points outside the root bounds [-0.1, 1.1]", () => {
    const index = new SpatialIndex<Point>();
    index.rebuild([
      { id: "inside", cx: 0.5, cy: 0.5 },
      { id: "outside", cx: 1.5, cy: 0.5 },
    ]);

    const all = index.queryViewport(-1, -1, 4, 4).map(p => p.id);
    expect(all).toEqual(["inside"]);
  });
});
