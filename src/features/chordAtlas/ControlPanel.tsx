import { memo } from "react";
import { ALL_ROOTS, MODE_CATEGORIES } from "@/components/ModeVisualizer/scaleData";
import type { ChordFilterCategory } from "./chordEngine";

interface ControlPanelProps {
  rootKey: string;
  mode: string;
  filter: ChordFilterCategory;
  onKeyChange: (key: string) => void;
  onModeChange: (mode: string) => void;
  onFilterChange: (filter: ChordFilterCategory) => void;
}

const FILTER_OPTIONS: { value: ChordFilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "triads", label: "Triads" },
  { value: "seventh", label: "7th Chords" },
  { value: "diminished", label: "Diminished" },
  { value: "augmented", label: "Augmented" },
];

const ControlPanel = memo(
  ({ rootKey, mode, filter, onKeyChange, onModeChange, onFilterChange }: ControlPanelProps) => (
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
              <option key={r} value={r}>
                {r}
              </option>
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
                  <option key={m} value={m}>
                    {m}
                  </option>
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Interval Legend
        </h3>
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
  )
);

ControlPanel.displayName = "ControlPanel";

export default ControlPanel;
