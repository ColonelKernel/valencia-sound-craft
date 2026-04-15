import { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { ChordAtlasEntry } from "./chordEngine";
import { getIntervalColor } from "./chordEngine";

interface ChordDetailProps {
  chord: ChordAtlasEntry | null;
}

const ChordDetail = memo(({ chord }: ChordDetailProps) => {
  if (!chord) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <p>Select a chord to see details</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{chord.function}</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">{chord.name}</h3>
        <p className="text-sm text-muted-foreground">{chord.symbol}</p>
      </div>

      {/* Chord Formula */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formula</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {chord.intervals.map((interval, i) => (
            <div key={interval + i} className="flex flex-col items-center gap-1">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${getIntervalColor(interval)}`}>
                {chord.notes[i]}
              </span>
              <span className="text-[10px] text-muted-foreground">{interval}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Voicings */}
      {chord.voicings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Voicings</h4>
          <div className="mt-2 space-y-2">
            {chord.voicings.map((v, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
                <span className="text-xs font-medium text-foreground">{v.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {v.frets.join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Scales */}
      {chord.relatedScales.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related Scales</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chord.relatedScales.map((scale) => (
              <span
                key={scale}
                className="rounded-full border border-border/50 bg-secondary/30 px-3 py-1 text-xs text-foreground"
              >
                {scale}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Substitutions */}
      {chord.substitutions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Substitutions</h4>
          <ul className="mt-2 space-y-1">
            {chord.substitutions.map((sub) => (
              <li key={sub} className="text-xs text-muted-foreground">
                → {sub}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cross-tool link */}
      <Link
        to="/tools/harmony"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
      >
        <ExternalLink className="h-3 w-3" />
        Open in Harmony Lab
      </Link>
    </div>
  );
});

ChordDetail.displayName = "ChordDetail";

export default ChordDetail;
