import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { NormalizedGroove, RawGroove, ViewMode, TrajectoryPoint } from "./types";
import { normalizeGrooves, grooveDistance, syntheticDistance } from "./utils";
import { playGrooveSequence, generatePattern, startPlayback, stopPlayback } from "./audioEngine";
import { clusterGrooves, buildSimilarityCache } from "./clustering";
import GrooveField from "./GrooveField";
import GrooveDNA from "./GrooveDNA";
import GrooveSculptor from "./GrooveSculptor";

const INITIAL_BATCH = 300;
const BATCH_SIZE = 500;
const CLUSTER_K = 20;

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "field", label: "Field" },
  { key: "topology", label: "Topology" },
  { key: "landscape", label: "Landscape" },
];

export default function GrooveIntelligenceLab() {
  const [grooves, setGrooves] = useState<NormalizedGroove[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<NormalizedGroove | null>(null);
  const [hovered, setHovered] = useState<NormalizedGroove | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("field");
  const [sculptorActive, setSculptorActive] = useState(false);
  const [sculptorValues, setSculptorValues] = useState({ energy: 0.5, swing: 0.5, syncopation: 0.5, dynamics: 0.5 });
  const [currentStep, setCurrentStep] = useState(-1);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const sculptorRef = useRef(sculptorValues);
  sculptorRef.current = sculptorValues;
  const allRawRef = useRef<RawGroove[]>([]);
  const loadingRef = useRef(false);

  // Groove lookup map (O(1) access)
  const grooveMap = useMemo(() => {
    const m = new Map<string, NormalizedGroove>();
    for (const g of grooves) m.set(g.id, g);
    return m;
  }, [grooves]);

  // Clusters (recomputed when grooves change significantly)
  const clusters = useMemo(() => {
    if (grooves.length < 10) return [];
    const k = Math.min(CLUSTER_K, Math.max(5, Math.floor(grooves.length / 30)));
    return clusterGrooves(grooves, k);
  }, [grooves]);

  // Progressive loading
  useEffect(() => {
    fetch("/data/egmd.json")
      .then(r => r.json())
      .then((data: RawGroove[]) => {
        allRawRef.current = data;
        setTotalCount(data.length);

        // Load initial batch immediately
        const initial = data.slice(0, INITIAL_BATCH);
        setGrooves(normalizeGrooves(initial));
        setLoadingProgress(Math.min(1, initial.length / data.length));

        // Progressively load remaining
        if (data.length > INITIAL_BATCH) {
          loadingRef.current = true;
          let loaded = INITIAL_BATCH;
          const loadNext = () => {
            if (!loadingRef.current) return;
            const next = data.slice(loaded, loaded + BATCH_SIZE);
            if (next.length === 0) {
              loadingRef.current = false;
              return;
            }
            loaded += next.length;
            const normalized = normalizeGrooves(next);
            setGrooves(prev => [...prev, ...normalized]);
            setLoadingProgress(Math.min(1, loaded / data.length));

            if (loaded < data.length) {
              setTimeout(loadNext, 50);
            } else {
              loadingRef.current = false;
            }
          };
          setTimeout(loadNext, 100);
        }
      })
      .catch(err => console.error("Failed to load groove data:", err));

    return () => { loadingRef.current = false; };
  }, []);

  // Selection handler
  const handleSelect = useCallback((g: NormalizedGroove) => {
    stopPlayback();
    setCurrentStep(-1);
    setSelected(g);
    playGrooveSequence(g.norm_density, g.norm_swing, g.norm_velocity);

    setTrajectory(prev => [...prev, { groove: g, timestamp: Date.now() }]);

    const pattern = generatePattern(g);
    setTimeout(() => {
      startPlayback(g, pattern, (step) => setCurrentStep(step));
    }, 200);

    // Warp field
    setGrooves(prev => prev.map(node => {
      if (node.id === g.id) {
        return { ...node, tx: 0.5, ty: 0.5 };
      }
      const d = grooveDistance(g, node);
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
        const angle = Math.atan2(node.py - 0.5, node.px - 0.5);
        const r = 0.05 + d * 0.4;
        return {
          ...node,
          tx: 0.5 + Math.cos(angle) * r,
          ty: 0.5 + Math.sin(angle) * r,
        };
      }));
      stopPlayback();
      setCurrentStep(-1);
      setSelected(null);
    }, 100);
    return () => clearTimeout(id);
  }, [sculptorActive, sculptorValues, grooves.length]);

  // Cleanup
  useEffect(() => () => stopPlayback(), []);

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
        <div className="flex items-center gap-3">
          {/* Loading progress */}
          {loadingProgress < 1 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-300" style={{ width: `${loadingProgress * 100}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground/40 font-mono">Loading…</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground/30 font-mono">
            {grooves.length}{totalCount > grooves.length ? `/${totalCount}` : ''} nodes · {clusters.length} clusters · {new Set(grooves.map(g => g.genre)).size} genres
          </span>
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
            currentStep={currentStep}
            trajectory={trajectory}
            clusters={clusters}
            grooveMap={grooveMap}
          />
          {/* Trajectory distance meter */}
          {trajectory.length >= 2 && (
            <div className="absolute top-3 left-3 bg-black/70 border border-white/10 rounded-lg px-3 py-2 pointer-events-auto z-10">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-wider">Trajectory</p>
                  <p className="text-xs font-mono text-foreground">
                    {trajectory.length} stops · Σd = {trajectory.reduce((sum, tp, i) => {
                      if (i === 0) return 0;
                      return sum + grooveDistance(tp.groove, trajectory[i - 1].groove);
                    }, 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">
                    Last hop: {grooveDistance(trajectory[trajectory.length - 1].groove, trajectory[trajectory.length - 2].groove).toFixed(3)}
                  </p>
                </div>
                <button
                  onClick={() => setTrajectory(selected ? [{ groove: selected, timestamp: Date.now() }] : [])}
                  className="text-[9px] font-mono text-muted-foreground/50 hover:text-foreground border border-white/10 rounded px-2 py-1 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          {/* Meta text */}
          <div className="absolute bottom-12 left-4 right-16 text-center pointer-events-none">
            <p className="text-[10px] text-white/15 font-mono tracking-wider">
              Each point represents a human performance embedded in perceptual rhythm space. Scroll to zoom · Shift+drag to pan.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-72 border-l border-white/5 p-4 overflow-y-auto shrink-0 flex flex-col gap-5">
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
            currentStep={currentStep}
          />
        </aside>
      </div>
    </div>
  );
}
