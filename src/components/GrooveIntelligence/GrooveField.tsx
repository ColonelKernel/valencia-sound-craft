import { useRef, useEffect, useCallback } from "react";
import type { NormalizedGroove, ViewMode } from "./types";
import { noise2D, kNearest } from "./utils";

interface Props {
  grooves: NormalizedGroove[];
  selected: NormalizedGroove | null;
  hovered: NormalizedGroove | null;
  onHover: (g: NormalizedGroove | null) => void;
  onClick: (g: NormalizedGroove) => void;
  viewMode: ViewMode;
  currentStep?: number;
}

const MARGIN = 40;
const DRIFT_SPEED = 0.0004;
const REPEL_DIST = 0.04;
const REPEL_FORCE = 0.0003;
const MORPH_LERP = 0.06;

export default function GrooveField({ grooves, selected, hovered, onHover, onClick, viewMode, currentStep = -1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const toScreen = useCallback((px: number, py: number) => {
    const { w, h } = sizeRef.current;
    return {
      x: MARGIN + px * (w - 2 * MARGIN),
      y: MARGIN + (1 - py) * (h - 2 * MARGIN),
    };
  }, []);

  const fromScreen = useCallback((sx: number, sy: number) => {
    const { w, h } = sizeRef.current;
    return {
      px: (sx - MARGIN) / (w - 2 * MARGIN),
      py: 1 - (sy - MARGIN) / (h - 2 * MARGIN),
    };
  }, []);

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

  // Mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const handleMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };

      // Hit test
      const { px, py } = fromScreen(mouseRef.current.x, mouseRef.current.y);
      let closest: NormalizedGroove | null = null;
      let minD = Infinity;
      for (const g of grooves) {
        const d = Math.hypot(g.cx - px, g.cy - py);
        if (d < 0.03 && d < minD) { minD = d; closest = g; }
      }
      onHover(closest);
    };

    const handleClick = () => {
      if (hovered) onClick(hovered);
    };

    const handleLeave = () => { mouseRef.current = null; onHover(null); };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, [grooves, hovered, onHover, onClick, fromScreen]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grooves.length === 0) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      timeRef.current += 1;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, "hsl(240, 15%, 8%)");
      bgGrad.addColorStop(1, "hsl(240, 10%, 4%)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = MARGIN + (i / 10) * (w - 2 * MARGIN);
        ctx.beginPath(); ctx.moveTo(x, MARGIN); ctx.lineTo(x, h - MARGIN); ctx.stroke();
        const y = MARGIN + (i / 10) * (h - 2 * MARGIN);
        ctx.beginPath(); ctx.moveTo(MARGIN, y); ctx.lineTo(w - MARGIN, y); ctx.stroke();
      }

      const frozen = viewMode !== "field";

      // Update positions
      for (const g of grooves) {
        if (!frozen) {
          // Drift
          const [dx, dy] = noise2D(g.px * 10, g.py * 10, t * DRIFT_SPEED);
          g.tx = g.px + dx * 0.008;
          g.ty = g.py + dy * 0.008;

          // If selected, anchor it
          if (selected && g.id === selected.id) {
            g.tx = 0.5;
            g.ty = 0.5;
          }
        }

        // Lerp
        g.cx += (g.tx - g.cx) * MORPH_LERP;
        g.cy += (g.ty - g.cy) * MORPH_LERP;
      }

      // Repulsion (only in field mode, sample for perf)
      if (!frozen) {
        for (let i = 0; i < grooves.length; i++) {
          for (let j = i + 1; j < grooves.length; j++) {
            const a = grooves[i], b = grooves[j];
            const ddx = a.cx - b.cx, ddy = a.cy - b.cy;
            const dist = Math.hypot(ddx, ddy);
            if (dist < REPEL_DIST && dist > 0.001) {
              const f = REPEL_FORCE / dist;
              a.tx += ddx * f;
              b.tx -= ddx * f;
              a.ty += ddy * f;
              b.ty -= ddy * f;
            }
          }
        }
      }

      // Topology connections
      if (viewMode === "topology") {
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (const g of grooves) {
          const neighbors = kNearest(grooves, g, 3);
          for (const n of neighbors) {
            const from = toScreen(g.cx, g.cy);
            const to = toScreen(n.cx, n.cy);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        }
      }

      // Landscape contours
      if (viewMode === "landscape") {
        const res = 40;
        const cellW = (w - 2 * MARGIN) / res;
        const cellH = (h - 2 * MARGIN) / res;
        for (let ix = 0; ix < res; ix++) {
          for (let iy = 0; iy < res; iy++) {
            const cpx = (ix + 0.5) / res;
            const cpy = (iy + 0.5) / res;
            let d = 0;
            for (const g of grooves) {
              const dist = Math.hypot(g.cx - cpx, g.cy - cpy);
              d += Math.exp(-dist * dist * 200);
            }
            if (d > 0.3) {
              ctx.fillStyle = `hsla(220, 60%, 50%, ${Math.min(d * 0.08, 0.25)})`;
              ctx.fillRect(MARGIN + ix * cellW, MARGIN + iy * cellH, cellW, cellH);
            }
          }
        }
      }

      // Draw nodes
      for (const g of grooves) {
        const { x, y } = toScreen(g.cx, g.cy);
        const isHov = hovered?.id === g.id;
        const isSel = selected?.id === g.id;
        const r = g.radius * (isHov ? 1.6 : isSel ? 1.4 : 1);

        // Glow
        if (g.glowIntensity > 0.3 || isHov || isSel) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, r * (isSel ? 5 : 3));
          glow.addColorStop(0, g.color.replace("60%)", `${(isSel ? 40 : 25)}%)`));
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, r * (isSel ? 5 : 3), 0, Math.PI * 2);
          ctx.fill();
        }

        // Node
        ctx.fillStyle = g.color;
        ctx.globalAlpha = isSel ? 1 : isHov ? 0.95 : 0.7;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Selection ring pulse
        if (isSel) {
          const pulse = Math.sin(t * 0.05) * 0.3 + 0.7;
          ctx.strokeStyle = g.color.replace("60%)", `${pulse * 60}%)`);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r + 4 + Math.sin(t * 0.03) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Tooltip
      if (hovered && mouseRef.current) {
        const { x, y } = toScreen(hovered.cx, hovered.cy);
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
        ctx.font = `bold ${12}px monospace`;
        ctx.fillText(`${hovered.genre} · ${hovered.bpm} bpm`, tx + 10, ty + 18);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${10}px monospace`;
        ctx.fillText(`swing ${(hovered.norm_swing * 100).toFixed(0)}% · sync ${(hovered.norm_syncopation * 100).toFixed(0)}%`, tx + 10, ty + 34);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [grooves, selected, hovered, viewMode, toScreen]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ display: "block" }}
    />
  );
}
