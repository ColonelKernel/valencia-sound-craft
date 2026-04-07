import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { playChord, type InstrumentTimbre } from "./audioSynth";
import { useIsMobile } from "@/hooks/use-mobile";

type RingType = "major" | "minor" | "dim";

interface HoveredSegment {
  ring: RingType;
  index: number;
}

interface TooltipState {
  visible: boolean;
  left: number;
  top: number;
  title: string;
  subtitle: string;
  keySignature: string;
  relativeLabel: string;
  relativeValue: string;
  chordSummary: string;
}

interface RippleState {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ActiveTarget {
  ring: Exclude<RingType, "dim">;
  index: number;
  key: string;
}

interface RelationshipLine {
  id: string;
  label: string;
  path: string;
  color: string;
  strength: number;
}

interface CircleNode {
  key: string;
  index: number;
  path: string;
  pos: { x: number; y: number };
}

interface ModulationState {
  active: boolean;
  path: number[];
  startTime: number;
  duration: number;
  startRadius: number;
  endRadius: number;
  ring: Exclude<RingType, "dim">;
  shownSteps: number;
}

const FIFTHS_ORDER = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const MINOR_ORDER = ["Am", "Em", "Bm", "F#m", "C#m", "G#m", "Ebm", "Bbm", "Fm", "Cm", "Gm", "Dm"];
const DIMINISHED_ORDER = ["Bdim", "F#dim", "C#dim", "G#dim", "D#dim", "A#dim", "Fdim", "Cdim", "Gdim", "Ddim", "Adim", "Edim"];
const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NOTE_BASES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const CIRCLE_KEY_ALIASES: Record<string, string> = {
  C#: "Db",
  D#: "Eb",
  G#: "Ab",
  A#: "Bb",
  Gb: "F#",
};

const MINOR_DISPLAY: Record<string, string> = {
  Am: "Am",
  Em: "Em",
  Bm: "Bm",
  "F#m": "F#m",
  "C#m": "C#m",
  "G#m": "G#m",
  Ebm: "E♭m",
  Bbm: "B♭m",
  Fm: "Fm",
  Cm: "Cm",
  Gm: "Gm",
  Dm: "Dm",
};

const KEY_SIGNATURES: Record<string, string> = {
  C: "0",
  G: "1♯",
  D: "2♯",
  A: "3♯",
  E: "4♯",
  B: "5♯",
  "F#": "6♯/6♭",
  Db: "5♭",
  Ab: "4♭",
  Eb: "3♭",
  Bb: "2♭",
  F: "1♭",
};

const MINOR_KEY_SIGNATURES: Record<string, string> = {
  Am: "0",
  Em: "1♯",
  Bm: "2♯",
  "F#m": "3♯",
  "C#m": "4♯",
  "G#m": "5♯",
  Ebm: "6♭",
  Bbm: "5♭",
  Fm: "4♭",
  Cm: "3♭",
  Gm: "2♭",
  Dm: "1♭",
};

const HARMONIC_COLORS = {
  tonic: "hsl(208 90% 62%)",
  tonicText: "hsl(215 100% 98%)",
  dominant: "hsl(24 95% 60%)",
  subdominant: "hsl(152 52% 48%)",
  relativeMinor: "hsl(330 68% 57%)",
  relativeMajor: "hsl(281 67% 62%)",
  neutral: "hsl(var(--card))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  border: "hsl(var(--border))",
  foreground: "hsl(var(--foreground))",
  mutedForeground: "hsl(var(--muted-foreground))",
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const NODE_TRANSITION = `transform 220ms ${EASE}, opacity 220ms ${EASE}, filter 220ms ${EASE}, fill 220ms ${EASE}, stroke 220ms ${EASE}`;

const CX = 300;
const CY = 300;
const R_OUTER = 260;
const R_MAJOR = 210;
const R_MINOR = 160;
const R_DIM = 120;
const SEGMENT_ANGLE = (2 * Math.PI) / 12;
const OFFSET = -Math.PI / 2;
const MAJOR_TEXT_RADIUS = (R_OUTER + R_MAJOR) / 2;
const MINOR_TEXT_RADIUS = (R_MAJOR + R_MINOR) / 2;
const DIM_TEXT_RADIUS = (R_MINOR + R_DIM) / 2;
const VIEWBOX_SIZE = 600;

function parseRootSymbol(symbol: string): string {
  return symbol.replace(/m$/, "").replace(/dim$/, "");
}

function getSemitone(note: string): number {
  const letter = note[0];
  const accidental = note.slice(1);
  const base = NOTE_BASES[letter];
  const accidentalOffset = accidental.split("").reduce((sum, char) => {
    if (char === "#") return sum + 1;
    if (char === "b") return sum - 1;
    return sum;
  }, 0);
  return (base + accidentalOffset + 120) % 12;
}

function spellChordTone(root: string, semitoneOffset: number, letterOffset: number): string {
  const cleanRoot = parseRootSymbol(root);
  const rootLetter = cleanRoot[0] as typeof LETTER_ORDER[number];
  const rootLetterIndex = LETTER_ORDER.indexOf(rootLetter);
  const targetLetter = LETTER_ORDER[(rootLetterIndex + letterOffset) % LETTER_ORDER.length];
  const targetSemitone = (getSemitone(cleanRoot) + semitoneOffset) % 12;
  const naturalSemitone = NOTE_BASES[targetLetter];
  const diff = (targetSemitone - naturalSemitone + 12) % 12;

  if (diff === 0) return targetLetter;
  if (diff === 1) return `${targetLetter}#`;
  if (diff === 2) return `${targetLetter}##`;
  if (diff === 11) return `${targetLetter}b`;
  if (diff === 10) return `${targetLetter}bb`;

  return cleanRoot;
}

function buildTriad(root: string, quality: "major" | "minor" | "dim"): string[] {
  const intervals =
    quality === "major"
      ? [0, 4, 7]
      : quality === "minor"
        ? [0, 3, 7]
        : [0, 3, 6];

  return intervals.map((interval, index) => spellChordTone(root, interval, index * 2));
}

function majorTriad(root: string): string[] {
  return buildTriad(root, "major");
}

function minorTriad(root: string): string[] {
  return buildTriad(root, "minor");
}

function dimTriad(root: string): string[] {
  return buildTriad(root, "dim");
}

function getRelatedKeysMajor(key: string) {
  const idx = FIFTHS_ORDER.indexOf(key);
  if (idx < 0) return { dominant: "", subdominant: "", relative: "" };
  return {
    dominant: FIFTHS_ORDER[(idx + 1) % 12],
    subdominant: FIFTHS_ORDER[(idx + 11) % 12],
    relative: MINOR_ORDER[idx],
  };
}

function getRelatedKeysMinor(key: string) {
  const idx = MINOR_ORDER.indexOf(key);
  if (idx < 0) return { dominant: "", subdominant: "", relativeMajor: "" };
  return {
    dominant: MINOR_ORDER[(idx + 1) % 12],
    subdominant: MINOR_ORDER[(idx + 11) % 12],
    relativeMajor: FIFTHS_ORDER[idx],
  };
}

function wrapIndex(index: number, size = 12): number {
  return (index + size) % size;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function getNodePoint(radius: number, index: number) {
  const angle = OFFSET + index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
    angleDeg: (angle * 180) / Math.PI,
  };
}

function buildArcPath(innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const x1 = CX + outerR * Math.cos(startAngle);
  const y1 = CY + outerR * Math.sin(startAngle);
  const x2 = CX + outerR * Math.cos(endAngle);
  const y2 = CY + outerR * Math.sin(endAngle);
  const x3 = CX + innerR * Math.cos(endAngle);
  const y3 = CY + innerR * Math.sin(endAngle);
  const x4 = CX + innerR * Math.cos(startAngle);
  const y4 = CY + innerR * Math.sin(startAngle);
  return `M${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 0,0 ${x4},${y4} Z`;
}

function getShortestPathIndices(start: number, target: number, size = 12) {
  if (start === target) return [target];

  const clockwiseDistance = (target - start + size) % size;
  const counterDistance = (start - target + size) % size;
  const direction = clockwiseDistance <= counterDistance ? 1 : -1;
  const steps = Math.min(clockwiseDistance, counterDistance);
  const path = [start];

  for (let i = 1; i <= steps; i++) {
    path.push(wrapIndex(start + i * direction, size));
  }

  return path;
}

function buildRelationshipPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midpointX = (from.x + to.x) / 2;
  const midpointY = (from.y + to.y) / 2;
  const controlX = lerp(midpointX, CX, 0.4);
  const controlY = lerp(midpointY, CY, 0.4);
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function getRingRadius(ring: Exclude<RingType, "dim">) {
  return ring === "major" ? MAJOR_TEXT_RADIUS : MINOR_TEXT_RADIUS;
}

function getChordSummary(ring: RingType, key: string) {
  const notes = ring === "major" ? majorTriad(key) : ring === "minor" ? minorTriad(key) : dimTriad(key);
  const quality = ring === "major" ? "Major" : ring === "minor" ? "Minor" : "Diminished";
  return {
    notes,
    label: `${quality} triad`,
  };
}

function getSegmentTransform(pos: { x: number; y: number }, scale: number) {
  return `translate(${pos.x} ${pos.y}) scale(${scale}) translate(${-pos.x} ${-pos.y})`;
}

interface CircleOfFifthsProps {
  scaleNotes?: string[];
  root?: string;
  timbre?: InstrumentTimbre;
  bpm?: number;
  playing?: boolean;
  onAddToProgression?: (notes: string[], symbol: string) => void;
  onSelectKey?: (root: string, mode: string) => void;
}

const CircleOfFifths = ({
  scaleNotes = [],
  root = "C",
  timbre = "piano",
  bpm = 96,
  playing = false,
  onAddToProgression,
  onSelectKey,
}: CircleOfFifthsProps) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMinor, setSelectedMinor] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<HoveredSegment | null>(null);
  const [showRelated, setShowRelated] = useState(true);
  const [showKeySig, setShowKeySig] = useState(true);
  const [showDiminished, setShowDiminished] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const [modulationTrail, setModulationTrail] = useState<number[]>([]);
  const [modulationRing, setModulationRing] = useState<Exclude<RingType, "dim">>("major");

