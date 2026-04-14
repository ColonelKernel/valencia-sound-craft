import { useRef, useEffect, useCallback } from "react";
import type { NormalizedGroove, RenderGroove, ViewMode, TrajectoryPoint } from "./types";
import type { Cluster } from "./clustering";
import { syntheticDistance } from "./utils";
import { SpatialIndex } from "./spatialIndex";
import { Camera, DEFAULT_CAMERA, lerpCamera, zoomAt, worldToScreen, screenToWorld, getViewport } from "./camera";
import { computeLOD } from "./lodManager";
import { subscribePlaybackSteps } from "./audioEngine";

interface Props {
  grooves: NormalizedGroove[];
  selectedId: string | null;
  onSelect: (g: NormalizedGroove) => void;
  viewMode: ViewMode;
  trajectory?: TrajectoryPoint[];
  clusters: Cluster[];
  sculptorActive: boolean;
  sculptorValues: { energy: number; swing: number; syncopation: number; dynamics: number };
}

const MARGIN = 40;
const MORPH_LERP = 0.14;
const DRIFT_AMPLITUDE = 0.0018;
const MAX_VISIBLE_NODES = 280;

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("hsl(")) return color.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
  if (color.startsWith("hsla(")) return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
  return color;
}

export default function GrooveField({
  grooves,
  selectedId,
  onSelect,
  viewMode,
  trajectory = [],
  clusters,
  sculptorActive,
  sculptorValues,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const playbackStepRef = useRef(-1);
  const hoveredIdRef = useRef<string | null>(null);
  const hoveredNodeRef = useRef<RenderGroove | null>(null);

  const cameraRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const targetCameraRef = useRef<Camera>({ ...DEFAULT_CAMERA });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const viewModeRef = useRef(viewMode);
  const trajectoryRef = useRef(trajectory);
  const clustersRef = useRef(clusters);
  const sculptorActiveRef = useRef(sculptorActive);
  const sculptorValuesRef = useRef(sculptorValues);

  const nodesRef = useRef<RenderGroove[]>([]);
  const nodeMapRef = useRef(new Map<string, RenderGroove>());
  const spatialRef = useRef(new SpatialIndex<RenderGroove>());

  const zoomLabelRef = useRef<HTMLDivElement>(null);
  const zoomHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    trajectoryRef.current = trajectory;
  }, [trajectory]);

  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  useEffect(() => {
    sculptorActiveRef.current = sculptorActive;
  }, [sculptorActive]);

  useEffect(() => {
    sculptorValuesRef.current = sculptorValues;
  }, [sculptorValues]);

  const applyTargets = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    if (!sculptorActiveRef.current) {
      for (const node of nodes) {
        node.tx = node.px;
        node.ty = node.py;
      }
      return;
    }

    const target = sculptorValuesRef.current;
    for (const node of nodes) {
      const distance = syntheticDistance(target, node);
      const angle = Math.atan2(node.py - 0.5, node.px - 0.5);
      const radius = 0.08 + distance * 0.12;
      node.tx = 0.5 + Math.cos(angle) * radius;
      node.ty = 0.5 + Math.sin(angle) * radius;
    }
  }, []);

  useEffect(() => {
    const nextNodes = grooves.map((groove, index) => ({
      ...groove,
      cx: groove.px,
      cy: groove.py,
      tx: groove.px,
      ty: groove.py,
      phase: index * 0.37,
    }));

    nodesRef.current = nextNodes;
    nodeMapRef.current = new Map(nextNodes.map(node => [node.id, node]));
    applyTargets();
    spatialRef.current.rebuild(nextNodes);

    if (hoveredIdRef.current) {
      hoveredNodeRef.current = nodeMapRef.current.get(hoveredIdRef.current) ?? null;
      if (!hoveredNodeRef.current) hoveredIdRef.current = null;
    }
  }, [grooves, applyTargets]);

  useEffect(() => {
    applyTargets();
  }, [applyTargets, sculptorActive, sculptorValues]);

  useEffect(() => subscribePlaybackSteps(step => {
    playbackStepRef.current = step;
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sizeRef.current = { w: width * dpr, h: height * dpr };
    });

    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateHover = (nextNode: RenderGroove | null) => {
      hoveredIdRef.current = nextNode?.id ?? null;
      hoveredNodeRef.current = nextNode;
      if (!isPanningRef.current) {
        canvas.style.cursor = nextNode ? "pointer" : "crosshair";
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1 || event.button === 2 || (event.button === 0 && event.shiftKey)) {
        isPanningRef.current = true;
        panStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          camX: targetCameraRef.current.x,
          camY: targetCameraRef.current.y,
        };
        canvas.style.cursor = "grabbing";
        event.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvas.style.cursor = hoveredNodeRef.current ? "pointer" : "crosshair";
    };

    const handleMouseMove = (event: MouseEvent) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const sx = (event.clientX - rect.left) * dpr;
      const sy = (event.clientY - rect.top) * dpr;
      mouseRef.current = { x: sx, y: sy };

      if (isPanningRef.current) {
        const viewport = getViewport(targetCameraRef.current);
        const { w, h } = sizeRef.current;
        const dx = ((event.clientX - panStartRef.current.x) * dpr / Math.max(1, w - 2 * MARGIN)) * viewport.w;
        const dy = ((event.clientY - panStartRef.current.y) * dpr / Math.max(1, h - 2 * MARGIN)) * viewport.h;
        targetCameraRef.current = {
          ...targetCameraRef.current,
          x: panStartRef.current.camX - dx,
          y: panStartRef.current.camY + dy,
        };
        return;
      }

      const { w, h } = sizeRef.current;
      const { px, py } = screenToWorld(sx, sy, cameraRef.current, w, h, MARGIN);
      const hitRadius = 0.018 / cameraRef.current.zoom;
      const candidates = spatialRef.current.queryNearest(px, py, hitRadius);

      let closest: RenderGroove | null = null;
      let minDistance = Infinity;
      for (const candidate of candidates) {
        const dx = candidate.cx - px;
        const dy = candidate.cy - py;
        const distance = dx * dx + dy * dy;
        if (distance < hitRadius * hitRadius && distance < minDistance) {
          minDistance = distance;
          closest = candidate;
        }
      }

      updateHover(closest);
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
      if (!isPanningRef.current) updateHover(null);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.shiftKey) return;
      const hoveredNode = hoveredNodeRef.current;
      if (hoveredNode) onSelectRef.current(hoveredNode);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const sx = (event.clientX - rect.left) * dpr;
      const sy = (event.clientY - rect.top) * dpr;
      const { w, h } = sizeRef.current;
      targetCameraRef.current = zoomAt(targetCameraRef.current, event.deltaY, sx, sy, w, h, MARGIN);
    };

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const drawGrid = (camera: Camera, width: number, height: number) => {
      const viewport = getViewport(camera);
      const gridCount = camera.zoom >= 4 ? 14 : 10;
      ctx.strokeStyle = camera.zoom >= 4 ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)";
      ctx.lineWidth = 1;

      for (let index = 0; index <= gridCount; index++) {
        const fraction = index / gridCount;
        const worldX = viewport.x + fraction * viewport.w;
        const worldY = viewport.y + fraction * viewport.h;
        const verticalStart = worldToScreen(worldX, viewport.y, camera, width, height, MARGIN);
        const verticalEnd = worldToScreen(worldX, viewport.y + viewport.h, camera, width, height, MARGIN);
        ctx.beginPath();
        ctx.moveTo(verticalStart.x, verticalStart.y);
        ctx.lineTo(verticalEnd.x, verticalEnd.y);
        ctx.stroke();

        const horizontalStart = worldToScreen(viewport.x, worldY, camera, width, height, MARGIN);
        const horizontalEnd = worldToScreen(viewport.x + viewport.w, worldY, camera, width, height, MARGIN);
        ctx.beginPath();
        ctx.moveTo(horizontalStart.x, horizontalStart.y);
        ctx.lineTo(horizontalEnd.x, horizontalEnd.y);
        ctx.stroke();
      }
    };

    const drawLandscape = (visibleClusters: Cluster[], camera: Camera, width: number, height: number) => {
      for (const cluster of visibleClusters) {
        const { x, y } = worldToScreen(cluster.centroid.px, cluster.centroid.py, camera, width, height, MARGIN);
        const radius = (10 + Math.sqrt(cluster.size) * 2.2) * camera.zoom * 0.35;
        ctx.fillStyle = withAlpha(cluster.color, 0.08);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = withAlpha(cluster.color, 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawClusters = (visibleClusters: Cluster[], camera: Camera, width: number, height: number, detailed: boolean) => {
      for (const cluster of visibleClusters) {
        const { x, y } = worldToScreen(cluster.centroid.px, cluster.centroid.py, camera, width, height, MARGIN);
        const radius = 7 + Math.sqrt(cluster.size) * (detailed ? 2 : 2.8);

        ctx.fillStyle = withAlpha(cluster.color, detailed ? 0.16 : 0.32);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = withAlpha(cluster.color, detailed ? 0.18 : 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, detailed ? radius * 1.7 : radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = detailed ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.6)";
        ctx.font = detailed ? "8px monospace" : "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(detailed ? cluster.dominantGenre : `${cluster.size}`, x, y + (detailed ? radius * 1.7 + 10 : 3));
        ctx.textAlign = "start";
      }
    };

    const drawTopology = (visibleNodes: RenderGroove[], camera: Camera, width: number, height: number) => {
      const visibleIds = new Set(visibleNodes.map(node => node.id));
      const drawn = new Set<string>();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;

      for (const node of visibleNodes) {
        for (const neighborId of node.similar.slice(0, 2)) {
          if (!visibleIds.has(neighborId)) continue;
          const edgeKey = node.id < neighborId ? `${node.id}-${neighborId}` : `${neighborId}-${node.id}`;
          if (drawn.has(edgeKey)) continue;
          drawn.add(edgeKey);

          const neighbor = nodeMapRef.current.get(neighborId);
          if (!neighbor) continue;

          const from = worldToScreen(node.cx, node.cy, camera, width, height, MARGIN);
          const to = worldToScreen(neighbor.cx, neighbor.cy, camera, width, height, MARGIN);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }
    };

    const drawTrajectory = (camera: Camera, width: number, height: number) => {
      const points = trajectoryRef.current;
      if (points.length < 2) return;

      ctx.strokeStyle = "rgba(120, 255, 200, 0.28)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);

      for (let index = 1; index < points.length; index++) {
        const from = nodeMapRef.current.get(points[index - 1].grooveId);
        const to = nodeMapRef.current.get(points[index].grooveId);
        if (!from || !to) continue;

        const fromPoint = worldToScreen(from.cx, from.cy, camera, width, height, MARGIN);
        const toPoint = worldToScreen(to.cx, to.cy, camera, width, height, MARGIN);
        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(toPoint.x, toPoint.y);
        ctx.stroke();

        ctx.fillStyle = "rgba(120, 255, 200, 0.4)";
        ctx.beginPath();
        ctx.arc(toPoint.x, toPoint.y, index === points.length - 1 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.setLineDash([]);
    };

    const drawTooltip = (node: RenderGroove, camera: Camera, width: number, height: number) => {
      const { x, y } = worldToScreen(node.cx, node.cy, camera, width, height, MARGIN);
      const tooltipWidth = 164;
      const tooltipHeight = 48;
      const tx = Math.min(width - tooltipWidth - 12, x + 14);
      const ty = Math.max(12, y - tooltipHeight - 8);

      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tooltipWidth, tooltipHeight, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${node.genre} · ${node.bpm} bpm`, tx + 10, ty + 18);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.fillText(`swing ${(node.norm_swing * 100).toFixed(0)}% · sync ${(node.norm_syncopation * 100).toFixed(0)}%`, tx + 10, ty + 34);
    };

    const loop = () => {
      const { w, h } = sizeRef.current;
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      cameraRef.current = lerpCamera(cameraRef.current, targetCameraRef.current, 0.14);
      const camera = cameraRef.current;
      const nodes = nodesRef.current;
      const currentView = viewModeRef.current;

      const lodResult = computeLOD(camera, nodes, clustersRef.current, spatialRef.current, nodeMapRef.current, MAX_VISIBLE_NODES);
      const visibleNodes = lodResult.visibleGrooves;
      const now = performance.now() * 0.001;
      const frozen = currentView !== "field";

      for (let index = 0; index < visibleNodes.length; index++) {
        const node = visibleNodes[index];
        const drift = frozen ? 0 : DRIFT_AMPLITUDE / Math.max(1, camera.zoom * 0.6);
        const targetX = node.tx + Math.sin(now * 0.85 + node.phase + index * 0.05) * drift;
        const targetY = node.ty + Math.cos(now * 0.9 + node.phase + index * 0.05) * drift;
        node.cx += (targetX - node.cx) * MORPH_LERP;
        node.cy += (targetY - node.cy) * MORPH_LERP;
      }

      spatialRef.current.rebuild(nodes);

      ctx.clearRect(0, 0, w, h);
      drawGrid(camera, w, h);

      if (currentView === "landscape") {
        drawLandscape(lodResult.visibleClusters, camera, w, h);
      }

      if (lodResult.level === 1) {
        drawClusters(lodResult.visibleClusters, camera, w, h, false);
      } else {
        if (currentView === "topology") {
          drawTopology(visibleNodes, camera, w, h);
        }

        if (lodResult.level === 2) {
          drawClusters(lodResult.visibleClusters, camera, w, h, true);
        }

        const selectedNodeId = selectedIdRef.current;
        const hoveredNodeId = hoveredIdRef.current;
        const currentStep = playbackStepRef.current;

        for (const node of visibleNodes) {
          const { x, y } = worldToScreen(node.cx, node.cy, camera, w, h, MARGIN);
          const isSelected = node.id === selectedNodeId;
          const isHovered = node.id === hoveredNodeId;
          const radius = node.radius * lodResult.nodeScale * (isHovered ? 1.45 : isSelected ? 1.3 : 1);

          ctx.fillStyle = node.color;
          ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.95 : lodResult.level === 2 ? 0.44 : 0.68;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (isSelected || isHovered) {
            const pulse = isSelected
              ? currentStep >= 0
                ? (currentStep % 4 === 0 ? 1.2 : 0.8)
                : (0.9 + Math.sin(now * 4) * 0.08)
              : 0.7;

            ctx.strokeStyle = withAlpha(node.color, isSelected ? 0.78 : 0.45);
            ctx.lineWidth = isSelected ? 2 : 1.5;
            ctx.beginPath();
            ctx.arc(x, y, radius + 4 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.font = "9px monospace";
            ctx.fillText(`${node.genre} · ${node.bpm}bpm`, x + radius + 6, y + 3);
          }
        }
      }

      drawTrajectory(camera, w, h);

      if (hoveredNodeRef.current && mouseRef.current) {
        drawTooltip(hoveredNodeRef.current, camera, w, h);
      }

      if (zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${Math.round(camera.zoom * 100)}% · LOD ${lodResult.level}`;
      }
      if (zoomHintRef.current) {
        zoomHintRef.current.style.opacity = camera.zoom <= 1.05 ? "1" : "0";
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-10">
        <div ref={zoomLabelRef} className="text-[10px] text-white/20 font-mono pointer-events-none">
          100% · LOD 1
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              targetCameraRef.current = {
                ...targetCameraRef.current,
                zoom: Math.min(12, targetCameraRef.current.zoom * 1.5),
              };
            }}
            className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/60 hover:text-white/90 text-sm font-mono flex items-center justify-center transition-colors"
          >
            +
          </button>
          <button
            onClick={() => {
              targetCameraRef.current = {
                ...targetCameraRef.current,
                zoom: Math.max(0.8, targetCameraRef.current.zoom / 1.5),
              };
            }}
            className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/60 hover:text-white/90 text-sm font-mono flex items-center justify-center transition-colors"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="w-7 h-7 bg-black/60 border border-white/10 rounded text-white/40 hover:text-white/80 text-[9px] font-mono flex items-center justify-center transition-colors"
            title="Reset zoom"
          >
            ⌂
          </button>
        </div>
      </div>
      <div
        ref={zoomHintRef}
        className="absolute bottom-4 left-4 text-[9px] text-white/15 font-mono pointer-events-none transition-opacity duration-150"
      >
        Scroll to zoom · Shift+drag to pan
      </div>
    </div>
  );
}
