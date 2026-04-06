import { useEffect, useRef } from "react";
import abcjs from "abcjs";

interface ChordStaffViewProps {
  notes: string[];
  symbol: string;
}

const ABC_MAP: Record<string, string> = {
  'C': 'C', 'C#': '^C', 'Db': '_D', 'D': 'D', 'D#': '^D', 'Eb': '_E',
  'E': 'E', 'F': 'F', 'F#': '^F', 'Gb': '_G', 'G': 'G', 'G#': '^G',
  'Ab': '_A', 'A': 'A', 'A#': '^A', 'Bb': '_B', 'B': 'B',
};

const PITCH_INDEX: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11,
};

function notesToAbc(notes: string[]): string {
  if (notes.length === 0) return '';
  
  // Build chord as stacked notes (simultaneous)
  const abcNotes: string[] = [];
  let octave = 0;
  let prevPitch = -1;

  for (const n of notes) {
    const base = ABC_MAP[n] || n;
    const pitch = PITCH_INDEX[n] ?? 0;
    if (prevPitch >= 0 && pitch <= prevPitch) octave++;
    prevPitch = pitch;

    if (octave === 0) abcNotes.push(base);
    else if (octave === 1) abcNotes.push(base.toLowerCase());
    else abcNotes.push(base.toLowerCase() + "'".repeat(octave - 1));
  }

  // Render as chord (stacked) then arpeggio
  const chordStr = `[${abcNotes.join('')}]4`;
  const arpeggioStr = abcNotes.join(' ');

  return `X:1\nT:\nM:4/4\nL:1/4\nK:C\n${chordStr} ${arpeggioStr} |]\n`;
}

const ChordStaffView = ({ notes, symbol }: ChordStaffViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) return;
    const abc = notesToAbc(notes);
    abcjs.renderAbc(containerRef.current, abc, {
      staffwidth: 250,
      paddingtop: 0,
      paddingbottom: 0,
      responsive: "resize",
    });
  }, [notes, symbol]);

  return (
    <div
      ref={containerRef}
      className="[&_svg]:w-full [&_svg]:max-w-[280px] [&_svg]:mx-auto [&_svg_path]:fill-stone-300 [&_svg_path]:stroke-stone-300 [&_svg_text]:fill-stone-300 [&_svg_line]:stroke-stone-400 [&_svg_rect]:fill-stone-300"
    />
  );
};

export default ChordStaffView;