  const isMobile = useIsMobile();
  const defaultMajorKey = useMemo(() => CIRCLE_KEY_ALIASES[root] || root, [root]);

  const svgShellRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const idleGlowRef = useRef<SVGCircleElement | null>(null);
  const ambientOrbitRef = useRef<SVGGElement | null>(null);
  const selectionPulseRef = useRef<SVGCircleElement | null>(null);
  const playheadRef = useRef<SVGGElement | null>(null);
  const modulationMarkerRef = useRef<SVGCircleElement | null>(null);
  const tooltipHideTimerRef = useRef<number | null>(null);
  const rippleIdRef = useRef(0);
  const auditionPulseUntilRef = useRef(0);
  const bpmRef = useRef(bpm);
  const playingRef = useRef(playing);
  const previousTargetRef = useRef<ActiveTarget | null>(null);
  const modulationStateRef = useRef<ModulationState | null>(null);
  const relationshipLineRefs = useRef<Record<string, SVGPathElement | null>>({});

  const majorNodes = useMemo<CircleNode[]>(
    () =>
      FIFTHS_ORDER.map((key, index) => {
        const startAngle = OFFSET + index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
        const endAngle = startAngle + SEGMENT_ANGLE;
        return {
          key,
          index,
          path: buildArcPath(R_MAJOR, R_OUTER, startAngle, endAngle),
          pos: getNodePoint(MAJOR_TEXT_RADIUS, index),
        };
      }),
    []
  );

  const minorNodes = useMemo<CircleNode[]>(
    () =>
      MINOR_ORDER.map((key, index) => {
        const startAngle = OFFSET + index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
        const endAngle = startAngle + SEGMENT_ANGLE;
        return {
          key,
          index,
          path: buildArcPath(R_MINOR, R_MAJOR, startAngle, endAngle),
          pos: getNodePoint(MINOR_TEXT_RADIUS, index),
        };
      }),
    []
  );

