import { useState, useMemo, useCallback } from "react";
import { RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { playChord, type InstrumentTimbre } from "./audioSynth";
import { useIsMobile } from "@/hooks/use-mobile";

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

const MINOR_KEY_SIGNATURES: Record<string, string> = {
  'Am': '0', 'Em': '1♯', 'Bm': '2♯', 'F#m': '3♯', 'C#m': '4♯',
  'G#m': '5♯', 'Ebm': '6♭', 'Bbm': '5♭', 'Fm': '4♭', 'Cm': '3♭', 'Gm': '2♭', 'Dm': '1♭',
};

function majorTriad(root: string): string[] {
  const flatMap: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Ab': 'G#', 'Bb': 'A#' };
  const mapped = flatMap[root] || root;
  const i = ALL_NOTES.indexOf(mapped);
  if (i < 0) return [root];
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

function getRelatedKeysMajor(key: string) {
  const idx = FIFTHS_ORDER.indexOf(key);
  if (idx < 0) return { dominant: '', subdominant: '', relative: '' };
  return {
    dominant: FIFTHS_ORDER[(idx + 1) % 12],
    subdominant: FIFTHS_ORDER[(idx + 11) % 12],
    relative: MINOR_ORDER[idx],
  };
}

function getRelatedKeysMinor(key: string) {
  const idx = MINOR_ORDER.indexOf(key);
  if (idx < 0) return { dominant: '', subdominant: '', relativeMajor: '' };
  // Minor dominant = minor key a fifth up (clockwise)
  // Minor subdominant = minor key a fifth down (counterclockwise)
  return {
    dominant: MINOR_ORDER[(idx + 1) % 12],
    subdominant: MINOR_ORDER[(idx + 11) % 12],
    relativeMajor: FIFTHS_ORDER[idx],
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

  const CX = 300, CY = 300;
  const R_OUTER = 260, R_MAJOR = 210, R_MINOR = 160, R_DIM = 120;
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
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), angleDeg: (angle * 180) / Math.PI };
  }, []);

  // Radial rotation: text reads outward from center, flipping for bottom half
  const radialRotation = useCallback((index: number) => {
    const angleDeg = -90 + index * 30 + 15; // each segment = 30°, offset to center
    // For segments in the bottom half (90° < angle < 270°), flip 180° so text isn't upside down
    const normalized = ((angleDeg % 360) + 360) % 360;
    if (normalized > 90 && normalized < 270) return angleDeg + 180;
    return angleDeg;
  }, []);

  const isActiveKey = useCallback((key: string) => {
    return selectedKey === key || (selectedKey === null && !selectedMinor && FIFTHS_ORDER[rootKeyIdx] === key);
  }, [selectedKey, selectedMinor, rootKeyIdx]);

  const isActiveMinor = useCallback((key: string) => {
    return selectedMinor === key;
  }, [selectedMinor]);

  // Related keys for both major and minor selections
  const majorRelated = useMemo(() => {
    if (selectedMinor) return null;
    const key = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
    return getRelatedKeysMajor(key);
  }, [selectedKey, selectedMinor, rootKeyIdx]);

  const minorRelated = useMemo(() => {
    if (!selectedMinor) return null;
    return getRelatedKeysMinor(selectedMinor);
  }, [selectedMinor]);

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

    if (isActive) return 'hsl(var(--primary))';

    // Highlight related keys for major selection
    if (majorRelated && showRelated) {
      if (majorRelated.dominant === key) return 'hsl(45, 80%, 45%)';
      if (majorRelated.subdominant === key) return 'hsl(200, 70%, 45%)';
    }
    // Highlight relative major when a minor key is selected
    if (minorRelated && showRelated && minorRelated.relativeMajor === key) {
      return 'hsl(280, 60%, 45%)';
    }

    if (isHovered) return 'hsl(var(--accent))';
    return 'hsl(var(--card))';
  }, [hoveredSegment, isActiveKey, showRelated, majorRelated, minorRelated]);

  const getMinorFill = useCallback((key: string, idx: number) => {
    const isHovered = hoveredSegment?.ring === 'minor' && hoveredSegment.index === idx;

    if (isActiveMinor(key)) return 'hsl(var(--primary))';

    // Highlight relative minor when a major key is selected
    if (majorRelated && showRelated && majorRelated.relative === key) {
      return 'hsl(330, 60%, 40%)';
    }
    // Highlight related minor keys when a minor key is selected
    if (minorRelated && showRelated) {
      if (minorRelated.dominant === key) return 'hsl(45, 80%, 45%)';
      if (minorRelated.subdominant === key) return 'hsl(200, 70%, 45%)';
    }

    if (isHovered) return 'hsl(var(--accent))';
    return 'hsl(var(--secondary))';
  }, [hoveredSegment, isActiveMinor, showRelated, majorRelated, minorRelated]);

  const activeKey = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
  const activeDisplay = selectedMinor || (activeKey + ' major');
  const activeKeySig = selectedMinor
    ? MINOR_KEY_SIGNATURES[selectedMinor] || ''
    : KEY_SIGNATURES[activeKey] || '';

  // Build info for the sidebar
  const relInfo = selectedMinor
    ? {
        dom: minorRelated?.dominant || '',
        sub: minorRelated?.subdominant || '',
        relLabel: 'Relative Major',
        relValue: minorRelated?.relativeMajor || '',
        domClick: () => { const k = minorRelated?.dominant || ''; handleMinorClick(k, MINOR_ORDER.indexOf(k)); },
        subClick: () => { const k = minorRelated?.subdominant || ''; handleMinorClick(k, MINOR_ORDER.indexOf(k)); },
        relClick: () => { const k = minorRelated?.relativeMajor || ''; handleMajorClick(k, FIFTHS_ORDER.indexOf(k)); },
      }
    : {
        dom: majorRelated?.dominant || '',
        sub: majorRelated?.subdominant || '',
        relLabel: 'Relative Minor',
        relValue: majorRelated?.relative || '',
        domClick: () => { const k = majorRelated?.dominant || ''; handleMajorClick(k, FIFTHS_ORDER.indexOf(k)); },
        subClick: () => { const k = majorRelated?.subdominant || ''; handleMajorClick(k, FIFTHS_ORDER.indexOf(k)); },
        relClick: () => {
          const k = majorRelated?.relative || '';
          handleMinorClick(k, MINOR_ORDER.indexOf(k));
        },
      };

  const majorFontSize = isMobile ? 18 : 14;
  const majorActiveFontSize = isMobile ? 20 : 16;
  const minorFontSize = isMobile ? 14 : 12;
  const dimFontSize = isMobile ? 10 : 8;
  const keySigFontSize = isMobile ? 11 : 9;
  const centerFontSize = isMobile ? 24 : 20;

  const toggleBtnClass = (active: boolean) =>
    `flex items-center gap-1.5 text-xs sm:text-[10px] px-3 py-2 sm:px-2 sm:py-1 rounded border transition-colors touch-manipulation ${
      active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent active:bg-accent'
    }`;

  return (
    <div className="space-y-3 sm:space-y-4">
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
        <div className="flex-1 flex justify-center">
          <svg viewBox="0 0 600 600" className="w-full max-w-[500px]" style={{ touchAction: 'manipulation' }}>
            <circle cx={CX} cy={CY} r={R_OUTER + 5} fill="none" stroke="hsl(var(--border))" strokeWidth={1} opacity={0.3} />

            {/* Major ring */}
            {FIFTHS_ORDER.map((key, i) => {
              const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const pos = textPos((R_OUTER + R_MAJOR) / 2, i);
              const rot = radialRotation(i);
              const active = isActiveKey(key);

              return (
                <g key={`major-${key}`}>
                  <path
                    d={arcPath(R_MAJOR, R_OUTER, startAngle, endAngle)}
                    fill={getMajorFill(key, i)}
                    stroke="hsl(var(--border))" strokeWidth={1.5}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'major', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleMajorClick(key, i)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={active ? majorActiveFontSize : majorFontSize}
                    fontWeight={active ? 700 : 500}
                    fill={active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                    transform={`rotate(${rot}, ${pos.x}, ${pos.y})`}
                    className="pointer-events-none select-none">
                    {key}
                  </text>
                  {showKeySig && (
                    <text x={pos.x} y={pos.y + (isMobile ? 16 : 14)} textAnchor="middle" dominantBaseline="central"
                      fontSize={keySigFontSize} fill="hsl(var(--muted-foreground))" opacity={0.7}
                      transform={`rotate(${rot}, ${pos.x}, ${pos.y + (isMobile ? 16 : 14)})`}
                      className="pointer-events-none select-none">
                      {KEY_SIGNATURES[key]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Minor ring */}
            {MINOR_ORDER.map((key, i) => {
              const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const pos = textPos((R_MAJOR + R_MINOR) / 2, i);
              const rot = radialRotation(i);
              const active = isActiveMinor(key);

              return (
                <g key={`minor-${key}`}>
                  <path
                    d={arcPath(R_MINOR, R_MAJOR, startAngle, endAngle)}
                    fill={getMinorFill(key, i)}
                    stroke="hsl(var(--border))" strokeWidth={1}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'minor', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleMinorClick(key, i)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={minorFontSize} fontWeight={active ? 700 : 400}
                    fill={active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                    transform={`rotate(${rot}, ${pos.x}, ${pos.y})`}
                    className="pointer-events-none select-none">
                    {MINOR_DISPLAY[key] || key}
                  </text>
                </g>
              );
            })}

            {/* Diminished ring */}
            {showDiminished && DIMINISHED_ORDER.map((key, i) => {
              const startAngle = OFFSET + i * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const pos = textPos((R_MINOR + R_DIM) / 2, i);
              const rot = radialRotation(i);
              const isHovered = hoveredSegment?.ring === 'dim' && hoveredSegment.index === i;

              return (
                <g key={`dim-${key}`}>
                  <path
                    d={arcPath(R_DIM, R_MINOR, startAngle, endAngle)}
                    fill={isHovered ? 'hsl(var(--accent))' : 'hsl(var(--muted))'}
                    stroke="hsl(var(--border))" strokeWidth={0.8}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => !isMobile && setHoveredSegment({ ring: 'dim', index: i })}
                    onMouseLeave={() => !isMobile && setHoveredSegment(null)}
                    onClick={() => handleDimClick(key)}
                  />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize={dimFontSize} fontWeight={400}
                    fill="hsl(var(--muted-foreground))"
                    transform={`rotate(${rot}, ${pos.x}, ${pos.y})`}
                    className="pointer-events-none select-none">
                    {key.replace('dim', '°')}
                  </text>
                </g>
              );
            })}

            {/* Center */}
            <circle cx={CX} cy={CY} r={showDiminished ? R_DIM : R_MINOR} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="central"
              fontSize={centerFontSize} fontWeight={700} fill="hsl(var(--foreground))" className="select-none">
              {selectedKey || selectedMinor || FIFTHS_ORDER[rootKeyIdx] || 'C'}
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central"
              fontSize={isMobile ? 12 : 10} fill="hsl(var(--muted-foreground))" className="select-none">
              {selectedMinor ? 'minor' : 'major'}
            </text>
            {showKeySig && (
              <text x={CX} y={CY + (isMobile ? 28 : 24)} textAnchor="middle" dominantBaseline="central"
                fontSize={isMobile ? 13 : 11} fill="hsl(var(--primary))" fontWeight={600} className="select-none">
                {activeKeySig}
              </text>
            )}

            {/* Relationship arrows — work for both major and minor */}
            {showRelated && (() => {
              if (selectedMinor) {
                // Minor key relationships on the minor ring
                const activeIdx = MINOR_ORDER.indexOf(selectedMinor);
                if (activeIdx < 0) return null;
                const domIdx = (activeIdx + 1) % 12;
                const subIdx = (activeIdx + 11) % 12;
                const relMajIdx = activeIdx; // same position on major ring
                const minorMidR = (R_MAJOR + R_MINOR) / 2;
                const majorMidR = (R_OUTER + R_MAJOR) / 2;
                const activePos = textPos(minorMidR, activeIdx);
                const domPos = textPos(minorMidR, domIdx);
                const subPos = textPos(minorMidR, subIdx);
                const relPos = textPos(majorMidR, relMajIdx);

                return (
                  <g className="pointer-events-none">
                    <line x1={activePos.x} y1={activePos.y} x2={domPos.x} y2={domPos.y}
                      stroke="hsl(45, 80%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                    <text x={(activePos.x + domPos.x) / 2} y={(activePos.y + domPos.y) / 2 - 8}
                      textAnchor="middle" fontSize={isMobile ? 10 : 8} fill="hsl(45, 80%, 65%)" fontWeight={600}
                      className="select-none">v</text>
                    <line x1={activePos.x} y1={activePos.y} x2={subPos.x} y2={subPos.y}
                      stroke="hsl(200, 70%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                    <text x={(activePos.x + subPos.x) / 2} y={(activePos.y + subPos.y) / 2 - 8}
                      textAnchor="middle" fontSize={isMobile ? 10 : 8} fill="hsl(200, 70%, 65%)" fontWeight={600}
                      className="select-none">iv</text>
                    <line x1={activePos.x} y1={activePos.y} x2={relPos.x} y2={relPos.y}
                      stroke="hsl(280, 60%, 55%)" strokeWidth={2} strokeDasharray="4,3" opacity={0.6} />
                    <text x={(activePos.x + relPos.x) / 2} y={(activePos.y + relPos.y) / 2 - 8}
                      textAnchor="middle" fontSize={isMobile ? 10 : 8} fill="hsl(280, 60%, 65%)" fontWeight={600}
                      className="select-none">III</text>
                  </g>
                );
              } else {
                // Major key relationships on the major ring
                const aKey = selectedKey || FIFTHS_ORDER[rootKeyIdx] || 'C';
                const activeIdx = FIFTHS_ORDER.indexOf(aKey);
                if (activeIdx < 0) return null;
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
              }
            })()}
          </svg>
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-64 space-y-3">
          {isMobile ? (
            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{activeDisplay}</span>
                <span className="text-[10px] text-primary font-medium">{activeKeySig}</span>
                {showRelated && (
                  <span className="text-[10px] text-muted-foreground">
                    {selectedMinor ? 'v' : 'V'}: {relInfo.dom} · {selectedMinor ? 'iv' : 'IV'}: {relInfo.sub}
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
                    <span className="font-semibold text-foreground">{activeDisplay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signature</span>
                    <span className="font-medium text-foreground">{activeKeySig}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Related Keys</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dominant ({selectedMinor ? 'v' : 'V'})</span>
                    <button onClick={relInfo.domClick}
                      className="font-medium text-amber-400 hover:underline active:underline cursor-pointer touch-manipulation">{relInfo.dom}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdominant ({selectedMinor ? 'iv' : 'IV'})</span>
                    <button onClick={relInfo.subClick}
                      className="font-medium text-sky-400 hover:underline active:underline cursor-pointer touch-manipulation">{relInfo.sub}</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{relInfo.relLabel}</span>
                    <button onClick={relInfo.relClick}
                      className={`font-medium hover:underline active:underline cursor-pointer touch-manipulation ${selectedMinor ? 'text-purple-400' : 'text-rose-400'}`}>
                      {relInfo.relValue}
                    </button>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Diatonic Chords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMinor
                      ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
                      : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
                    ).map((numeral) => (
                      <span key={numeral} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                        {numeral}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Legend</p>
                <div className={`${isMobile ? 'grid grid-cols-2' : 'space-y-1.5'} text-[10px] gap-1.5`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary shrink-0" />
                    <span className="text-foreground">Active key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(45, 80%, 45%)' }} />
                    <span className="text-foreground">Dominant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(200, 70%, 45%)' }} />
                    <span className="text-foreground">Subdominant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(330, 60%, 40%)' }} />
                    <span className="text-foreground">Relative minor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'hsl(280, 60%, 45%)' }} />
                    <span className="text-foreground">Relative major</span>
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
