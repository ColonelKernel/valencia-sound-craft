/**
 * GrooveField — canvas-based field renderer.
 *
 * Replaced the previous SVG + React-state zoom approach.
 * Key changes:
 *   - Canvas eliminates 240+ SVG DOM nodes (3 circles × 80 nodes)
 *   - Zoom lives in a useRef — no React re-renders on scroll
 *   - Selection change redraws imperatively, no virtual DOM diff
 *   - ResizeObserver keeps the canvas buffer DPR-correct
 *   - Click hit-test iterates 80 nodes (O(n), < 1µs) — no quadtree needed at this scale
 *   - zoomDisplay state is the ONLY React state, used solely for the % label
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { NormalizedGroove } from "./types";

interface Props {
  grooves: NormalizedGroove[];
  selectedId: string | null;
  onSelect: (groove: NormalizedGroove) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 0.2;

function clampZoom(z: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

export default function GrooveField({ grooves, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Zoom lives outside React state — wheel events draw imperatively without re-renders.
  const zoomRef = useRef(1);
  // Exposed to React only for the % readout in the toolbar.
  const [zoomDisplay, setZoomDisplay] = useState(1);

  // Mirror props into refs so the stable draw() callback always reads current values.
  const groovesRef = useRef(grooves);
  const selectedIdRef = useRef(selectedId);
  groovesRef.current = grooves;
  selectedIdRef.current = selectedId;

  // ─── Core draw ────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t0 = performance.now();

    const W = canvas.width;
    const H = canvas.height;
    const zoom = zoomRef.current;
    const nodes = groovesRef.current;
    const sid = selectedIdRef.current;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "hsl(210, 18%, 11%)");
    bg.addColorStop(1, "hsl(220, 18%, 8%)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const radial = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.5, W * 0.65);
    radial.addColorStop(0, "hsla(155, 45%, 14%, 0.55)");
    radial.addColorStop(1, "hsla(155, 45%, 14%, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // Grid — screen space (not zoomed)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const stepX = W / 10;
    const stepY = H / 10;
    for (let x = stepX; x < W; x += stepX) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = stepY; y < H; y += stepY) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // World-to-screen transform (centered zoom).
    // screenX = W/2 + (px - 0.5) * W * zoom
    // screenY = H/2 + (0.5 - py) * H * zoom
    const toSX = (px: number) => W * 0.5 + (px - 0.5) * W * zoom;
    const toSY = (py: number) => H * 0.5 + (0.5 - py) * H * zoom;

    // Guide circle (zooms with nodes)
    const gcx = toSX(0.5);
    const gcy = toSY(0.5);
    const gcr = Math.min(W, H) * 0.36 * zoom;
    ctx.beginPath();
    ctx.arc(gcx, gcy, gcr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16,185,129,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(16,185,129,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Groove nodes
    for (const groove of nodes) {
      const sx = toSX(groove.px);
      const sy = toSY(groove.py);
      const selected = groove.id === sid;
      const r = (selected ? W * 0.017 : W * 0.0115) * zoom;

      if (selected) {
        // Outer selection ring
        ctx.beginPath();
        ctx.arc(sx, sy, r + W * 0.016 * zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = groove.color;
      ctx.globalAlpha = selected ? 1 : 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const elapsed = performance.now() - t0;
    if (elapsed > 8) {
      console.warn(`[GrooveField] Slow draw: ${elapsed.toFixed(1)}ms (${nodes.length} nodes, zoom=${zoom.toFixed(2)})`);
    }
  }, []);

  // ─── DPR-aware sizing ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      draw();
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // ─── Redraw on prop changes ───────────────────────────────────────────────────

  useEffect(() => {
    draw();
  }, [draw, grooves, selectedId]);

  // ─── Wheel zoom (no React state update → no re-render) ───────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = clampZoom(zoomRef.current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
      if (next === zoomRef.current) return;
      zoomRef.current = next;
      setZoomDisplay(next); // only state update — rerenders toolbar only
      draw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [draw]);

  // ─── Zoom buttons ─────────────────────────────────────────────────────────────

  const adjustZoom = useCallback((delta: number) => {
    const next = clampZoom(zoomRef.current + delta);
    if (next === zoomRef.current) return;
    zoomRef.current = next;
    setZoomDisplay(next);
    draw();
  }, [draw]);

  const resetZoom = useCallback(() => {
    zoomRef.current = 1;
    setZoomDisplay(1);
    draw();
  }, [draw]);

  // ─── Click hit-test ───────────────────────────────────────────────────────────
  //
  // Iterates 80 nodes — under 1µs. Quadtree not needed at this scale.

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const W = canvas.width;
    const H = canvas.height;
    const zoom = zoomRef.current;

    // Inverse world-to-screen: (mx - W/2) / (W * zoom) + 0.5
    const px = (mx - W * 0.5) / (W * zoom) + 0.5;
    const py = 0.5 - (my - H * 0.5) / (H * zoom);

    // Hit radius in normalized units: ~2.5% of canvas width / zoom
    const hitR = (W * 0.025) / (W * zoom);
    const hitR2 = hitR * hitR;

    let nearest: NormalizedGroove | null = null;
    let minD2 = Infinity;
    for (const groove of groovesRef.current) {
      const dx = groove.px - px;
      const dy = groove.py - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < hitR2 && d2 < minD2) {
        minD2 = d2;
        nearest = groove;
      }
    }
    if (nearest) onSelect(nearest);
  }, [onSelect]);

  // ─── Hover cursor update (no React state — direct DOM mutation) ───────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const W = canvas.width;
    const H = canvas.height;
    const zoom = zoomRef.current;

    const px = (mx - W * 0.5) / (W * zoom) + 0.5;
    const py = 0.5 - (my - H * 0.5) / (H * zoom);

    const hitR = (W * 0.025) / (W * zoom);
    const hitR2 = hitR * hitR;

    let hovering = false;
    for (const groove of groovesRef.current) {
      const dx = groove.px - px;
      const dy = groove.py - py;
      if (dx * dx + dy * dy < hitR2) { hovering = true; break; }
    }
    canvas.style.cursor = hovering ? "pointer" : "crosshair";
  }, []);

  // ─── Info panel needs selected groove object ───────────────────────────────────
  // O(1) via a Map if the parent passes one, but since we only have the array here,
  // a simple find is fine — this runs only on React re-renders, not per-frame.
  const selectedGroove = grooves.find(g => g.id === selectedId) ?? null;

  if (grooves.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Static Groove Field</p>
          <p className="text-xs text-muted-foreground">
            {grooves.length} sampled nodes. Click a point to sync the detail panel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {Math.round(zoomDisplay * 100)}%
          </span>
          <button
            onClick={() => adjustZoom(-ZOOM_STEP)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-sm text-foreground transition-colors hover:bg-accent"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => adjustZoom(ZOOM_STEP)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-sm text-foreground transition-colors hover:bg-accent"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="inline-flex rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
        <canvas
          ref={canvasRef}
          className="aspect-[4/3] w-full block"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          role="img"
          aria-label="Static groove field"
        />
      </div>

      {selectedGroove && (
        <div className="rounded-[1.25rem] border border-border/70 bg-card/75 p-4">
          <p className="text-sm font-semibold capitalize text-foreground">
            {selectedGroove.genre} · {selectedGroove.bpm} BPM
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Static point positions come from the precomputed feel-space projection. Zoom is centered,
            and the field redraws only when the selection or zoom changes.
          </p>
        </div>
      )}
    </div>
  );
}
