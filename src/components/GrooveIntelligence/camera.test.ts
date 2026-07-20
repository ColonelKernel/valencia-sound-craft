import { describe, expect, it } from "vitest";

import {
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  getLODLevel,
  getViewport,
  lerpCamera,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from "./camera";

const W = 800;
const H = 600;
const MARGIN = 40;

describe("getLODLevel", () => {
  it("maps zoom to the documented level boundaries", () => {
    expect(getLODLevel(0.8)).toBe(1);
    expect(getLODLevel(1.99)).toBe(1);
    expect(getLODLevel(2)).toBe(2);
    expect(getLODLevel(4.99)).toBe(2);
    expect(getLODLevel(5)).toBe(3);
    expect(getLODLevel(12)).toBe(3);
  });
});

describe("lerpCamera", () => {
  it("returns the start at t=0 and the target at t=1", () => {
    const from = { x: 0.2, y: 0.3, zoom: 1 };
    const to = { x: 0.8, y: 0.7, zoom: 6 };
    expect(lerpCamera(from, to, 0)).toEqual(from);
    expect(lerpCamera(from, to, 1)).toEqual(to);
  });
});

describe("world/screen transforms", () => {
  it("round-trips screenToWorld ∘ worldToScreen", () => {
    const camera = { x: 0.42, y: 0.61, zoom: 3.5 };
    const world = { px: 0.37, py: 0.55 };
    const screen = worldToScreen(world.px, world.py, camera, W, H, MARGIN);
    const back = screenToWorld(screen.x, screen.y, camera, W, H, MARGIN);
    expect(back.px).toBeCloseTo(world.px, 10);
    expect(back.py).toBeCloseTo(world.py, 10);
  });

  it("centers the camera position on the canvas", () => {
    const camera = { x: 0.5, y: 0.5, zoom: 2 };
    const screen = worldToScreen(0.5, 0.5, camera, W, H, MARGIN);
    expect(screen.x).toBeCloseTo(W / 2, 6);
    expect(screen.y).toBeCloseTo(H / 2, 6);
  });

  it("viewport shrinks with zoom and stays centered", () => {
    const vp = getViewport({ x: 0.5, y: 0.5, zoom: 4 });
    expect(vp.w).toBeCloseTo(0.25, 10);
    expect(vp.h).toBeCloseTo(0.25, 10);
    expect(vp.x).toBeCloseTo(0.375, 10);
    expect(vp.y).toBeCloseTo(0.375, 10);
  });
});

describe("zoomAt", () => {
  it("clamps to MIN_ZOOM and MAX_ZOOM", () => {
    const zoomedOut = zoomAt({ ...DEFAULT_CAMERA, zoom: MIN_ZOOM }, +100, W / 2, H / 2, W, H, MARGIN);
    expect(zoomedOut.zoom).toBe(MIN_ZOOM);

    const zoomedIn = zoomAt({ ...DEFAULT_CAMERA, zoom: MAX_ZOOM }, -100, W / 2, H / 2, W, H, MARGIN);
    expect(zoomedIn.zoom).toBe(MAX_ZOOM);
  });

  it("keeps the world point under the cursor stationary", () => {
    const camera = { x: 0.5, y: 0.5, zoom: 2 };
    const cursor = { sx: 180, sy: 420 };
    const before = screenToWorld(cursor.sx, cursor.sy, camera, W, H, MARGIN);
    const after = zoomAt(camera, -100, cursor.sx, cursor.sy, W, H, MARGIN);
    const worldAfter = screenToWorld(cursor.sx, cursor.sy, after, W, H, MARGIN);
    expect(worldAfter.px).toBeCloseTo(before.px, 10);
    expect(worldAfter.py).toBeCloseTo(before.py, 10);
  });
});
