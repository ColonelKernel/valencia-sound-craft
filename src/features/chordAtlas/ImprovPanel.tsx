import { memo, useState, useCallback, useMemo } from "react";
import { Music, Sparkles, Zap, BookOpen } from "lucide-react";
import {
  analyzeChordForImprov,
  parseChordString,
  PRESET_PROGRESSIONS,
  STYLE_PROFILES,
  ARTIST_PROFILES,
  type ImprovChord,
  type ImprovStyle,
  type ChordAnalysis,
  type PresetProgression,
} from "./improvEngine";
import type { ChordAtlasEntry } from "./chordEngine";
import ImprovSoloMap from "./ImprovSoloMap";
import ImprovAIPanel from "./ImprovAIPanel";

interface ImprovPanelProps {
  atlasChords: ChordAtlasEntry[];
  rootKey: string;
  mode: string;
  tempo: number;
  onChordHighlight: (notes: string[] | null) => void;
}

const ImprovPanel = memo(({ atlasChords, rootKey, mode, tempo, onChordHighlight }: ImprovPanelProps) => {
  const [inputText, setInputText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<ImprovStyle>("jazz");
  const [complexity, setComplexity] = useState(50);
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);

  // Parse progression from input or use atlas chords
  const progression: ImprovChord[] = useMemo(() => {
    if (inputText.trim()) {
      return parseChordString(inputText);
    }
    // Default: use atlas diatonic chords (first 4 or all)
    return atlasChords.slice(0, 4).map(c => ({
      name: c.name,
      root: c.root,
      quality: c.quality,
      notes: c.notes,
    }));
  }, [inputText, atlasChords]);

  // Analyze each chord
  const analyses: ChordAnalysis[] = useMemo(() => {
    return progression.map((chord, i) => {
      const next = progression[(i + 1) % progression.length];
      return analyzeChordForImprov(chord, next, selectedStyle);
    });
  }, [progression, selectedStyle]);

  const handlePreset = useCallback((preset: PresetProgression) => {
    setInputText(preset.chords);
    setSelectedStyle(preset.style);
  }, []);

  const handleChordHover = useCallback((idx: number | null) => {
    setActiveChordIdx(idx);
    if (idx !== null && analyses[idx]) {
      onChordHighlight(analyses[idx].scales[0]?.notes ?? null);
    } else {
      onChordHighlight(null);
    }
  }, [analyses, onChordHighlight]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Improvisation Engine</h3>
        </div>
        <button
          onClick={() => setShowAI(v => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            showAI
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card/70 text-muted-foreground hover:bg-accent"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          AI Solo
        </button>
      </div>

      {/* Progression Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chord Progression
        </label>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`e.g. Am7 D7 Gmaj7 — or leave empty for ${rootKey} ${mode} diatonic`}
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PROGRESSIONS.slice(0, 4).map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              className="rounded-full border border-border bg-card/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style + Complexity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style</label>
          <select
            value={selectedStyle}
            onChange={e => setSelectedStyle(e.target.value as ImprovStyle)}
            className="mt-1 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STYLE_PROFILES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Complexity: {complexity}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={complexity}
            onChange={e => setComplexity(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Pentatonic</span>
            <span>Modal</span>
            <span>Outside</span>
          </div>
        </div>
      </div>

      {/* Solo Map Timeline */}
      <ImprovSoloMap
        analyses={analyses}
        activeChordIdx={activeChordIdx}
        onChordHover={handleChordHover}
        complexity={complexity}
      />

      {/* AI Solo Generator */}
      {showAI && (
        <ImprovAIPanel
          progression={progression}
          style={selectedStyle}
          complexity={complexity}
          tempo={tempo}
          rootKey={rootKey}
        />
      )}
    </div>
  );
});

ImprovPanel.displayName = "ImprovPanel";

export default ImprovPanel;
