import { useState, useMemo, useCallback } from "react";
import { Play, Plus, RotateCcw, Eye, EyeOff } from "lucide-react";
import { playChord, playNote, type InstrumentTimbre } from "./audioSynth";

// ─── Constants ──────────────────────────────────────────
const ALL_NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const FIFTHS_ORDER = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
const MINOR_ORDER = ['Am','Em','Bm','F#m','C#m','G#m','Ebm','Bbm','Fm','Cm','Gm','Dm'];
const DIMINISHED_ORDER = ['Bdim','F#dim','C#dim','G#dim','D#dim','A#dim','Fdim','Cdim','Gdim','Ddim','Adim','Edim'];

// Enharmonic display for minor keys
const MINOR_DISPLAY: Record<string, string> = {
  'Am': 'Am', 'Em': 'Em', 'Bm': 'Bm', 'F#m': 'F#m', 'C#m': 'C#m',
  'G#m': 'G#m', 'Ebm': 'E♭m', 'Bbm': 'B♭m', 'Fm': 'Fm', 'Cm': 'Cm', 'Gm': 'Gm', 'Dm': 'Dm',
};

const KEY_SIGNATURES: Record<string, string> = {
  'C': '0', 'G': '1♯', 'D': '2♯', 'A': '3♯', 'E': '4♯', 'B': '5♯',
  'F#': '6♯/6♭', 'Db': '5♭', 'Ab': '4♭', 'Eb': '3♭', 'Bb': '2♭', 'F': '1♭',
};

