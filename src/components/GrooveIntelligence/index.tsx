import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { NormalizedGroove, RawGroove, ViewMode } from "./types";
import { normalizeGrooves, grooveDistance, syntheticDistance } from "./utils";
import { playGrooveSequence } from "./audioEngine";
import GrooveField from "./GrooveField";
import GrooveDNA from "./GrooveDNA";
import GrooveSculptor from "./GrooveSculptor";

const MAX_NODES = 300;

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "field", label: "Field" },
  { key: "topology", label: "Topology" },
  { key: "landscape", label: "Landscape" },
];

export default function GrooveIntelligenceLab() {
  const [rawData, setRawData] = useState<RawGroove[]>([]);
  const [grooves, setGrooves] = useState<NormalizedGroove[]>([]);
  const [selected, setSelected] = useState<NormalizedGroove | null>(null);
  const [hovered, setHovered] = useState<NormalizedGroove | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("field");
  const [sculptorActive, setSculptorActive] = useState(false);
  const [sculptorValues, setSculptorValues] = useState({ energy: 0.5, swing: 0.5, syncopation: 0.5, dynamics: 0.5 });

  const sculptorRef = useRef(sculptorValues);
  sculptorRef.current = sculptorValues;

  // Load data
  useEffect(() => {
    fetch("/data/egmd.json")
      .then(r => r.json())
      .then((data: RawGroove[]) => {
        const sampled = data.length > MAX_NODES
          ? data.sort(() => Math.random() - 0.5).slice(0, MAX_NODES)
          : data;
        setRawData(sampled);
        setGrooves(normalizeGrooves(sampled));
      })
      .catch(err => console.error("Failed to load groove data:", err));
  }, []);

  // Recompute field on selection (similarity warp)
  const handleSelect = useCallback((g: NormalizedGroove) => {
    setSelected(g);
    playGrooveSequence(g.norm_density, g.norm_swing, g.norm_velocity);

    // Warp field: reposition based on distance from selected
    setGrooves(prev => prev.map(node => {
      if (node.id === g.id) {
        return { ...node, tx: 0.5, ty: 0.5 };
      }
      const d = grooveDistance(g, node);
      // Place similar grooves close, distant ones far
      const angle = Math.atan2(node.py - g.py, node.px - g.px);
      const r = 0.08 + d * 0.35;
      return {
        ...node,
        tx: 0.5 + Math.cos(angle) * r,
        ty: 0.5 + Math.sin(angle) * r,
      };
    }));
  }, []);

  // Sculptor morph
  useEffect(() => {
    if (!sculptorActive || grooves.length === 0) return;
    const id = setTimeout(() => {
      const target = sculptorRef.current;
      setGrooves(prev => prev.map(node => {
        const d = syntheticDistance(target, node);
        // Closer to synthetic target → closer to center
        const angle = Math.atan2(node.py - 0.5, node.px - 0.5);
        const r = 0.05 + d * 0.4;
        return {
          ...node,
          tx: 0.5 + Math.cos(angle) * r,
          ty: 0.5 + Math.sin(angle) * r,
        };
      }));
      setSelected(null);
    }, 100);
    return () => clearTimeout(id);
  }, [sculptorActive, sculptorValues, grooves.length]);

  const handleHover = useCallback((g: NormalizedGroove | null) => setHovered(g), []);

  return (
    <div className="fixed inset-0 flex flex-col bg-[hsl(240,10%,4%)] text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-mono">← Back</a>
          <div>
            <h1 className="text-sm font-semibold tracking-wide font-mono">🧠 Groove Intelligence Lab</h1>
            <p className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">FIELD INTERFACE · PERCEPTUAL RHYTHM SPACE</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {VIEW_MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setViewMode(m.key)}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
                viewMode === m.key
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground/30 font-mono">
          {grooves.length} nodes · {new Set(grooves.map(g => g.genre)).size} genres
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas Field */}
        <div className="flex-1 relative">
          <GrooveField
            grooves={grooves}
            selected={selected}
            hovered={hovered}
            onHover={handleHover}
            onClick={handleSelect}
            viewMode={viewMode}
          />
          {/* Meta text */}
          <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
            <p className="text-[10px] text-white/15 font-mono tracking-wider">
              Each point represents a human performance embedded in perceptual rhythm space.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-72 border-l border-white/5 p-4 overflow-y-auto shrink-0 flex flex-col gap-6">
          <GrooveSculptor
            values={sculptorValues}
            onChange={setSculptorValues}
            active={sculptorActive}
            onToggle={() => setSculptorActive(a => !a)}
          />
          <div className="h-px bg-white/5" />
          <GrooveDNA
            groove={selected}
            allGrooves={grooves}
            onSelectGroove={handleSelect}
          />
        </aside>
      </div>
    </div>
  );
}
