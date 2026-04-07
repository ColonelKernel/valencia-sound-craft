import { useState, useMemo, useCallback } from "react";
import { Play, Plus, RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { playChord, playNote, type InstrumentTimbre } from "./audioSynth";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Constants ──────────────────────────────────────────
const ALL_NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const FIFTHS_ORDER = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
const MINOR_ORDER = ['Am','Em','Bm','F#m','C#m','G#m','Ebm','Bbm','Fm','Cm','Gm','Dm'];
const DIMINISHED_ORDER = ['Bdim','F#dim','C#dim','G#dim','D#dim','A#dim','Fdim','Cdim','Gdim','Ddim','Adim','Edim'];

const MINOR_DISPLAY: Record<string, string> = {
  'Am': 'Am', 'Em': 'Em', 'Bm': 'Bm', 'F#m': 'F#m', 'C#m': 'C#m',
  'G#m': 'G#m', 'Ebm': 'E♭m', 'Bbm': 'B♭m', 'Fm': 'Fm', 'Cm': 'Cm', 'Gm': 'Gm', 'Dm': 'Dm',
};

const KEY_SIGNATURES: Record<string, string> = {
  'C': '0', 'G': '1♯', 'D': '2♯', 'A': '3♯', 'E': '4♯', 'B': '5♯',
  'F#': '6♯/6♭', 'Db': '5♭', 'Ab': '4♭', 'Eb': '3♭', 'Bb': '2♭', 'F': '1♭',
};

function majorTriad(root: string): string[] {
  const i = ALL_NOTES.indexOf(root.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Ab', 'G#').replace('Bb', 'A#'));
  if (i < 0) {
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
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const isMobile = useIsMobile();

  // Responsive dimensions — larger touch targets on mobile via viewBox scaling
  const CX = 300, CY = 300;
  const R_OUTER = 260, R_MAJOR = 210, R_MINOR = 160, R_DIM = 120, R_INNER = 80;
  const SEGMENT_ANGLE = (2 * Math.PI) / 12;
  const OFFSET = -Math.PI / 2;

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

  const activeKey = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
  const rel = getRelatedKeys(activeKey);

  // Font sizes that work well on mobile SVG
  const majorFontSize = isMobile ? 18 : 14;
  const majorActiveFontSize = isMobile ? 20 : 16;
  const minorFontSize = isMobile ? 14 : 12;
  const dimFontSize = isMobile ? 10 : 8;
  const keySigFontSize = isMobile ? 11 : 9;
  const centerFontSize = isMobile ? 24 : 20;

  const toggleBtnClass = (active: boolean) =>
    `flex items-center gap-1.5 text-xs sm:text-[10px] px-3 py-2 sm:px-2 sm:py-1 rounded border transition-colors touch-manipulation ${
      active
        ? 'border-primary bg-primary/15 text-primary'
        : 'border-border text-muted-foreground hover:bg-accent active:bg-accent'
    }`;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header + toggles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Circle of Fifths</h3>
          <button
            onClick={() => { setSelectedKey(null); setSelectedMinor(null); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 sm:px-2 sm:py-1 rounded border border-border text-muted-foreground hover:bg-accent active:bg-accent transition-colors touch-manipulation"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowKeySig(!showKeySig)} className={toggleBtnClass(showKeySig)}>
            {showKeySig ? <Eye size={12} /> : <EyeOff size={12} />} Key Sig
          </button>
          <button onClick={() => setShowRelated(!showRelated)} className={toggleBtnClass(showRelated)}>
            Related Keys
          </button>
          <button onClick={() => setShowDiminished(!showDiminished)} className={toggleBtnClass(showDiminished)}>
            vii° Ring
          </button>
        </div>
      </div>

      {!isMobile && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          Click any key to hear its chord and see related keys. The <strong>outer ring</strong> shows major keys,
          the <strong>middle ring</strong> their relative minors, and the <strong>inner ring</strong> diminished chords.
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* SVG Circle — fills container width, no minWidth constraint */}
        <div className="flex-1 flex justify-center">
          <svg
            viewBox="0 0 600 600"
            className="w-full max-w-[500px]"
            style={{ touchAction: 'manipulation' }}
          >
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
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'major', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleMajorClick(key, i)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={isActiveKey(key) ? majorActiveFontSize : majorFontSize}
                    fontWeight={isActiveKey(key) ? 700 : 500}
                    fill={isActiveKey(key) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                    className="pointer-events-none select-none">
                    {key}
                  </text>
                  {showKeySig && (
                    <text x={pos.x} y={pos.y + (isMobile ? 16 : 14)} textAnchor="middle" dominantBaseline="central"
                      fontSize={keySigFontSize} fill="hsl(var(--muted-foreground))" opacity={0.7}
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
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'minor', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleMinorClick(key, i)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={minorFontSize} fontWeight={selectedMinor === key ? 700 : 400}
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
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'dim', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleDimClick(key)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={dimFontSize} fontWeight={400}
                    fill="hsl(var(--muted-foreground))"
                    className="pointer-events-none select-none">
                    {key.replace('dim', '°')}
                  </text>
                </g>
              );
            })}

            {/* Center label */}
            <circle cx={CX} cy={CY} r={showDiminished ? R_DIM : R_MINOR} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="central"
              fontSize={centerFontSize} fontWeight={700} fill="hsl(var(--foreground))"
              className="select-none">
              {selectedKey || selectedMinor || FIFTHS_ORDER[rootKeyIdx] || 'C'}
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central"
              fontSize={isMobile ? 12 : 10} fill="hsl(var(--muted-foreground))"
              className="select-none">
              {selectedMinor ? 'minor' : 'major'}
            </text>
            {showKeySig && (
              <text x={CX} y={CY + (isMobile ? 28 : 24)} textAnchor="middle" dominantBaseline="central"
                fontSize={isMobile ? 13 : 11} fill="hsl(var(--primary))" fontWeight={600}
                className="select-none">
                {KEY_SIGNATURES[selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C'] || ''}
              </text>
            )}

            {/* Relationship arrows */}
            {showRelated && !selectedMinor && (() => {
              const activeIdx = FIFTHS_ORDER.indexOf(activeKey);
              const domIdx = (activeIdx + 1) % 12;
              const subIdx = (activeIdx + 11) % 12;
              const midR = (R_OUTER + R_MAJOR) / 2;
              const activePos = textPos(midR, activeIdx);
              const domPos = textPos(midR, domIdx);
              const subPos = textPos(midR, subIdx);

              return (
                <g className="pointer-events-none">
                  <line x1={activePos.x} y1={activePos.y} x2={domPos.x} y2={domPos.y}
                    stroke="hsl(45, 80%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                  <text x={(activePos.x + domPos.x) / 2} y={(activePos.y + domPos.y) / 2 - 8}
                    textAnchor="middle" fontSize={isMobile ? 10 : 8} fill="hsl(45, 80%, 65%)" fontWeight={600}
                    className="select-none">V</text>
                  <line x1={activePos.x} y1={activePos.y} x2={subPos.x} y2={subPos.y}
                    stroke="hsl(200, 70%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                  <text x={(activePos.x + subPos.x) / 2} y={(activePos.y + subPos.y) / 2 - 8}
                    textAnchor="middle" fontSize={isMobile ? 10 : 8} fill="hsl(200, 70%, 65%)" fontWeight={600}
                    className="select-none">IV</text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Info panel — collapsible on mobile */}
        <div className="w-full lg:w-64 space-y-3">
          {isMobile ? (
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{selectedMinor || (activeKey + ' major')}</span>
                <span className="text-[10px] text-primary font-medium">{KEY_SIGNATURES[activeKey]}</span>
                {showRelated && (
                  <span className="text-[10px] text-muted-foreground">
                    V: {rel.dominant} · IV: {rel.subdominant}
                  </span>
                )}
              </div>
              {showInfoPanel ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
          ) : null}

          {(!isMobile || showInfoPanel) && (
            <>
              <div className="p-3 rounded-lg border border-border bg-card space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Key Info</p>
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
                      className="font-medium text-amber-400 hover:underline active:underline cursor-pointer touch-manipulation">{rel.dominant}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdominant (IV)</span>
                    <button onClick={() => handleMajorClick(rel.subdominant, FIFTHS_ORDER.indexOf(rel.subdominant))}
                      className="font-medium text-sky-400 hover:underline active:underline cursor-pointer touch-manipulation">{rel.subdominant}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relative Minor</span>
                    <button onClick={() => handleMinorClick(MINOR_ORDER[FIFTHS_ORDER.indexOf(activeKey)], FIFTHS_ORDER.indexOf(activeKey))}
                      className="font-medium text-rose-400 hover:underline active:underline cursor-pointer touch-manipulation">
                      {MINOR_ORDER[FIFTHS_ORDER.indexOf(activeKey)]}
                    </button>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Diatonic Chords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'].map((numeral) => (
                      <span key={numeral} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                        {numeral}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Legend</p>
                <div className={`${isMobile ? 'grid grid-cols-2' : 'space-y-1.5'} text-[10px] gap-1.5`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary shrink-0" />
                    <span className="text-foreground">Active key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(45, 80%, 45%)' }} />
                    <span className="text-foreground">Dominant (V)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(200, 70%, 45%)' }} />
                    <span className="text-foreground">Subdominant (IV)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(330, 60%, 40%)' }} />
                    <span className="text-foreground">Relative minor</span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Adjacent keys differ by one accidental. Clockwise adds sharps; counterclockwise adds flats. Tap any segment to hear its chord.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;