// Build triads
function majorTriad(root: string): string[] {
  const i = ALL_NOTES.indexOf(root.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Ab', 'G#').replace('Bb', 'A#'));
  if (i < 0) {
    // Handle flats by mapping
    const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#' };
    const mapped = flatMap[root];
    if (mapped) {
      const mi = ALL_NOTES.indexOf(mapped);
      return [ALL_NOTES[mi], ALL_NOTES[(mi + 4) % 12], ALL_NOTES[(mi + 7) % 12]];
    }
    return [root];
  }
  return [ALL_NOTES[i], ALL_NOTES[(i + 4) % 12], ALL_NOTES[(i + 7) % 12]];
}

function minorTriad(root: string): string[] {
  const clean = root.replace('m', '').replace('dim', '');
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#' };
  const mapped = flatMap[clean] || clean;
  const i = ALL_NOTES.indexOf(mapped);
  if (i < 0) return [clean];
  return [ALL_NOTES[i], ALL_NOTES[(i + 3) % 12], ALL_NOTES[(i + 7) % 12]];
}

function dimTriad(root: string): string[] {
  const clean = root.replace('dim', '');
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#' };
  const mapped = flatMap[clean] || clean;
  const i = ALL_NOTES.indexOf(mapped);
  if (i < 0) return [clean];
  return [ALL_NOTES[i], ALL_NOTES[(i + 3) % 12], ALL_NOTES[(i + 6) % 12]];
}

// Related keys
function getRelatedKeys(key: string) {
  const idx = FIFTHS_ORDER.indexOf(key);
  if (idx < 0) return { dominant: '', subdominant: '', relative: '', parallel: '' };
  return {
    dominant: FIFTHS_ORDER[(idx + 1) % 12],
    subdominant: FIFTHS_ORDER[(idx + 11) % 12],
    relative: MINOR_ORDER[idx].replace('m', ''),
    parallel: key + 'm',
  };
}

interface CircleOfFifthsProps {
  scaleNotes?: string[];
  root?: string;
  timbre?: InstrumentTimbre;
  onAddToProgression?: (notes: string[], symbol: string) => void;
}

const CircleOfFifths = ({ scaleNotes = [], root = 'C', timbre = 'piano', onAddToProgression }: CircleOfFifthsProps) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMinor, setSelectedMinor] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<{ ring: 'major' | 'minor' | 'dim'; index: number } | null>(null);
  const [showRelated, setShowRelated] = useState(true);
  const [showKeySig, setShowKeySig] = useState(true);
  const [showDiminished, setShowDiminished] = useState(true);

  const CX = 300, CY = 300;
  const R_OUTER = 260, R_MAJOR = 210, R_MINOR = 160, R_DIM = 120, R_INNER = 80;
  const SEGMENT_ANGLE = (2 * Math.PI) / 12;
  const OFFSET = -Math.PI / 2; // Start at 12 o'clock

  // Which key is highlighted from the parent scale root
  const rootKeyIdx = useMemo(() => FIFTHS_ORDER.indexOf(root), [root]);

  const arcPath = useCallback((innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    const x1 = CX + outerR * Math.cos(startAngle);
    const y1 = CY + outerR * Math.sin(startAngle);
    const x2 = CX + outerR * Math.cos(endAngle);
    const y2 = CY + outerR * Math.sin(endAngle);
    const x3 = CX + innerR * Math.cos(endAngle);
    const y3 = CY + innerR * Math.sin(endAngle);
    const x4 = CX + innerR * Math.cos(startAngle);
    const y4 = CY + innerR * Math.sin(startAngle);
    return `M${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 0,0 ${x4},${y4} Z`;
  }, []);

  const textPos = useCallback((r: number, index: number) => {
    const angle = OFFSET + index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  }, []);

  // Active key highlighting
  const isActiveKey = useCallback((key: string) => {
    return selectedKey === key || (selectedKey === null && FIFTHS_ORDER[rootKeyIdx] === key);
  }, [selectedKey, rootKeyIdx]);

  const related = useMemo(() => {
    const key = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
    return getRelatedKeys(key);
  }, [selectedKey, rootKeyIdx]);

  const handleMajorClick = useCallback((key: string, idx: number) => {
    setSelectedKey(prev => prev === key ? null : key);
    setSelectedMinor(null);
    const notes = majorTriad(key);
    playChord(notes, 0.6, timbre);
    if (onAddToProgression) onAddToProgression(notes, key);
  }, [timbre, onAddToProgression]);

  const handleMinorClick = useCallback((key: string, idx: number) => {
    setSelectedMinor(prev => prev === key ? null : key);
    setSelectedKey(null);
    const notes = minorTriad(key);
    playChord(notes, 0.6, timbre);
    if (onAddToProgression) onAddToProgression(notes, key);
  }, [timbre, onAddToProgression]);

  const handleDimClick = useCallback((key: string) => {
    const notes = dimTriad(key);
    playChord(notes, 0.5, timbre);
    if (onAddToProgression) onAddToProgression(notes, key);
  }, [timbre, onAddToProgression]);

  // Determine highlight colors
  const getMajorFill = useCallback((key: string, idx: number) => {
    const isHovered = hoveredSegment?.ring === 'major' && hoveredSegment.index === idx;
    const isActive = isActiveKey(key);
    const isRelDom = showRelated && related.dominant === key;
    const isRelSub = showRelated && related.subdominant === key;

    if (isActive) return 'hsl(var(--primary))';
    if (isRelDom) return 'hsl(45, 80%, 45%)';
    if (isRelSub) return 'hsl(200, 70%, 45%)';
    if (isHovered) return 'hsl(var(--accent))';
    return 'hsl(var(--card))';
  }, [hoveredSegment, isActiveKey, showRelated, related]);

  const getMinorFill = useCallback((key: string, idx: number) => {
    const isHovered = hoveredSegment?.ring === 'minor' && hoveredSegment.index === idx;
    const isRelative = showRelated && MINOR_ORDER[idx] === MINOR_ORDER[FIFTHS_ORDER.indexOf(selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C')];
    
    if (selectedMinor === key) return 'hsl(var(--primary))';
    if (isRelative && !selectedMinor) return 'hsl(330, 60%, 40%)';
    if (isHovered) return 'hsl(var(--accent))';
    return 'hsl(var(--secondary))';
  }, [hoveredSegment, selectedMinor, showRelated, selectedKey, rootKeyIdx]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground">Circle of Fifths</h3>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button onClick={() => setShowKeySig(!showKeySig)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${showKeySig ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            {showKeySig ? <Eye size={10} /> : <EyeOff size={10} />} Key Sig
          </button>
          <button onClick={() => setShowRelated(!showRelated)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${showRelated ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            Related Keys
          </button>
          <button onClick={() => setShowDiminished(!showDiminished)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${showDiminished ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
            vii° Ring
          </button>
          <button onClick={() => { setSelectedKey(null); setSelectedMinor(null); }}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent transition-colors">
            <RotateCcw size={10} /> Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
        Click any key to hear its chord and see related keys. The <strong>outer ring</strong> shows major keys,
        the <strong>middle ring</strong> their relative minors, and the <strong>inner ring</strong> diminished chords.
        Adjacent keys share the most notes.
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SVG Circle */}
        <div className="flex-1 flex justify-center">
          <div className="overflow-visible">
            <svg viewBox="0 0 600 600" className="w-full max-w-[500px] mx-auto" style={{ minWidth: 320 }}>
              {/* Background circle */}
              <circle cx={CX} cy={CY} r={R_OUTER + 5} fill="none" stroke="hsl(var(--border))" strokeWidth={1} opacity={0.3} />

              {/* Major key segments (outer ring) */}
              {FIFTHS_ORDER.map((key, i) => {
                const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const pos = textPos((R_OUTER + R_MAJOR) / 2, i);

                return (
                  <g key={`major-${key}`}>
                    <path
                      d={arcPath(R_MAJOR, R_OUTER, startAngle, endAngle)}
                      fill={getMajorFill(key, i)}
                      stroke="hsl(var(--border))"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment({ ring: 'major', index: i })}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleMajorClick(key, i)}
                    />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={isActiveKey(key) ? 16 : 14} fontWeight={isActiveKey(key) ? 700 : 500}
                      fill={isActiveKey(key) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                      className="pointer-events-none select-none">
                      {key}
                    </text>
                    {showKeySig && (
                      <text x={pos.x} y={pos.y + 14} textAnchor="middle" dominantBaseline="central"
                        fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.7}
                        className="pointer-events-none select-none">
                        {KEY_SIGNATURES[key]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Minor key segments (middle ring) */}
              {MINOR_ORDER.map((key, i) => {
                const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const pos = textPos((R_MAJOR + R_MINOR) / 2, i);

                return (
                  <g key={`minor-${key}`}>
                    <path
                      d={arcPath(R_MINOR, R_MAJOR, startAngle, endAngle)}
                      fill={getMinorFill(key, i)}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment({ ring: 'minor', index: i })}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleMinorClick(key, i)}
                    />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={12} fontWeight={selectedMinor === key ? 700 : 400}
                      fill={selectedMinor === key ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                      className="pointer-events-none select-none">
                      {MINOR_DISPLAY[key] || key}
                    </text>
                  </g>
                );
              })}

              {/* Diminished ring (inner) */}
              {showDiminished && DIMINISHED_ORDER.map((key, i) => {
                const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const pos = textPos((R_MINOR + R_DIM) / 2, i);
                const isHovered = hoveredSegment?.ring === 'dim' && hoveredSegment.index === i;

                return (
                  <g key={`dim-${key}`}>
                    <path
                      d={arcPath(R_DIM, R_MINOR, startAngle, endAngle)}
                      fill={isHovered ? 'hsl(var(--accent))' : 'hsl(var(--muted))'}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.8}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredSegment({ ring: 'dim', index: i })}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleDimClick(key)}
                    />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={8} fontWeight={400}
                      fill="hsl(var(--muted-foreground))"
                      className="pointer-events-none select-none">
                      {key.replace('dim', '°')}
                    </text>
                  </g>
                );
              })}

              {/* Center label */}
              <circle cx={CX} cy={CY} r={showDiminished ? R_DIM : R_MINOR} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1} />
              <text x={CX} y={CY - 12} textAnchor="middle" dominantBaseline="central"
                fontSize={20} fontWeight={700} fill="hsl(var(--foreground))"
                className="select-none">
                {selectedKey || selectedMinor || FIFTHS_ORDER[rootKeyIdx] || 'C'}
              </text>
              <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central"
                fontSize={10} fill="hsl(var(--muted-foreground))"
                className="select-none">
                {selectedMinor ? 'minor' : selectedKey ? 'major' : 'major'}
              </text>
              {showKeySig && (
                <text x={CX} y={CY + 24} textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="hsl(var(--primary))" fontWeight={600}
                  className="select-none">
                  {KEY_SIGNATURES[selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C'] || ''}
                </text>
              )}

              {/* Relationship arrows when showRelated */}
              {showRelated && !selectedMinor && (() => {
                const activeKey = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
                const activeIdx = FIFTHS_ORDER.indexOf(activeKey);
                const domIdx = (activeIdx + 1) % 12;
                const subIdx = (activeIdx + 11) % 12;
                const midR = (R_OUTER + R_MAJOR) / 2;
                const activePos = textPos(midR, activeIdx);
                const domPos = textPos(midR, domIdx);
                const subPos = textPos(midR, subIdx);

                return (
                  <g className="pointer-events-none">
                    {/* Dominant arrow */}
                    <line x1={activePos.x} y1={activePos.y} x2={domPos.x} y2={domPos.y}
                      stroke="hsl(45, 80%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                    <text x={(activePos.x + domPos.x) / 2} y={(activePos.y + domPos.y) / 2 - 8}
                      textAnchor="middle" fontSize={8} fill="hsl(45, 80%, 65%)" fontWeight={600}
                      className="select-none">V</text>
                    {/* Subdominant arrow */}
                    <line x1={activePos.x} y1={activePos.y} x2={subPos.x} y2={subPos.y}
                      stroke="hsl(200, 70%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                    <text x={(activePos.x + subPos.x) / 2} y={(activePos.y + subPos.y) / 2 - 8}
                      textAnchor="middle" fontSize={8} fill="hsl(200, 70%, 65%)" fontWeight={600}
                      className="select-none">IV</text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="w-full lg:w-64 space-y-3">
          <div className="p-3 rounded-lg border border-border bg-card space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Key Info</p>
            
            {(() => {
              const activeKey = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
              const rel = getRelatedKeys(activeKey);
              return (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key</span>
                    <span className="font-semibold text-foreground">{selectedMinor || (activeKey + ' major')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signature</span>
                    <span className="font-medium text-foreground">{KEY_SIGNATURES[activeKey]}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Related Keys</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dominant (V)</span>
                    <button onClick={() => handleMajorClick(rel.dominant, FIFTHS_ORDER.indexOf(rel.dominant))}
                      className="font-medium text-amber-400 hover:underline cursor-pointer">{rel.dominant}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdominant (IV)</span>
                    <button onClick={() => handleMajorClick(rel.subdominant, FIFTHS_ORDER.indexOf(rel.subdominant))}
                      className="font-medium text-sky-400 hover:underline cursor-pointer">{rel.subdominant}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relative Minor</span>
                    <button onClick={() => handleMinorClick(MINOR_ORDER[FIFTHS_ORDER.indexOf(activeKey)], FIFTHS_ORDER.indexOf(activeKey))}
                      className="font-medium text-rose-400 hover:underline cursor-pointer">
                      {MINOR_ORDER[FIFTHS_ORDER.indexOf(activeKey)]}
                    </button>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Diatonic Chords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'].map((numeral, ci) => {
                      const majorScale = majorTriad(activeKey);
                      return (
                        <span key={numeral} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                          {numeral}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Legend */}
          <div className="p-3 rounded-lg border border-border bg-card space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Legend</p>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-foreground">Active key</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45, 80%, 45%)' }} />
                <span className="text-foreground">Dominant (V)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(200, 70%, 45%)' }} />
                <span className="text-foreground">Subdominant (IV)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(330, 60%, 40%)' }} />
                <span className="text-foreground">Relative minor</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Adjacent keys on the circle differ by one accidental. Moving clockwise adds sharps; counterclockwise adds flats.
            Click any segment to hear its chord.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;