  const dimNodes = useMemo<CircleNode[]>(
    () =>
      DIMINISHED_ORDER.map((key, index) => {
        const startAngle = OFFSET + index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
        const endAngle = startAngle + SEGMENT_ANGLE;
        return {
          key,
          index,
          path: buildArcPath(R_DIM, R_MINOR, startAngle, endAngle),
          pos: getNodePoint(DIM_TEXT_RADIUS, index),
        };
      }),
    []
  );

  const activeTarget = useMemo<ActiveTarget>(() => {
    if (selectedMinor) {
      return { ring: "minor", index: MINOR_ORDER.indexOf(selectedMinor), key: selectedMinor };
    }

    const resolvedKey = selectedKey || defaultMajorKey || "C";
    return { ring: "major", index: FIFTHS_ORDER.indexOf(resolvedKey), key: resolvedKey };
  }, [selectedKey, selectedMinor, defaultMajorKey]);

  const activeDisplay = selectedMinor || `${activeTarget.key} major`;
  const activeKeySig = selectedMinor
    ? MINOR_KEY_SIGNATURES[selectedMinor] || ""
    : KEY_SIGNATURES[activeTarget.key] || "";

  const majorRelated = useMemo(() => {
    if (selectedMinor) return null;
    return getRelatedKeysMajor(activeTarget.key);
  }, [selectedMinor, activeTarget.key]);

  const minorRelated = useMemo(() => {
    if (!selectedMinor) return null;
    return getRelatedKeysMinor(selectedMinor);
  }, [selectedMinor]);

  const activeChordSummary = useMemo(() => {
    if (selectedMinor) return getChordSummary("minor", selectedMinor);
    return getChordSummary("major", activeTarget.key);
  }, [selectedMinor, activeTarget.key]);

  const modulationTrailSet = useMemo(() => new Set(modulationTrail), [modulationTrail]);

  const hoveredNeighbors = useMemo(() => {
    const neighbors = {
      major: new Set<number>(),
      minor: new Set<number>(),
      dim: new Set<number>(),
    };

    if (!hoveredSegment) return neighbors;

    const add = (ring: RingType, index: number) => {
      neighbors[ring].add(wrapIndex(index));
    };

    add(hoveredSegment.ring, hoveredSegment.index);

    if (hoveredSegment.ring === "major") {
      add("major", hoveredSegment.index - 1);
      add("major", hoveredSegment.index + 1);
      add("minor", hoveredSegment.index);
    }

    if (hoveredSegment.ring === "minor") {
      add("minor", hoveredSegment.index - 1);
      add("minor", hoveredSegment.index + 1);
      add("major", hoveredSegment.index);
      add("dim", hoveredSegment.index);
    }

    if (hoveredSegment.ring === "dim") {
      add("minor", hoveredSegment.index);
    }

    return neighbors;
  }, [hoveredSegment]);

  const relationshipLines = useMemo<RelationshipLine[]>(() => {
    if (!showRelated || activeTarget.index < 0) return [];

    if (selectedMinor) {
      const tonic = getNodePoint(MINOR_TEXT_RADIUS, activeTarget.index);
      const dominantIndex = MINOR_ORDER.indexOf(minorRelated?.dominant || "");
      const subdominantIndex = MINOR_ORDER.indexOf(minorRelated?.subdominant || "");
      const relativeIndex = FIFTHS_ORDER.indexOf(minorRelated?.relativeMajor || "");
      const lines: RelationshipLine[] = [];

      if (dominantIndex >= 0) {
        lines.push({
          id: "minor-dominant",
          label: "v",
          path: buildRelationshipPath(tonic, getNodePoint(MINOR_TEXT_RADIUS, dominantIndex)),
          color: HARMONIC_COLORS.dominant,
          strength: 1,
        });
      }

      if (subdominantIndex >= 0) {
        lines.push({
          id: "minor-subdominant",
          label: "iv",
          path: buildRelationshipPath(tonic, getNodePoint(MINOR_TEXT_RADIUS, subdominantIndex)),
          color: HARMONIC_COLORS.subdominant,
          strength: 0.85,
        });
      }

      if (relativeIndex >= 0) {
        lines.push({
          id: "minor-relative",
          label: "III",
          path: buildRelationshipPath(tonic, getNodePoint(MAJOR_TEXT_RADIUS, relativeIndex)),
          color: HARMONIC_COLORS.relativeMajor,
          strength: 0.65,
        });
      }

      return lines;
    }

    const tonic = getNodePoint(MAJOR_TEXT_RADIUS, activeTarget.index);
    const dominantIndex = FIFTHS_ORDER.indexOf(majorRelated?.dominant || "");
    const subdominantIndex = FIFTHS_ORDER.indexOf(majorRelated?.subdominant || "");
    const relativeIndex = MINOR_ORDER.indexOf(majorRelated?.relative || "");
    const lines: RelationshipLine[] = [];

    if (dominantIndex >= 0) {
      lines.push({
        id: "major-dominant",
        label: "V",
        path: buildRelationshipPath(tonic, getNodePoint(MAJOR_TEXT_RADIUS, dominantIndex)),
        color: HARMONIC_COLORS.dominant,
        strength: 1,
      });
    }

    if (subdominantIndex >= 0) {
      lines.push({
        id: "major-subdominant",
        label: "IV",
        path: buildRelationshipPath(tonic, getNodePoint(MAJOR_TEXT_RADIUS, subdominantIndex)),
        color: HARMONIC_COLORS.subdominant,
        strength: 0.85,
      });
    }

    if (relativeIndex >= 0) {
      lines.push({
        id: "major-relative",
        label: "vi",
        path: buildRelationshipPath(tonic, getNodePoint(MINOR_TEXT_RADIUS, relativeIndex)),
        color: HARMONIC_COLORS.relativeMinor,
        strength: 0.65,
      });
    }

    return lines;
  }, [showRelated, selectedMinor, activeTarget, majorRelated, minorRelated]);

  const majorFontSize = isMobile ? 18 : 14;
  const majorActiveFontSize = isMobile ? 20 : 16;
  const minorFontSize = isMobile ? 14 : 12;
  const dimFontSize = isMobile ? 10 : 8;
  const keySigFontSize = isMobile ? 11 : 9;
  const centerFontSize = isMobile ? 24 : 20;

