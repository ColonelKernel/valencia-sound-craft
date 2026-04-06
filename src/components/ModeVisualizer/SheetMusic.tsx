import { useEffect, useRef } from "react";
import abcjs from "abcjs";
import { scaleToAbc } from "./scaleData";

interface SheetMusicProps {
  scaleNotes: string[];
  hoveredNote: string | null;
}

const SheetMusic = ({ scaleNotes, hoveredNote }: SheetMusicProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || scaleNotes.length === 0) return;

    const abc = scaleToAbc(scaleNotes);
    abcjs.renderAbc(containerRef.current, abc, {
      staffwidth: 500,
      paddingtop: 0,
      paddingbottom: 0,
      responsive: "resize",
    });
  }, [scaleNotes]);

  return (
    <div className="rounded-lg border border-border bg-white/5 p-4 overflow-hidden">
      <div
        ref={containerRef}
        className="[&_svg]:w-full [&_svg]:max-w-lg [&_svg]:mx-auto [&_svg_path]:fill-stone-300 [&_svg_path]:stroke-stone-300 [&_svg_text]:fill-stone-300 [&_svg_line]:stroke-stone-400 [&_svg_rect]:fill-stone-300"
      />
    </div>
  );
};

export default SheetMusic;
