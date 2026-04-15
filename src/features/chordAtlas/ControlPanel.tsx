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
  // Fret span constraint
  fretSpan: 3 | 4 | 5;
  onFretSpanChange: (v: 3 | 4 | 5) => void;
  anchorFret: number;
  onAnchorFretChange: (v: number) => void;
  constraintMode: ConstraintMode;
  onConstraintModeChange: (v: ConstraintMode) => void;
  spanEnabled: boolean;
  onSpanEnabledChange: (v: boolean) => void;
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
  fretSpan,
  onFretSpanChange,
  anchorFret,
  onAnchorFretChange,
  constraintMode,
  onConstraintModeChange,
  spanEnabled,
  onSpanEnabledChange,
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
