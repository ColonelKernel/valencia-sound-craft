import { useState, useMemo, useCallback } from "react";
import { playChord, playNote, type InstrumentTimbre } from "./audioSynth";

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
};

function normalize(note: string): string {
  return ENHARMONIC[note] || note;
}

function noteIndex(note: string): number {
  return ALL_NOTES.indexOf(normalize(note));
}

// Tonnetz axes: right = +7 (P5), up-right = +4 (M3), up-left = +3 (m3)
// We use axial coordinates (q, r) where q = fifths axis, r = major-thirds axis
// Note at (q, r) = (7q + 4r) mod 12

interface TonnetzNode {
  q: number;
  r: number;
  noteIdx: number;
  note: string;
  x: number;
  y: number;
}

interface TonnetzTriad {
  notes: [number, number, number];
  nodes: [TonnetzNode, TonnetzNode, TonnetzNode];
  type: 'major' | 'minor';
  label: string;
}

const HEX_RADIUS = 28;
const COLS = 12;
const ROWS = 6;

function buildGrid(): TonnetzNode[] {
  const nodes: TonnetzNode[] = [];
  const dx = HEX_RADIUS * 1.85;
  const dy = HEX_RADIUS * 1.6;

  for (let r = 0; r < ROWS; r++) {
    for (let q = 0; q < COLS; q++) {
      const noteIdx = ((7 * q + 4 * r) % 12 + 12) % 12;
      const x = q * dx + (r % 2 === 1 ? dx / 2 : 0) + HEX_RADIUS + 10;
      const y = (ROWS - 1 - r) * dy + HEX_RADIUS + 10;
      nodes.push({ q, r, noteIdx, note: ALL_NOTES[noteIdx], x, y });
    }
  }
  return nodes;
}

