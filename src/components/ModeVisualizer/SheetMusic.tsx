import { useEffect, useRef, useState } from "react";
import abcjs from "abcjs";
import { scaleToAbc, type ClefType } from "./scaleData";

interface SheetMusicProps {
  scaleNotes: string[];
  hoveredNote: string | null;
}

const CLEF_OPTIONS: { value: ClefType; label: string }[] = [
  { value: 'treble', label: 'Treble' },
  { value: 'bass', label: 'Bass' },
  { value: 'alto', label: 'Alto' },
  { value: 'tenor', label: 'Tenor' },
];

const TIME_SIG_OPTIONS = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8'];

const TRANSPOSE_OPTIONS = [
  { value: 0, label: 'Concert (C)' },
  { value: 2, label: 'Bb Instrument (+2)' },
  { value: -3, label: 'Eb Instrument (-3)' },
  { value: 5, label: 'F Instrument (+5)' },
  { value: 1, label: '+1 semitone' },
  { value: -1, label: '-1 semitone' },
  { value: 3, label: '+3 semitones' },
  { value: -2, label: '-2 semitones' },
  { value: 6, label: '+6 (tritone)' },
];

const SheetMusic = ({ scaleNotes, hoveredNote }: SheetMusicProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clef, setClef] = useState<ClefType>('treble');
  const [timeSig, setTimeSig] = useState('4/4');
  const [transpose, setTranspose] = useState(0);

  useEffect(() => {
    if (!containerRef.current || scaleNotes.length === 0) return;

    const abc = scaleToAbc(scaleNotes, { clef, timeSignature: timeSig, transposeSemitones: transpose });
    abcjs.renderAbc(containerRef.current, abc, {
      staffwidth: 500,
      paddingtop: 0,
      paddingbottom: 0,
      responsive: "resize",
    });
  }, [scaleNotes, clef, timeSig, transpose]);

  return (
    <div className="rounded-lg border border-border bg-white/5 p-4 overflow-hidden space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Clef</label>
          <select
            value={clef}
            onChange={e => setClef(e.target.value as ClefType)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {CLEF_OPTIONS.map(c => (
              <option key={c.value} value={c.value} className="bg-background text-foreground">{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Time</label>
          <select
            value={timeSig}
            onChange={e => setTimeSig(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {TIME_SIG_OPTIONS.map(t => (
              <option key={t} value={t} className="bg-background text-foreground">{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Transpose</label>
          <select
            value={transpose}
            onChange={e => setTranspose(Number(e.target.value))}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {TRANSPOSE_OPTIONS.map(t => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notation */}
      <div
        ref={containerRef}
        className="[&_svg]:w-full [&_svg]:max-w-lg [&_svg]:mx-auto [&_svg_path]:fill-stone-300 [&_svg_path]:stroke-stone-300 [&_svg_text]:fill-stone-300 [&_svg_line]:stroke-stone-400 [&_svg_rect]:fill-stone-300"
      />
    </div>
  );
};

export default SheetMusic;
