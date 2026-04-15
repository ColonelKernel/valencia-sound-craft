import { useCallback, useMemo, useState, type WheelEvent } from "react";
import type { NormalizedGroove } from "./types";

interface Props {
  grooves: NormalizedGroove[];
  selectedId: string | null;
  onSelect: (groove: NormalizedGroove) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 0.2;

function clampZoom(zoom: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

function getTransform(zoom: number) {
  const offset = 50 - 50 * zoom;
  return `translate(${offset} ${offset}) scale(${zoom})`;
}

export default function GrooveField({ grooves, selectedId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);

  const selectedGroove = useMemo(() => (
    grooves.find(groove => groove.id === selectedId) ?? null
  ), [grooves, selectedId]);

  const handleWheel = useCallback((event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom(current => clampZoom(current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    setZoom(current => clampZoom(current + delta));
  }, []);

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
            {Math.round(zoom * 100)}%
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
            onClick={() => setZoom(1)}
            className="inline-flex rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-[radial-gradient(circle_at_top,hsl(155_45%_14%/.55),transparent_55%),linear-gradient(180deg,hsl(210_18%_11%),hsl(220_18%_8%))]">
        <svg
          viewBox="0 0 100 100"
          className="aspect-[4/3] w-full"
          onWheel={handleWheel}
          role="img"
          aria-label="Static groove field"
        >
          <defs>
            <pattern id="groove-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="100" height="100" fill="url(#groove-grid)" />
          <circle cx="50" cy="50" r="36" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.12)" strokeWidth="0.35" />

          <g transform={getTransform(zoom)}>
            {grooves.map(groove => {
              const x = groove.px * 100;
              const y = (1 - groove.py) * 100;
              const selected = groove.id === selectedId;
              const radius = selected ? 1.7 : 1.15;

              return (
                <g
                  key={groove.id}
                  onClick={() => onSelect(groove)}
                  style={{ cursor: "pointer" }}
                >
                  {selected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 1.6}
                      fill="none"
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="0.4"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 0.95}
                    fill="transparent"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={groove.color}
                    opacity={selected ? 1 : 0.8}
                  />
                </g>
              );
            })}
          </g>
        </svg>
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
