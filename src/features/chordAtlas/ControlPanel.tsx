import { memo } from "react";
import { ALL_ROOTS, MODE_CATEGORIES } from "@/components/ModeVisualizer/scaleData";
import type { ChordFilterCategory } from "./chordEngine";
import { getPositionZones, type PositionSystemType, type ConstraintMode } from "./positionEngine";

interface ControlPanelProps {
  rootKey: string;
  mode: string;
  filter: ChordFilterCategory;
  onKeyChange: (key: string) => void;
  onModeChange: (mode: string) => void;
  onFilterChange: (filter: ChordFilterCategory) => void;
  showFingers: boolean;
  onShowFingersChange: (v: boolean) => void;
  positionSystem: PositionSystemType;
  onPositionSystemChange: (s: PositionSystemType) => void;
  activeZoneId: string | null;
  onActiveZoneChange: (id: string | null) => void;
  stayInPosition: boolean;
  onStayInPositionChange: (v: boolean) => void;
  forceHandMode?: boolean;
}

const FILTER_OPTIONS: { value: ChordFilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "triads", label: "Triads" },
  { value: "seventh", label: "7th Chords" },
  { value: "diminished", label: "Diminished" },
  { value: "augmented", label: "Augmented" },
];

const POSITION_SYSTEMS: { value: PositionSystemType; label: string }[] = [
  { value: "caged", label: "CAGED" },
  { value: "3nps", label: "3-Note/String" },
  { value: "pentatonic", label: "Pentatonic Boxes" },
];

const ControlPanel = memo(({
  rootKey,
  mode,
  filter,
  onKeyChange,
  onModeChange,
  onFilterChange,
  showFingers,
  onShowFingersChange,
  positionSystem,
  onPositionSystemChange,
  activeZoneId,
  onActiveZoneChange,
  stayInPosition,
  onStayInPositionChange,
  forceHandMode = false,
}: ControlPanelProps) => {
  const zones = getPositionZones(positionSystem, rootKey);
  const fingerToggleChecked = forceHandMode ? true : showFingers;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key & Mode</h3>
        <div className="mt-2 space-y-2">
          <select
            value={rootKey}
            onChange={(e) => onKeyChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ALL_ROOTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {MODE_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.modes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chord Filter</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hand Position</h3>

        <label className={`mt-3 flex items-center gap-2 ${forceHandMode ? "cursor-default" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={fingerToggleChecked}
            disabled={forceHandMode}
            onChange={(e) => onShowFingersChange(e.target.checked)}
            className="rounded border-border accent-primary disabled:opacity-60"
          />
          <span className="text-xs text-foreground">Show finger numbers</span>
        </label>
        {forceHandMode && (
          <p className="mt-1 text-[11px] text-muted-foreground">Always on while Hand Mapping Engine is selected.</p>
        )}

        <label className="mt-2 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={stayInPosition}
            onChange={(e) => onStayInPositionChange(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span className="text-xs text-foreground">Stay in position</span>
        </label>

        {fingerToggleChecked && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {POSITION_SYSTEMS.map((ps) => (
                <button
                  key={ps.value}
                  onClick={() => {
                    onPositionSystemChange(ps.value);
                    onActiveZoneChange(null);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    positionSystem === ps.value
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => onActiveZoneChange(null)}
                className={`w-full rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                  activeZoneId === null
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                Full neck (no zone)
              </button>
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => onActiveZoneChange(zone.id)}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                    activeZoneId === zone.id
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {zone.label}
                  <span className="ml-1 text-muted-foreground">(frets {zone.startFret}–{zone.endFret})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fret Span Constraint */}
      <div className="border-t border-border/50 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fret Span Zone</h3>

        <label className="mt-3 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={spanEnabled}
            onChange={(e) => onSpanEnabledChange(e.target.checked)}
            className="rounded border-border accent-primary"
          />
          <span className="text-xs text-foreground">Enable fret span constraint</span>
        </label>

        {spanEnabled && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">Span Width</label>
              <div className="mt-1 flex gap-1.5">
                {([3, 4, 5] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => onFretSpanChange(s)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                      fretSpan === s
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {s} frets
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground">
                Anchor Fret: {anchorFret} → {anchorFret + fretSpan - 1}
              </label>
              <input
                type="range"
                min={0}
                max={17}
                value={anchorFret}
                onChange={(e) => onAnchorFretChange(Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground">Constraint Mode</label>
              <div className="mt-1 flex gap-1.5">
                <button
                  onClick={() => onConstraintModeChange("hard")}
                  className={`flex-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors ${
                    constraintMode === "hard"
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  🔒 Hard
                </button>
                <button
                  onClick={() => onConstraintModeChange("soft")}
                  className={`flex-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors ${
                    constraintMode === "soft"
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-card/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  🔓 Soft
                </button>
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {constraintMode === "hard"
                  ? "Strictly block notes outside zone"
                  : "Prefer notes in zone, allow escape notes"}
              </p>
            </div>

            {/* Finger mapping legend */}
            <div className="rounded-md border border-border/50 bg-secondary/30 px-2.5 py-2 text-[10px] text-muted-foreground">
              <div className="font-medium text-foreground mb-1">Finger Assignment</div>
              <div>Index → fret {anchorFret}</div>
              <div>Middle → fret {anchorFret + 1}</div>
              <div>Ring → fret {anchorFret + 2}</div>
              {fretSpan >= 4 && <div>Pinky → fret {anchorFret + 3}{fretSpan === 5 ? `–${anchorFret + 4}` : ""}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/50 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interval Legend</h3>
        <div className="mt-2 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Root (1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">3rd</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">5th</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-violet-500" />
            <span className="text-muted-foreground">7th</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ControlPanel.displayName = "ControlPanel";

export default ControlPanel;