function findTriads(nodes: TonnetzNode[]): TonnetzTriad[] {
  const triads: TonnetzTriad[] = [];
  const nodeMap = new Map<string, TonnetzNode>();
  nodes.forEach(n => nodeMap.set(`${n.q},${n.r}`, n));

  for (const n of nodes) {
    // Major triad: root, +4 (M3), +7 (P5) — upward triangle
    // In the grid: (q,r), (q,r+1) shifted, (q+1,r)
    const right = nodeMap.get(`${n.q + 1},${n.r}`);
    const upKey = n.r % 2 === 0 ? `${n.q},${n.r + 1}` : `${n.q + 1},${n.r + 1}`;
    const up = nodeMap.get(upKey);

    if (right && up) {
      // Check if these form root-M3-P5
      const rootIdx = n.noteIdx;
      const thirdIdx = up.noteIdx;
      const fifthIdx = right.noteIdx;
      const interval1 = ((thirdIdx - rootIdx) % 12 + 12) % 12;
      const interval2 = ((fifthIdx - rootIdx) % 12 + 12) % 12;

      if (interval1 === 4 && interval2 === 7) {
        triads.push({
          notes: [rootIdx, thirdIdx, fifthIdx],
          nodes: [n, up, right],
          type: 'major',
          label: `${ALL_NOTES[rootIdx]}`,
        });
      }
      if (interval1 === 3 && interval2 === 7) {
        triads.push({
          notes: [rootIdx, thirdIdx, fifthIdx],
          nodes: [n, up, right],
          type: 'minor',
          label: `${ALL_NOTES[rootIdx]}m`,
        });
      }
    }

    // Minor triad: downward triangle
    const upLeftKey = n.r % 2 === 0 ? `${n.q - 1},${n.r + 1}` : `${n.q},${n.r + 1}`;
    const upLeft = nodeMap.get(upLeftKey);

    if (up && upLeft) {
      const rootIdx = n.noteIdx;
      const idx1 = upLeft.noteIdx;
      const idx2 = up.noteIdx;
      const i1 = ((idx1 - rootIdx) % 12 + 12) % 12;
      const i2 = ((idx2 - rootIdx) % 12 + 12) % 12;

      if (i1 === 3 && i2 === 4) {
        // This is a minor triad root-m3-M3(=P5 from m3)
        triads.push({
          notes: [rootIdx, idx1, idx2],
          nodes: [n, upLeft, up],
          type: 'minor',
          label: `${ALL_NOTES[rootIdx]}m`,
        });
      }
    }
  }

  // Deduplicate by sorted note set + type
  const seen = new Set<string>();
  return triads.filter(t => {
    const key = [...t.notes].sort().join(',') + t.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Color palette for each pitch class
const NOTE_COLORS: Record<number, string> = {
  0: '#ef4444',  // C - red
  1: '#f97316',  // C# - orange
  2: '#eab308',  // D - yellow
  3: '#84cc16',  // D# - lime
  4: '#22c55e',  // E - green
  5: '#14b8a6',  // F - teal
  6: '#06b6d4',  // F# - cyan
  7: '#3b82f6',  // G - blue
  8: '#6366f1',  // G# - indigo
  9: '#8b5cf6',  // A - violet
  10: '#d946ef', // A# - fuchsia
  11: '#ec4899', // B - pink
};

interface TonnetzProps {
  scaleNotes?: string[];
  root?: string;
  timbre?: InstrumentTimbre;
}

const Tonnetz = ({ scaleNotes = [], root = 'C', timbre = 'piano' }: TonnetzProps) => {
  const [hoveredTriad, setHoveredTriad] = useState<TonnetzTriad | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [showTriads, setShowTriads] = useState(true);
  const [colorMode, setColorMode] = useState<'pitch' | 'scale'>('scale');

  const nodes = useMemo(() => buildGrid(), []);
  const triads = useMemo(() => findTriads(nodes), [nodes]);

  const scaleSet = useMemo(() => {
    return new Set(scaleNotes.map(n => noteIndex(n)));
  }, [scaleNotes]);

  const rootIdx = noteIndex(root);

  const svgWidth = COLS * HEX_RADIUS * 1.85 + HEX_RADIUS + 20;
  const svgHeight = ROWS * HEX_RADIUS * 1.6 + HEX_RADIUS + 20;

  const isInScale = useCallback((idx: number) => scaleSet.has(idx), [scaleSet]);

  const getNodeFill = useCallback((node: TonnetzNode) => {
    const inScale = isInScale(node.noteIdx);
    const isRoot = node.noteIdx === rootIdx;
    const isHovered = activeNotes.has(node.noteIdx);
    const isTriadNote = hoveredTriad?.notes.includes(node.noteIdx);

    if (isTriadNote) {
      return NOTE_COLORS[node.noteIdx];
    }

    if (colorMode === 'pitch') {
      if (!inScale) return 'hsl(var(--muted))';
      return NOTE_COLORS[node.noteIdx];
    }

    // Scale mode
    if (isRoot) return 'hsl(var(--primary))';
    if (isHovered) return NOTE_COLORS[node.noteIdx];
    if (inScale) return 'hsl(var(--accent))';
    return 'hsl(var(--muted))';
  }, [isInScale, rootIdx, activeNotes, hoveredTriad, colorMode]);

  const getNodeTextColor = useCallback((node: TonnetzNode) => {
    const inScale = isInScale(node.noteIdx);
    const isRoot = node.noteIdx === rootIdx;
    const isTriadNote = hoveredTriad?.notes.includes(node.noteIdx);

    if (isTriadNote || colorMode === 'pitch' && inScale) return '#fff';
    if (isRoot) return 'hsl(var(--primary-foreground))';
    if (inScale) return 'hsl(var(--accent-foreground))';
    return 'hsl(var(--muted-foreground))';
  }, [isInScale, rootIdx, hoveredTriad, colorMode]);

  const handleNodeClick = useCallback((node: TonnetzNode) => {
    playNote(node.note, 0, 0.5, timbre);
    setActiveNotes(prev => {
      const next = new Set(prev);
      if (next.has(node.noteIdx)) next.delete(node.noteIdx);
      else next.add(node.noteIdx);
      return next;
    });
  }, [timbre]);

  const handleTriadClick = useCallback((triad: TonnetzTriad) => {
    const chordNotes = triad.notes.map(i => ALL_NOTES[i]);
    playChord(chordNotes, 0.6, timbre);
  }, [timbre]);

  // Hexagon path
  const hexPath = (cx: number, cy: number, r: number) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  // Scale-filtered triads only
  const scaleTriads = useMemo(() => {
    if (!showTriads) return [];
    return triads.filter(t => t.notes.every(n => scaleSet.has(n)));
  }, [triads, showTriads, scaleSet]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">Tonnetz — Harmonic Space</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showTriads}
              onChange={(e) => setShowTriads(e.target.checked)}
              className="rounded border-border"
            />
            Show triads
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Color:</span>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as 'pitch' | 'scale')}
              className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
            >
              <option value="scale">Scale</option>
              <option value="pitch">Pitch class</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
        The <strong>Tonnetz</strong> maps harmonic space: horizontal = perfect fifths, 
        diagonal axes = major & minor thirds. Adjacent nodes are always a third or fifth apart. 
        Triangles are triads — click any node to hear it, or hover a triangle to highlight a chord.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'hsl(var(--primary))' }} />
          Root
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'hsl(var(--accent))' }} />
          Scale note
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-blue-500/30 border border-blue-500" />
          Major triad
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-rose-500/30 border border-rose-500" />
          Minor triad
        </span>
      </div>

      {/* SVG Tonnetz */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-4xl mx-auto"
          style={{ minWidth: 500 }}
        >
          {/* Triad triangles */}
          {scaleTriads.map((triad, i) => {
            const [a, b, c] = triad.nodes;
            const isHovered = hoveredTriad === triad;
            return (
              <polygon
                key={`triad-${i}`}
                points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`}
                fill={triad.type === 'major' ? 'rgba(59,130,246,0.15)' : 'rgba(244,63,94,0.15)'}
                stroke={triad.type === 'major' ? '#3b82f6' : '#f43f5e'}
                strokeWidth={isHovered ? 2.5 : 1}
                opacity={isHovered ? 1 : 0.5}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredTriad(triad)}
                onMouseLeave={() => setHoveredTriad(null)}
                onClick={() => handleTriadClick(triad)}
              />
            );
          })}

          {/* Connection lines (fifths = horizontal) */}
          {nodes.map((node) => {
            const right = nodes.find(n => n.q === node.q + 1 && n.r === node.r);
            if (!right) return null;
            const bothInScale = isInScale(node.noteIdx) && isInScale(right.noteIdx);
            return (
              <line
                key={`line-h-${node.q}-${node.r}`}
                x1={node.x} y1={node.y}
                x2={right.x} y2={right.y}
                stroke={bothInScale ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'}
                strokeWidth={0.8}
              />
            );
          })}

          {/* Connection lines (diagonal — thirds) */}
          {nodes.map((node) => {
            const upKey = node.r % 2 === 0
              ? nodes.find(n => n.q === node.q && n.r === node.r + 1)
              : nodes.find(n => n.q === node.q + 1 && n.r === node.r + 1);
            const upLeftKey = node.r % 2 === 0
              ? nodes.find(n => n.q === node.q - 1 && n.r === node.r + 1)
              : nodes.find(n => n.q === node.q && n.r === node.r + 1);

            const lines = [];
            if (upKey) {
              const both = isInScale(node.noteIdx) && isInScale(upKey.noteIdx);
              lines.push(
                <line
                  key={`line-ur-${node.q}-${node.r}`}
                  x1={node.x} y1={node.y}
                  x2={upKey.x} y2={upKey.y}
                  stroke={both ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'}
                  strokeWidth={0.8}
                />
              );
            }
            if (upLeftKey) {
              const both = isInScale(node.noteIdx) && isInScale(upLeftKey.noteIdx);
              lines.push(
                <line
                  key={`line-ul-${node.q}-${node.r}`}
                  x1={node.x} y1={node.y}
                  x2={upLeftKey.x} y2={upLeftKey.y}
                  stroke={both ? 'hsl(var(--border))' : 'hsl(var(--border) / 0.3)'}
                  strokeWidth={0.8}
                />
              );
            }
            return lines;
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const inScale = isInScale(node.noteIdx);
            return (
              <g
                key={`node-${node.q}-${node.r}`}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node)}
              >
                <path
                  d={hexPath(node.x, node.y, HEX_RADIUS * 0.82)}
                  fill={getNodeFill(node)}
                  stroke={inScale ? 'hsl(var(--border))' : 'transparent'}
                  strokeWidth={1}
                  opacity={inScale ? 1 : 0.35}
                  className="transition-all duration-150"
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={getNodeTextColor(node)}
                  fontSize={inScale ? 11 : 9}
                  fontWeight={node.noteIdx === rootIdx ? 700 : inScale ? 500 : 400}
                  opacity={inScale ? 1 : 0.5}
                  className="pointer-events-none select-none"
                >
                  {node.note}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered triad info */}
      {hoveredTriad && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 text-sm">
          <span className={`font-semibold ${hoveredTriad.type === 'major' ? 'text-blue-400' : 'text-rose-400'}`}>
            {hoveredTriad.label}
          </span>
          <span className="text-muted-foreground">
            ({hoveredTriad.notes.map(i => ALL_NOTES[i]).join(' – ')})
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {hoveredTriad.type === 'major' ? '▲ Major' : '▽ Minor'}
          </span>
        </div>
      )}

      {/* Axis reference */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">→ Horizontal</div>
          <div>Perfect 5th (+7)</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">↗ Diagonal</div>
          <div>Major 3rd (+4)</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <div className="font-medium text-foreground">↖ Diagonal</div>
          <div>Minor 3rd (+3)</div>
        </div>
      </div>
    </div>
  );
};

export default Tonnetz;
