/**
 * Camera system for zoom + pan with smooth transitions.
 * Operates in normalized [0,1] space.
 */

export interface Camera {
  x: number;      // center x in [0,1] space
  y: number;      // center y
  zoom: number;   // 1 = full view, higher = zoomed in
}

export const DEFAULT_CAMERA: Camera = { x: 0.5, y: 0.5, zoom: 1 };

export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 12;

export function lerpCamera(from: Camera, to: Camera, t: number): Camera {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t,
  };
}

/** Get the viewport rect in [0,1] space for the current camera */
export function getViewport(cam: Camera): { x: number; y: number; w: number; h: number } {
  const w = 1 / cam.zoom;
  const h = 1 / cam.zoom;
  return { x: cam.x - w / 2, y: cam.y - h / 2, w, h };
}

/** LOD level based on zoom */
export function getLODLevel(zoom: number): 1 | 2 | 3 {
  if (zoom < 2) return 1;
  if (zoom < 5) return 2;
  return 3;
}

/** Transform from normalized [0,1] to screen coordinates */
export function worldToScreen(
  px: number, py: number,
  cam: Camera,
  canvasW: number, canvasH: number,
  margin: number
): { x: number; y: number } {
  const vp = getViewport(cam);
  const nx = (px - vp.x) / vp.w;
  const ny = (py - vp.y) / vp.h;
  return {
    x: margin + nx * (canvasW - 2 * margin),
    y: margin + (1 - ny) * (canvasH - 2 * margin),
  };
}

/** Transform from screen to normalized [0,1] coordinates */
export function screenToWorld(
  sx: number, sy: number,
  cam: Camera,
  canvasW: number, canvasH: number,
  margin: number
): { px: number; py: number } {
  const vp = getViewport(cam);
  const nx = (sx - margin) / (canvasW - 2 * margin);
  const ny = 1 - (sy - margin) / (canvasH - 2 * margin);
  return {
    px: vp.x + nx * vp.w,
    py: vp.y + ny * vp.h,
  };
}

/** Apply zoom at a specific screen point */
export function zoomAt(
  cam: Camera,
  delta: number,
  sx: number, sy: number,
  canvasW: number, canvasH: number,
  margin: number
): Camera {
  const { px, py } = screenToWorld(sx, sy, cam, canvasW, canvasH, margin);
  const factor = delta > 0 ? 0.85 : 1.18;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom * factor));
  // Keep the point under cursor stationary
  const ratio = cam.zoom / newZoom;
  return {
    x: px + (cam.x - px) * ratio,
    y: py + (cam.y - py) * ratio,
    zoom: newZoom,
  };
}