  function triggerRipple(pos: { x: number; y: number }, color: string) {
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x: pos.x, y: pos.y, color }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 720);
  }

  function queueAuditionPulse() {
    const pulseLength = (60000 / Math.max(48, bpmRef.current)) * 6;
    auditionPulseUntilRef.current = performance.now() + pulseLength;
  }

  const showTooltipForNode = useCallback(
    (ring: RingType, key: string, pos: { x: number; y: number }) => {
      if (isMobile || !svgShellRef.current) return;

      if (tooltipHideTimerRef.current) {
        clearTimeout(tooltipHideTimerRef.current);
        tooltipHideTimerRef.current = null;
      }

      const rect = svgShellRef.current.getBoundingClientRect();
      const chord = getChordSummary(ring, key);
      const left = (pos.x / VIEWBOX_SIZE) * rect.width;
      const top = (pos.y / VIEWBOX_SIZE) * rect.height;
      const majorInfo = ring === "major" ? getRelatedKeysMajor(key) : null;
      const minorInfo = ring === "minor" ? getRelatedKeysMinor(key) : null;

      setTooltip({
        visible: true,
        left,
        top,
        title: ring === "major" ? `${key} major` : ring === "minor" ? `${MINOR_DISPLAY[key] || key}` : key.replace("dim", "°"),
        subtitle: chord.label,
        keySignature: ring === "major" ? KEY_SIGNATURES[key] || "" : ring === "minor" ? MINOR_KEY_SIGNATURES[key] || "" : "Leading-tone color",
        relativeLabel: ring === "major" ? "Relative minor" : ring === "minor" ? "Relative major" : "Function",
        relativeValue:
          ring === "major"
            ? majorInfo?.relative || "iiø context"
            : ring === "minor"
              ? minorInfo?.relativeMajor || "Tension pivot"
              : "Resolution / tension",
        chordSummary: chord.notes.join(" • "),
      });
    },
    [isMobile]
  );

  const hideTooltip = useCallback(() => {
    if (isMobile) return;

    setTooltip((current) => (current ? { ...current, visible: false } : current));
    tooltipHideTimerRef.current = window.setTimeout(() => {
      setTooltip(null);
      tooltipHideTimerRef.current = null;
    }, 180);
  }, [isMobile]);

  const handleMajorClick = useCallback(
    (key: string, index: number) => {
      if (!key || index < 0) return;
      setSelectedKey((current) => (current === key ? null : key));
      setSelectedMinor(null);
      const notes = majorTriad(key);
      playChord(notes, 0.6, timbre);
      onAddToProgression?.(notes, key);
      onSelectKey?.(key, "Ionian");
      queueAuditionPulse();
      triggerRipple(majorNodes[index].pos, HARMONIC_COLORS.tonic);
    },
    [majorNodes, onAddToProgression, onSelectKey, timbre]
  );

  const handleMinorClick = useCallback(
    (key: string, index: number) => {
      if (!key || index < 0) return;
      setSelectedMinor((current) => (current === key ? null : key));
      setSelectedKey(null);
      const notes = minorTriad(key);
      playChord(notes, 0.6, timbre);
      onAddToProgression?.(notes, key);
      onSelectKey?.(parseRootSymbol(key), "Aeolian");
      queueAuditionPulse();
      triggerRipple(minorNodes[index].pos, HARMONIC_COLORS.relativeMinor);
    },
    [minorNodes, onAddToProgression, onSelectKey, timbre]
  );

  const handleDimClick = useCallback(
    (key: string, index: number) => {
      if (!key || index < 0) return;
      const notes = dimTriad(key);
      playChord(notes, 0.5, timbre);
      onAddToProgression?.(notes, key);
      queueAuditionPulse();
      triggerRipple(dimNodes[index].pos, "hsl(218 20% 70%)");
    },
    [dimNodes, onAddToProgression, timbre]
  );

  const handleReset = useCallback(() => {
    setSelectedKey(null);
    setSelectedMinor(null);
    setHoveredSegment(null);
    setModulationTrail([]);
    setRipples([]);
    hideTooltip();
  }, [hideTooltip]);

  const isActiveKey = useCallback(
    (key: string) => selectedMinor === null && activeTarget.ring === "major" && activeTarget.key === key,
    [selectedMinor, activeTarget]
  );

  const isActiveMinor = useCallback(
    (key: string) => selectedMinor !== null && activeTarget.ring === "minor" && activeTarget.key === key,
    [selectedMinor, activeTarget]
  );

  const relInfo = selectedMinor
    ? {
        dom: minorRelated?.dominant || "",
        sub: minorRelated?.subdominant || "",
        relLabel: "Relative Major",
        relValue: minorRelated?.relativeMajor || "",
        domClick: () => {
          const key = minorRelated?.dominant || "";
          handleMinorClick(key, MINOR_ORDER.indexOf(key));
        },
        subClick: () => {
          const key = minorRelated?.subdominant || "";
          handleMinorClick(key, MINOR_ORDER.indexOf(key));
        },
        relClick: () => {
          const key = minorRelated?.relativeMajor || "";
          handleMajorClick(key, FIFTHS_ORDER.indexOf(key));
        },
      }
    : {
        dom: majorRelated?.dominant || "",
        sub: majorRelated?.subdominant || "",
        relLabel: "Relative Minor",
        relValue: majorRelated?.relative || "",
        domClick: () => {
          const key = majorRelated?.dominant || "";
          handleMajorClick(key, FIFTHS_ORDER.indexOf(key));
        },
        subClick: () => {
          const key = majorRelated?.subdominant || "";
          handleMajorClick(key, FIFTHS_ORDER.indexOf(key));
        },
        relClick: () => {
          const key = majorRelated?.relative || "";
          handleMinorClick(key, MINOR_ORDER.indexOf(key));
        },
      };

  const getMajorNodeStyle = useCallback(
    (key: string, index: number) => {
      const active = isActiveKey(key);
      const hovered = hoveredSegment?.ring === "major" && hoveredSegment.index === index;
      const hoverNeighbor = hoveredNeighbors.major.has(index);
      const inTrail = modulationRing === "major" && modulationTrailSet.has(index);
      let fill = HARMONIC_COLORS.neutral;
      let filter = "";
      let scale = 1;
      let textFill = HARMONIC_COLORS.foreground;

      if (showRelated && majorRelated?.dominant === key) {
        fill = HARMONIC_COLORS.dominant;
        filter = "url(#dominant-glow)";
      } else if (showRelated && majorRelated?.subdominant === key) {
        fill = HARMONIC_COLORS.subdominant;
        filter = "url(#subdominant-glow)";
      } else if (showRelated && minorRelated?.relativeMajor === key) {
        fill = HARMONIC_COLORS.relativeMajor;
        filter = "url(#relative-glow)";
      }

      if (hoverNeighbor && !active) {
        scale = hovered ? 1.16 : 1.08;
        filter = hovered ? "url(#hover-glow)" : filter || "url(#neighbor-glow)";
      }

      if (hovered && !active) {
        fill = HARMONIC_COLORS.accent;
      }

      if (inTrail && !active) {
        fill = "hsl(208 90% 62% / 0.48)";
        filter = "url(#trail-glow)";
      }

      if (active) {
        fill = HARMONIC_COLORS.tonic;
        textFill = HARMONIC_COLORS.tonicText;
        filter = "url(#tonic-glow)";
        scale = hovered ? 1.18 : 1.1;
      }

      return { fill, filter, scale, textFill };
    },
    [hoveredSegment, hoveredNeighbors.major, modulationRing, modulationTrailSet, showRelated, majorRelated, minorRelated, isActiveKey]
  );

  const getMinorNodeStyle = useCallback(
    (key: string, index: number) => {
      const active = isActiveMinor(key);
      const hovered = hoveredSegment?.ring === "minor" && hoveredSegment.index === index;
      const hoverNeighbor = hoveredNeighbors.minor.has(index);
      const inTrail = modulationRing === "minor" && modulationTrailSet.has(index);
      let fill = HARMONIC_COLORS.secondary;
      let filter = "";
      let scale = 1;
      let textFill = HARMONIC_COLORS.foreground;

      if (showRelated && majorRelated?.relative === key) {
        fill = HARMONIC_COLORS.relativeMinor;
        filter = "url(#relative-glow)";
      } else if (showRelated && minorRelated?.dominant === key) {
        fill = HARMONIC_COLORS.dominant;
        filter = "url(#dominant-glow)";
      } else if (showRelated && minorRelated?.subdominant === key) {
        fill = HARMONIC_COLORS.subdominant;
        filter = "url(#subdominant-glow)";
      }

      if (hoverNeighbor && !active) {
        scale = hovered ? 1.15 : 1.07;
        filter = hovered ? "url(#hover-glow)" : filter || "url(#neighbor-glow)";
      }

      if (hovered && !active) {
        fill = HARMONIC_COLORS.accent;
      }

      if (inTrail && !active) {
        fill = "hsl(330 68% 57% / 0.45)";
        filter = "url(#trail-glow)";
      }

      if (active) {
        fill = HARMONIC_COLORS.tonic;
        textFill = HARMONIC_COLORS.tonicText;
        filter = "url(#tonic-glow)";
        scale = hovered ? 1.16 : 1.09;
      }

      return { fill, filter, scale, textFill };
    },
    [hoveredSegment, hoveredNeighbors.minor, modulationRing, modulationTrailSet, showRelated, majorRelated, minorRelated, isActiveMinor]
  );

  const getDimNodeStyle = useCallback(
    (index: number) => {
      const hovered = hoveredSegment?.ring === "dim" && hoveredSegment.index === index;
      const hoverNeighbor = hoveredNeighbors.dim.has(index);
      return {
        fill: hovered ? "hsl(218 20% 56%)" : hoverNeighbor ? "hsl(218 18% 42%)" : HARMONIC_COLORS.muted,
        filter: hovered ? "url(#hover-glow)" : hoverNeighbor ? "url(#neighbor-glow)" : "",
        scale: hovered ? 1.12 : hoverNeighbor ? 1.05 : 1,
      };
    },
    [hoveredSegment, hoveredNeighbors.dim]
  );

  const activeNodePoint = useMemo(() => {
    if (activeTarget.index < 0) return null;
    const radius = activeTarget.ring === "major" ? MAJOR_TEXT_RADIUS : MINOR_TEXT_RADIUS;
    return getNodePoint(radius, activeTarget.index);
  }, [activeTarget]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (activeTarget.index < 0) return;

    const previous = previousTargetRef.current;
    if (!previous) {
      previousTargetRef.current = activeTarget;
      return;
    }

    if (previous.index === activeTarget.index && previous.ring === activeTarget.ring) {
      return;
    }

    const path = getShortestPathIndices(previous.index, activeTarget.index);
    modulationStateRef.current = {
      active: true,
      path,
      startTime: performance.now(),
      duration: 720,
      startRadius: getRingRadius(previous.ring),
      endRadius: getRingRadius(activeTarget.ring),
      ring: activeTarget.ring,
      shownSteps: 0,
    };

    setModulationRing(activeTarget.ring);
    setModulationTrail(path.slice(0, 1));
    previousTargetRef.current = activeTarget;
    queueAuditionPulse();
  }, [activeTarget]);

  useEffect(() => {
    const animate = (now: number) => {
      const idlePhase = 0.5 + 0.5 * Math.sin(now * 0.00125);
      const beatMs = 60000 / Math.max(48, bpmRef.current || 96);
      const beatPhase = (now % beatMs) / beatMs;
      const barPhase = ((now / beatMs) % 4) / 4;
      const visualPulseActive = playingRef.current || now < auditionPulseUntilRef.current;
      const pulse = visualPulseActive ? 0.5 + 0.5 * Math.sin(beatPhase * Math.PI * 2) : idlePhase * 0.35;

      if (idleGlowRef.current) {
        idleGlowRef.current.setAttribute("opacity", `${0.12 + pulse * 0.16}`);
        idleGlowRef.current.setAttribute("r", `${R_OUTER + 16 + pulse * 10}`);
      }

      if (ambientOrbitRef.current) {
        const drift = now * 0.0012;
        ambientOrbitRef.current.setAttribute("transform", `rotate(${drift.toFixed(3)} ${CX} ${CY})`);
        ambientOrbitRef.current.style.opacity = `${0.38 + idlePhase * 0.12}`;
      }

      if (selectionPulseRef.current && activeNodePoint) {
        selectionPulseRef.current.setAttribute("cx", `${activeNodePoint.x}`);
        selectionPulseRef.current.setAttribute("cy", `${activeNodePoint.y}`);
        selectionPulseRef.current.setAttribute("r", `${22 + pulse * 10}`);
        selectionPulseRef.current.setAttribute("opacity", `${visualPulseActive ? 0.48 + pulse * 0.18 : 0.24 + idlePhase * 0.08}`);
      }

      if (playheadRef.current) {
        const angle = barPhase * 360 - 90;
        playheadRef.current.setAttribute("transform", `rotate(${angle.toFixed(3)} ${CX} ${CY})`);
        playheadRef.current.style.opacity = visualPulseActive ? "0.72" : "0.16";
      }

      Object.values(relationshipLineRefs.current).forEach((line) => {
        if (!line) return;
        const strength = Number(line.dataset.strength || "0.8");
        line.style.strokeDashoffset = `${-(now * 0.022 * strength)}`;
        line.style.opacity = `${0.18 + strength * 0.36 + (visualPulseActive ? pulse * 0.14 : idlePhase * 0.08)}`;
      });

      const modulation = modulationStateRef.current;
      if (modulation?.active && modulationMarkerRef.current) {
        const elapsed = now - modulation.startTime;
        const progress = Math.min(1, elapsed / modulation.duration);
        const scaledProgress = progress * Math.max(1, modulation.path.length - 1);
        const baseIndex = Math.min(modulation.path.length - 1, Math.floor(scaledProgress));
        const nextIndex = Math.min(modulation.path.length - 1, baseIndex + 1);
        const blend = scaledProgress - baseIndex;
        const fromPoint = getNodePoint(lerp(modulation.startRadius, modulation.endRadius, progress), modulation.path[baseIndex]);
        const toPoint = getNodePoint(lerp(modulation.startRadius, modulation.endRadius, progress), modulation.path[nextIndex]);
        const x = lerp(fromPoint.x, toPoint.x, blend);
        const y = lerp(fromPoint.y, toPoint.y, blend);
        const visibleSteps = Math.min(modulation.path.length, Math.floor(scaledProgress) + 2);

        if (visibleSteps !== modulation.shownSteps) {
          modulation.shownSteps = visibleSteps;
          setModulationTrail(modulation.path.slice(0, visibleSteps));
        }

        modulationMarkerRef.current.setAttribute("cx", `${x}`);
        modulationMarkerRef.current.setAttribute("cy", `${y}`);
        modulationMarkerRef.current.setAttribute("opacity", `${0.78 - progress * 0.28}`);
        modulationMarkerRef.current.setAttribute("r", `${10 + (1 - progress) * 8}`);

        if (progress >= 1) {
          modulation.active = false;
          modulationMarkerRef.current.setAttribute("opacity", "0");
          window.setTimeout(() => setModulationTrail([]), 150);
        }
      } else if (modulationMarkerRef.current) {
        modulationMarkerRef.current.setAttribute("opacity", "0");
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (tooltipHideTimerRef.current) {
        clearTimeout(tooltipHideTimerRef.current);
      }
    };
  }, [activeNodePoint]);

  const toggleBtnClass = (active: boolean) =>
    `flex items-center gap-1.5 text-xs sm:text-[10px] px-3 py-2 sm:px-2 sm:py-1 rounded border transition-colors touch-manipulation ${
      active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-accent active:bg-accent"
    }`;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Circle of Fifths</h3>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs px-3 py-2 sm:px-2 sm:py-1 rounded border border-border text-muted-foreground hover:bg-accent active:bg-accent transition-colors touch-manipulation"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowKeySig((current) => !current)} className={toggleBtnClass(showKeySig)}>
            {showKeySig ? <Eye size={12} /> : <EyeOff size={12} />} Key Sig
          </button>
          <button onClick={() => setShowRelated((current) => !current)} className={toggleBtnClass(showRelated)}>
            Related Keys
          </button>
          <button onClick={() => setShowDiminished((current) => !current)} className={toggleBtnClass(showDiminished)}>
            vii° Ring
          </button>
        </div>
      </div>

      {!isMobile && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
          Explore harmony like an instrument. Hover for chord context, click to audition and modulate, and follow the animated
          relationship lines between tonic, dominant, subdominant, and relative keys.
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        <div className="flex-1 flex justify-center">
          <div ref={svgShellRef} className="relative w-full max-w-[500px]">
            {tooltip && (
              <div
                className="pointer-events-none absolute z-20 w-48 rounded-xl border border-white/10 bg-slate-950/92 px-3 py-2 shadow-2xl backdrop-blur-md"
                style={{
                  left: tooltip.left,
                  top: tooltip.top,
                  transform: "translate(-50%, calc(-100% - 14px))",
                  opacity: tooltip.visible ? 1 : 0,
                  transition: `opacity 180ms ${EASE}, transform 180ms ${EASE}`,
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{tooltip.subtitle}</p>
                <p className="mt-1 text-sm font-semibold text-white">{tooltip.title}</p>
                <div className="mt-2 space-y-1 text-[11px] text-slate-200">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Signature</span>
                    <span>{tooltip.keySignature}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">{tooltip.relativeLabel}</span>
                    <span>{tooltip.relativeValue}</span>
                  </div>
                  <div className="pt-1 text-slate-300">{tooltip.chordSummary}</div>
                </div>
              </div>
            )}

            <svg viewBox="0 0 600 600" className="w-full" style={{ touchAction: "manipulation" }}>
              <defs>
                <radialGradient id="circle-idle-gradient">
                  <stop offset="0%" stopColor="hsl(208 90% 62% / 0.36)" />
                  <stop offset="60%" stopColor="hsl(208 90% 62% / 0.08)" />
                  <stop offset="100%" stopColor="hsl(208 90% 62% / 0)" />
                </radialGradient>
                <filter id="tonic-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.1  0 1 0 0 0.45  0 0 1 0 1  0 0 0 1 0"
                  />
                </filter>
                <filter id="dominant-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.92  0 1 0 0 0.32  0 0 1 0 0.05  0 0 0 1 0"
                  />
                </filter>
                <filter id="subdominant-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.18  0 1 0 0 0.72  0 0 1 0 0.45  0 0 0 1 0"
                  />
                </filter>
                <filter id="relative-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.64  0 1 0 0 0.18  0 0 1 0 0.92  0 0 0 1 0"
                  />
                </filter>
                <filter id="hover-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.92  0 1 0 0 0.96  0 0 1 0 0.55  0 0 0 1 0"
                  />
                </filter>
                <filter id="neighbor-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="5.5" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.42  0 1 0 0 0.52  0 0 1 0 0.9  0 0 0 1 0"
                  />
                </filter>
                <filter id="trail-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0.28  0 1 0 0 0.62  0 0 1 0 1  0 0 0 1 0"
                  />
                </filter>
              </defs>

              <circle ref={idleGlowRef} cx={CX} cy={CY} r={R_OUTER + 20} fill="url(#circle-idle-gradient)" opacity={0.18} />

              <g ref={ambientOrbitRef} className="pointer-events-none">
                <circle cx={CX} cy={CY} r={R_OUTER + 18} fill="none" stroke="hsl(208 80% 64% / 0.24)" strokeWidth={1.4} strokeDasharray="6 14" />
                <circle cx={CX} cy={CY} r={R_MAJOR - 14} fill="none" stroke="hsl(24 95% 60% / 0.18)" strokeWidth={1.2} strokeDasharray="2 14" />
              </g>

              <g className="pointer-events-none">
                {relationshipLines.map((line) => (
                  <path
                    key={line.id}
                    ref={(node) => {
                      relationshipLineRefs.current[line.id] = node;
                    }}
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={1.8 + line.strength * 0.8}
                    strokeLinecap="round"
                    strokeDasharray={line.id.includes("relative") ? "8 13" : "13 14"}
                    data-strength={line.strength}
                    style={{ opacity: 0.32, transition: `opacity 220ms ${EASE}` }}
                  />
                ))}
              </g>

              <g ref={playheadRef} className="pointer-events-none" opacity={0.12}>
                <line x1={CX} y1={CY} x2={CX} y2={CY - (R_OUTER + 6)} stroke="hsl(208 90% 72% / 0.65)" strokeWidth={2} strokeLinecap="round" />
                <circle cx={CX} cy={CY - (R_OUTER + 6)} r={6} fill="hsl(208 90% 70%)" />
              </g>

              <circle cx={CX} cy={CY} r={R_OUTER + 5} fill="none" stroke={HARMONIC_COLORS.border} strokeWidth={1} opacity={0.3} />

              {majorNodes.map((node) => {
                const nodeStyle = getMajorNodeStyle(node.key, node.index);
                const active = isActiveKey(node.key);

                return (
                  <g
                    key={`major-${node.key}`}
                    transform={getSegmentTransform(node.pos, nodeStyle.scale)}
                    style={{ transition: NODE_TRANSITION }}
                  >
                    <path
                      d={node.path}
                      fill={nodeStyle.fill}
                      stroke={HARMONIC_COLORS.border}
                      strokeWidth={active ? 2 : 1.35}
                      filter={nodeStyle.filter || undefined}
                      className="cursor-pointer"
                      style={{ transition: NODE_TRANSITION }}
                      onMouseEnter={() => {
                        if (!isMobile) {
                          setHoveredSegment({ ring: "major", index: node.index });
                          showTooltipForNode("major", node.key, node.pos);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) {
                          setHoveredSegment(null);
                          hideTooltip();
                        }
                      }}
                      onClick={() => handleMajorClick(node.key, node.index)}
                    />
                    <text
                      x={node.pos.x}
                      y={node.pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={active ? majorActiveFontSize : majorFontSize}
                      fontWeight={active ? 700 : 520}
                      fill={nodeStyle.textFill}
                      className="pointer-events-none select-none"
                    >
                      {node.key}
                    </text>
                    {showKeySig && (
                      <text
                        x={node.pos.x}
                        y={node.pos.y + (isMobile ? 16 : 14)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={keySigFontSize}
                        fill={active ? "hsl(215 100% 94% / 0.92)" : HARMONIC_COLORS.mutedForeground}
                        opacity={0.78}
                        className="pointer-events-none select-none"
                      >
                        {KEY_SIGNATURES[node.key]}
                      </text>
                    )}
                  </g>
                );
              })}

              {minorNodes.map((node) => {
                const nodeStyle = getMinorNodeStyle(node.key, node.index);
                const active = isActiveMinor(node.key);

                return (
                  <g
                    key={`minor-${node.key}`}
                    transform={getSegmentTransform(node.pos, nodeStyle.scale)}
                    style={{ transition: NODE_TRANSITION }}
                  >
                    <path
                      d={node.path}
                      fill={nodeStyle.fill}
                      stroke={HARMONIC_COLORS.border}
                      strokeWidth={active ? 1.8 : 1}
                      filter={nodeStyle.filter || undefined}
                      className="cursor-pointer"
                      style={{ transition: NODE_TRANSITION }}
                      onMouseEnter={() => {
                        if (!isMobile) {
                          setHoveredSegment({ ring: "minor", index: node.index });
                          showTooltipForNode("minor", node.key, node.pos);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) {
                          setHoveredSegment(null);
                          hideTooltip();
                        }
                      }}
                      onClick={() => handleMinorClick(node.key, node.index)}
                    />
                    <text
                      x={node.pos.x}
                      y={node.pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={minorFontSize}
                      fontWeight={active ? 700 : 450}
                      fill={nodeStyle.textFill}
                      className="pointer-events-none select-none"
                    >
                      {MINOR_DISPLAY[node.key] || node.key}
                    </text>
                  </g>
                );
              })}

              {showDiminished &&
                dimNodes.map((node) => {
                  const nodeStyle = getDimNodeStyle(node.index);
                  return (
                    <g
                      key={`dim-${node.key}`}
                      transform={getSegmentTransform(node.pos, nodeStyle.scale)}
                      style={{ transition: NODE_TRANSITION }}
                    >
                      <path
                        d={node.path}
                        fill={nodeStyle.fill}
                        stroke={HARMONIC_COLORS.border}
                        strokeWidth={0.8}
                        filter={nodeStyle.filter || undefined}
                        className="cursor-pointer"
                        style={{ transition: NODE_TRANSITION }}
                        onMouseEnter={() => {
                          if (!isMobile) {
                            setHoveredSegment({ ring: "dim", index: node.index });
                            showTooltipForNode("dim", node.key, node.pos);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isMobile) {
                            setHoveredSegment(null);
                            hideTooltip();
                          }
                        }}
                        onClick={() => handleDimClick(node.key, node.index)}
                      />
                      <text
                        x={node.pos.x}
                        y={node.pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={dimFontSize}
                        fontWeight={450}
                        fill={HARMONIC_COLORS.mutedForeground}
                        className="pointer-events-none select-none"
                      >
                        {node.key.replace("dim", "°")}
                      </text>
                    </g>
                  );
                })}

              {ripples.map((ripple) => (
                <circle key={ripple.id} cx={ripple.x} cy={ripple.y} r={8} fill="none" stroke={ripple.color} strokeWidth={2} opacity={0.84}>
                  <animate attributeName="r" from="8" to="58" dur="700ms" fill="freeze" />
                  <animate attributeName="opacity" from="0.84" to="0" dur="700ms" fill="freeze" />
                </circle>
              ))}

              {activeNodePoint && (
                <>
                  <circle
                    cx={activeNodePoint.x}
                    cy={activeNodePoint.y}
                    r={18}
                    fill="none"
                    stroke="hsl(215 100% 96% / 0.92)"
                    strokeWidth={2}
                    opacity={0.82}
                    filter="url(#tonic-glow)"
                    className="pointer-events-none"
                  />
                  <circle
                    ref={selectionPulseRef}
                    cx={activeNodePoint.x}
                    cy={activeNodePoint.y}
                    r={28}
                    fill="none"
                    stroke="hsl(208 90% 72% / 0.85)"
                    strokeWidth={1.6}
                    opacity={0.28}
                    className="pointer-events-none"
                  />
                </>
              )}

              <circle
                ref={modulationMarkerRef}
                cx={CX}
                cy={CY}
                r={12}
                fill="hsl(208 90% 72% / 0.28)"
                stroke="hsl(208 100% 96% / 0.85)"
                strokeWidth={2}
                opacity={0}
                filter="url(#trail-glow)"
                className="pointer-events-none"
              />

              <circle cx={CX} cy={CY} r={showDiminished ? R_DIM : R_MINOR} fill="hsl(var(--background))" stroke={HARMONIC_COLORS.border} strokeWidth={1} />
              <circle cx={CX} cy={CY} r={showDiminished ? R_DIM - 18 : R_MINOR - 18} fill="hsl(220 28% 10% / 0.18)" stroke="hsl(215 80% 75% / 0.08)" strokeWidth={1} />

              <text
                x={CX}
                y={CY - 16}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={centerFontSize}
                fontWeight={700}
                fill={HARMONIC_COLORS.foreground}
                className="select-none"
              >
                {selectedKey || selectedMinor || defaultMajorKey || "C"}
              </text>
              <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isMobile ? 12 : 10}
                fill={HARMONIC_COLORS.mutedForeground}
                className="select-none"
              >
                {selectedMinor ? "minor" : "major"}
              </text>
              {showKeySig && (
                <text
                  x={CX}
                  y={CY + (isMobile ? 28 : 24)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isMobile ? 13 : 11}
                  fill={HARMONIC_COLORS.tonic}
                  fontWeight={600}
                  className="select-none"
                >
                  {activeKeySig}
                </text>
              )}
            </svg>
          </div>
        </div>

        <div className="w-full lg:w-64 space-y-3">
          {isMobile ? (
            <button
              onClick={() => setShowInfoPanel((current) => !current)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{activeDisplay}</span>
                <span className="text-[10px] text-primary font-medium">{activeKeySig}</span>
                {showRelated && (
                  <span className="text-[10px] text-muted-foreground">
                    {selectedMinor ? "v" : "V"}: {relInfo.dom} · {selectedMinor ? "iv" : "IV"}: {relInfo.sub}
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
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground">Chord</span>
                    <span className="font-medium text-right text-foreground">{activeChordSummary.notes.join(" • ")}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Related Keys</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dominant ({selectedMinor ? "v" : "V"})</span>
                    <button
                      onClick={relInfo.domClick}
                      className="font-medium hover:underline active:underline cursor-pointer touch-manipulation"
                      style={{ color: HARMONIC_COLORS.dominant }}
                    >
                      {relInfo.dom}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdominant ({selectedMinor ? "iv" : "IV"})</span>
                    <button
                      onClick={relInfo.subClick}
                      className="font-medium hover:underline active:underline cursor-pointer touch-manipulation"
                      style={{ color: HARMONIC_COLORS.subdominant }}
                    >
                      {relInfo.sub}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{relInfo.relLabel}</span>
                    <button
                      onClick={relInfo.relClick}
                      className="font-medium hover:underline active:underline cursor-pointer touch-manipulation"
                      style={{ color: selectedMinor ? HARMONIC_COLORS.relativeMajor : HARMONIC_COLORS.relativeMinor }}
                    >
                      {relInfo.relValue}
                    </button>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Diatonic Chords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMinor ? ["i", "ii°", "III", "iv", "v", "VI", "VII"] : ["I", "ii", "iii", "IV", "V", "vi", "vii°"]).map(
                      (numeral) => (
                        <span key={numeral} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                          {numeral}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Harmonic Colors</p>
                <div className={`${isMobile ? "grid grid-cols-2" : "space-y-1.5"} text-[10px] gap-1.5`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: HARMONIC_COLORS.tonic }} />
                    <span className="text-foreground">Tonic / stable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: HARMONIC_COLORS.dominant }} />
                    <span className="text-foreground">Dominant / tension</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: HARMONIC_COLORS.subdominant }} />
                    <span className="text-foreground">Subdominant / motion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: HARMONIC_COLORS.relativeMinor }} />
                    <span className="text-foreground">Relative minor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: HARMONIC_COLORS.relativeMajor }} />
                    <span className="text-foreground">Relative major</span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Adjacent keys differ by one accidental. Clockwise adds sharps, counterclockwise adds flats, and the animated
                modulation trail follows the shortest harmonic path instead of jumping abruptly.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;
