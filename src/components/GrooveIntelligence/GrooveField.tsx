import { useRef, useEffect, useCallback, useState } from "react";
import type { NormalizedGroove, ViewMode, TrajectoryPoint } from "./types";
import type { Cluster } from "./clustering";
import type { LODResult } from "./lodManager";
import { noise2D } from "./utils";
import { SpatialIndex } from "./spatialIndex";
import { Camera, DEFAULT_CAMERA, lerpCamera, zoomAt, worldToScreen, screenToWorld, getViewport, getLODLevel } from "./camera";
import { computeLOD } from "./lodManager";

interface Props {
  grooves: NormalizedGroove[];
  selected: NormalizedGroove | null;
  hovered: NormalizedGroove | null;
  onHover: (g: NormalizedGroove | null) => void;
  onClick: (g: NormalizedGroove) => void;
  viewMode: ViewMode;
  currentStep?: number;
  trajectory?: TrajectoryPoint[];
  clusters: Cluster[];
  grooveMap: Map<string, NormalizedGroove>;
}

const MARGIN = 40;
const DRIFT_SPEED = 0.0004;
const MORPH_LERP = 0.06;

export default function GrooveField({
  grooves, selected, hovered, onHover, onClick, viewMode,
  currentStep = -1, trajectory = [], clusters, grooveMap,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const trajAnimRef = useRef(1);
  const prevTrajLenRef = useRef(0);

  // Camera state
  const cameraRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const targetCameraRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const [cameraState, setCameraState] = useState<Camera>(DEFAULT_CAMERA);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  // Spatial index
  const spatialRef = useRef(new SpatialIndex<NormalizedGroove>());
  const lodRef = useRef<LODResult | null>(null);

  // Rebuild spatial index when grooves update positions (throttled in draw loop)
  const indexDirtyRef = useRef(true);
  useEffect(() => { indexDirtyRef.current = true; }, [grooves]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sizeRef.current = { w: width * dpr, h: height * dpr };
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      const sx = (e.clientX - r.left) * dpr;
      const sy = (e.clientY - r.top) * dpr;
      const { w, h } = sizeRef.current;
      targetCameraRef.current = zoomAt(targetCameraRef.current, e.deltaY, sx, sy, w, h, MARGIN);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // Pan + hover + click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, camX: targetCameraRef.current.x, camY: targetCameraRef.current.y };
        canvas.style.cursor = "grabbing";
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        canvas.style.cursor = "crosshair";
      }
    };

    const handleMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const sx = (e.clientX - r.left) * dpr;
      const sy = (e.clientY - r.top) * dpr;
      mouseRef.current = { x: sx, y: sy };

      if (isPanning.current) {
        const cam = targetCameraRef.current;
        const vp = getViewport(cam);
        const { w, h } = sizeRef.current;
        const dx = (e.clientX - panStart.current.x) * dpr / (w - 2 * MARGIN) * vp.w;
        const dy = (e.clientY - panStart.current.y) * dpr / (h - 2 * MARGIN) * vp.h;
        targetCameraRef.current = { ...cam, x: panStart.current.camX - dx, y: panStart.current.camY + dy };
        return;
      }

      // Hit test using spatial index
      const { w: cw, h: ch } = sizeRef.current;
      const cam = cameraRef.current;
      const { px, py } = screenToWorld(sx, sy, cam, cw, ch, MARGIN);
      const hitRadius = 0.02 / cam.zoom;
      const candidates = spatialRef.current.queryNearest(px, py, hitRadius);

      let closest: NormalizedGroove | null = null;
      let minD = Infinity;
      for (const g of candidates) {
        const d = Math.hypot(g.cx - px, g.cy - py);
        if (d < hitRadius && d < minD) { minD = d; closest = g; }
      }
      onHover(closest);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.shiftKey) return;
      if (hovered) onClick(hovered);
    };

    const handleLeave = () => { mouseRef.current = null; onHover(null); };
    const handleCtxMenu = (e: MouseEvent) => e.preventDefault();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("contextmenu", handleCtxMenu);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("contextmenu", handleCtxMenu);
    };
  }, [grooves, hovered, onHover, onClick]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grooves.length === 0) return;
    let spatialRebuildCounter = 0;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      timeRef.current += 1;
      const t = timeRef.current;

      // Smooth camera
      cameraRef.current = lerpCamera(cameraRef.current, targetCameraRef.current, 0.12);
      const cam = cameraRef.current;
      const lod = getLODLevel(cam.zoom);

      // Rebuild spatial index every ~30 frames or when dirty
      spatialRebuildCounter++;
      if (indexDirtyRef.current || spatialRebuildCounter > 30) {
        spatialRef.current.rebuild(grooves);
        indexDirtyRef.current = false;
        spatialRebuildCounter = 0;
      }

      // Compute LOD
      const lodResult = computeLOD(cam, grooves, clusters, spatialRef.current, grooveMap);
      lodRef.current = lodResult;

      // Clear + background
      ctx.clearRect(0, 0, w, h);
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, "hsl(240, 15%, 8%)");
      bgGrad.addColorStop(1, "hsl(240, 10%, 4%)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid (adapts to zoom)
      const gridCount = lod === 3 ? 20 : 10;
      ctx.strokeStyle = `rgba(255,255,255,${lod === 3 ? 0.02 : 0.012})`;
      ctx.lineWidth = 1;
      const vp = getViewport(cam);
      for (let i = 0; i <= gridCount; i++) {
        const frac = i / gridCount;
        const wpx = vp.x + frac * vp.w;
        const wpy = vp.y + frac * vp.h;
        const sxStart = worldToScreen(wpx, vp.y, cam, w, h, MARGIN);
        const sxEnd = worldToScreen(wpx, vp.y + vp.h, cam, w, h, MARGIN);
        ctx.beginPath(); ctx.moveTo(sxStart.x, sxStart.y); ctx.lineTo(sxEnd.x, sxEnd.y); ctx.stroke();
        const syStart = worldToScreen(vp.x, wpy, cam, w, h, MARGIN);
        const syEnd = worldToScreen(vp.x + vp.w, wpy, cam, w, h, MARGIN);
        ctx.beginPath(); ctx.moveTo(syStart.x, syStart.y); ctx.lineTo(syEnd.x, syEnd.y); ctx.stroke();
      }

      const frozen = viewMode !== "field";

      // Update positions ONLY for visible grooves + nearby buffer
      const updateSet = lod === 1 ? [] : lodResult.visibleGrooves;
      for (const g of updateSet) {
        if (!frozen) {
          const [dx, dy] = noise2D(g.px * 10, g.py * 10, t * DRIFT_SPEED);
          g.tx = g.px + dx * 0.008;
          g.ty = g.py + dy * 0.008;
          if (selected && g.id === selected.id) { g.tx = 0.5; g.ty = 0.5; }
        }
        g.cx += (g.tx - g.cx) * MORPH_LERP;
        g.cy += (g.ty - g.cy) * MORPH_LERP;
      }

      // Landscape contours (only at zoom level 1-2, using clusters)
      if (viewMode === "landscape" && lod <= 2) {
        const res = 30;
        const cellW = (w - 2 * MARGIN) / res;
        const cellH = (h - 2 * MARGIN) / res;
        for (let ix = 0; ix < res; ix++) {
          for (let iy = 0; iy < res; iy++) {
            const frac_x = (ix + 0.5) / res;
            const frac_y = (iy + 0.5) / res;
            const wp = { px: vp.x + frac_x * vp.w, py: vp.y + frac_y * vp.h };
            let d = 0;
            for (const c of clusters) {
              const dist = Math.hypot(c.centroid.px - wp.px, c.centroid.py - wp.py);
              d += c.size * Math.exp(-dist * dist * 100);
            }
            if (d > 1) {
              ctx.fillStyle = `hsla(220, 60%, 50%, ${Math.min(d * 0.01, 0.25)})`;
              ctx.fillRect(MARGIN + ix * cellW, MARGIN + iy * cellH, cellW, cellH);
            }
          }
        }
      }

      // === LEVEL 1: CLUSTER RENDERING ===
      if (lod === 1) {
        for (const c of lodResult.visibleClusters) {
          const { x, y } = worldToScreen(c.centroid.px, c.centroid.py, cam, w, h, MARGIN);
          const r = 8 + Math.sqrt(c.size) * 3;

          // Cluster glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
          glow.addColorStop(0, c.color.replace("55%)", "35%)"));
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, r * 3, 0, Math.PI * 2);
          ctx.fill();

          // Cluster body
          ctx.fillStyle = c.color;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Size label
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${c.size}`, x, y + 4);

          // Genre label below
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.font = "9px monospace";
          ctx.fillText(c.dominantGenre, x, y + r + 14);
          ctx.textAlign = "start";
        }
      }

      // === LEVEL 2–3: NODE RENDERING ===
      if (lod >= 2) {
        // Topology connections at level 3
        if (viewMode === "topology" && lod === 3) {
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          ctx.lineWidth = 1;
          // Only draw for visible grooves
          for (const g of lodResult.visibleGrooves) {
            // Use simple proximity instead of kNearest for perf
            const nearby = spatialRef.current.queryNearest(g.cx, g.cy, 0.08 / cam.zoom);
            for (const n of nearby.slice(0, 3)) {
              if (n.id >= g.id) continue; // avoid double draw
              const from = worldToScreen(g.cx, g.cy, cam, w, h, MARGIN);
              const to = worldToScreen(n.cx, n.cy, cam, w, h, MARGIN);
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
            }
          }
        }

        // Draw nodes
        for (const g of lodResult.visibleGrooves) {
          const { x, y } = worldToScreen(g.cx, g.cy, cam, w, h, MARGIN);
          const isHov = hovered?.id === g.id;
          const isSel = selected?.id === g.id;
          const scale = lodResult.nodeScale;
          const r = g.radius * scale * (isHov ? 1.6 : isSel ? 1.4 : 1);

          // Glow (only level 2+)
          if (lodResult.showGlow && (g.glowIntensity > 0.3 || isHov || isSel)) {
            const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, r * (isSel ? 5 : 3));
            glowGrad.addColorStop(0, g.color.replace("60%)", `${(isSel ? 40 : 25)}%)`));
            glowGrad.addColorStop(1, "transparent");
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, r * (isSel ? 5 : 3), 0, Math.PI * 2);
            ctx.fill();
          }

          // Node circle
          ctx.fillStyle = g.color;
          ctx.globalAlpha = isSel ? 1 : isHov ? 0.95 : lod === 2 ? 0.5 : 0.7;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          // Selection ring
          if (isSel) {
            const beatPulse = currentStep >= 0 && currentStep % 4 === 0 ? 1.0 : 0.6;
            const pulse = currentStep >= 0 ? beatPulse : Math.sin(t * 0.05) * 0.3 + 0.7;
            ctx.strokeStyle = g.color.replace("60%)", `${pulse * 60}%)`);
            ctx.lineWidth = currentStep >= 0 && currentStep % 4 === 0 ? 2.5 : 1.5;
            const ringR = currentStep >= 0 ? r + 4 + (currentStep % 4 === 0 ? 4 : 1) : r + 4 + Math.sin(t * 0.03) * 2;
            ctx.beginPath();
            ctx.arc(x, y, ringR, 0, Math.PI * 2);
            ctx.stroke();

            if (currentStep >= 0 && currentStep % 4 === 0) {
              const flash = ctx.createRadialGradient(x, y, 0, x, y, r * 8);
              flash.addColorStop(0, g.color.replace("60%)", "40%)").replace("hsl", "hsla").replace(")", ", 0.15)"));
              flash.addColorStop(1, "transparent");
              ctx.fillStyle = flash;
              ctx.beginPath();
              ctx.arc(x, y, r * 8, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Labels at level 3
          if (lodResult.showLabels && (isHov || isSel)) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "9px monospace";
            ctx.fillText(`${g.genre} · ${g.bpm}bpm`, x + r + 6, y + 3);
          }
        }

        // Level 2: also show faint cluster outlines
        if (lod === 2) {
          for (const c of lodResult.visibleClusters) {
            const { x, y } = worldToScreen(c.centroid.px, c.centroid.py, cam, w, h, MARGIN);
            const r = 6 + Math.sqrt(c.size) * 2;
            ctx.strokeStyle = c.color.replace("55%)", "30%)");
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, r * 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            // Small genre label
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(c.dominantGenre, x, y + r * 2 + 12);
            ctx.textAlign = "start";
          }
        }
      }

      // Draw trajectory
      if (trajectory.length >= 2) {
        if (trajectory.length !== prevTrajLenRef.current) {
          trajAnimRef.current = 0;
          prevTrajLenRef.current = trajectory.length;
        }
        const trajProgress = trajAnimRef.current;

        for (let i = 1; i < trajectory.length; i++) {
          const fromG = grooveMap.get(trajectory[i - 1].groove.id);
          const toG = grooveMap.get(trajectory[i].groove.id);
          if (!fromG || !toG) continue;

          const from = worldToScreen(fromG.cx, fromG.cy, cam, w, h, MARGIN);
          const to = worldToScreen(toG.cx, toG.cy, cam, w, h, MARGIN);
          const isLatest = i === trajectory.length - 1;
          const segAlpha = isLatest ? Math.min(trajProgress, 1) : 1;
          const fadeAlpha = Math.max(0.15, 1 - (trajectory.length - 1 - i) * 0.12);

          ctx.strokeStyle = `rgba(120, 255, 200, ${0.06 * fadeAlpha * segAlpha})`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          if (isLatest && trajProgress < 1) {
            ctx.lineTo(from.x + (to.x - from.x) * trajProgress, from.y + (to.y - from.y) * trajProgress);
          } else {
            ctx.lineTo(to.x, to.y);
          }
          ctx.stroke();

          ctx.strokeStyle = `rgba(120, 255, 200, ${0.35 * fadeAlpha * segAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          if (isLatest && trajProgress < 1) {
            ctx.lineTo(from.x + (to.x - from.x) * trajProgress, from.y + (to.y - from.y) * trajProgress);
          } else {
            ctx.lineTo(to.x, to.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          if (i < trajectory.length - 1) {
            ctx.fillStyle = `rgba(120, 255, 200, ${0.4 * fadeAlpha})`;
            ctx.beginPath();
            ctx.arc(from.x, from.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          if (!isLatest || trajProgress >= 0.8) {
            const mid = isLatest && trajProgress < 1
              ? { x: from.x + (to.x - from.x) * trajProgress * 0.5, y: from.y + (to.y - from.y) * trajProgress * 0.5 }
              : { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
            ctx.fillStyle = `rgba(120, 255, 200, ${0.25 * fadeAlpha})`;
            ctx.font = "bold 8px monospace";
            ctx.fillText(`${i}`, mid.x + 4, mid.y - 4);
          }
        }

        if (trajProgress < 1) {
          trajAnimRef.current = Math.min(1, trajProgress + 0.025);
        }
      }

      // Tooltip
      if (hovered && mouseRef.current) {
        const { x, y } = worldToScreen(hovered.cx, hovered.cy, cam, w, h, MARGIN);
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        const tw = 160, th = 48;
        const tx = x + 14, ty = y - th - 6;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 12px monospace";
        ctx.fillText(`${hovered.genre} · ${hovered.bpm} bpm`, tx + 10, ty + 18);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px monospace";
        ctx.fillText(`swing ${(hovered.norm_swing * 100).toFixed(0)}% · sync ${(hovered.norm_syncopation * 100).toFixed(0)}%`, tx + 10, ty + 34);
      }

      // Zoom indicator
      const zoomPct = Math.round(cam.zoom * 100);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "10px monospace";
      ctx.textAlign = "end";
      ctx.fillText(`${zoomPct}% · LOD ${lod}`, w - MARGIN, h - 12);
      ctx.textAlign = "start";

      // Expose camera state for UI
      if (Math.abs(cam.zoom - cameraState.zoom) > 0.01) {
        setCameraState({ ...cam });
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [grooves, selected, hovered, viewMode, clusters, grooveMap, cameraState.zoom]);

  // Reset zoom handler
  const resetZoom = useCallback(() => {
    targetCameraRef.current = { ...DEFAULT_CAMERA };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: "block" }}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <button
          onClick={() => { targetCameraRef.current = { ...targetCameraRef.current, zoom: Math.min(12, targetCameraRef.current.zoom * 1.5) }; }}
          className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/60 hover:text-white/90 text-sm font-mono flex items-center justify-center transition-colors"
        >+</button>
        <button
          onClick={() => { targetCameraRef.current = { ...targetCameraRef.current, zoom: Math.max(0.8, targetCameraRef.current.zoom / 1.5) }; }}
          className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/60 hover:text-white/90 text-sm font-mono flex items-center justify-center transition-colors"
        >−</button>
        <button
          onClick={resetZoom}
          className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/40 hover:text-white/80 text-[9px] font-mono flex items-center justify-center transition-colors"
          title="Reset zoom"
        >⌂</button>
      </div>
      {/* Zoom hint */}
      {cameraState.zoom <= 1.05 && (
        <div className="absolute bottom-4 left-4 text-[9px] text-white/15 font-mono pointer-events-none">
          Scroll to zoom · Shift+drag to pan
        </div>
      )}
    </div>
  );
}
