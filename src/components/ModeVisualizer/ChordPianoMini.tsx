import { playNote, type InstrumentTimbre } from "./audioSynth";

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_INDICES = new Set([1, 3, 6, 8, 10]);

const ENHARMONIC: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
  'E#': 'F', 'B#': 'C',
};

function norm(n: string) { return ENHARMONIC[n] || n; }

interface ChordPianoMiniProps {
  chordNotes: string[];
  rootNote: string;
  symbol: string;
  timbre?: InstrumentTimbre;
}

const ChordPianoMini = ({ chordNotes, rootNote, symbol, timbre = 'piano' }: ChordPianoMiniProps) => {
  const normRoot = norm(rootNote);
  const normChord = new Set(chordNotes.map(norm));

  // Build 2 octaves starting from C
  const keys: { note: string; isBlack: boolean }[] = [];
  for (let oct = 0; oct < 2; oct++) {
    ALL_NOTES.forEach((n, i) => keys.push({ note: n, isBlack: BLACK_INDICES.has(i) }));
  }

  const whiteKeys = keys.filter(k => !k.isBlack);
  const totalWhite = whiteKeys.length;

  // Black key positions
  const blackPositions: { note: string; left: number }[] = [];
  let wIdx = 0;
  for (const k of keys) {
    if (!k.isBlack) { wIdx++; }
    else { blackPositions.push({ note: k.note, left: ((wIdx - 0.35) / totalWhite) * 100 }); }
  }

  const isChordTone = (n: string) => normChord.has(norm(n));
  const isRoot = (n: string) => norm(n) === normRoot;

  // Find display name from original chord notes
  const displayName = (n: string): string => {
    const found = chordNotes.find(cn => norm(cn) === norm(n));
    return found || n;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Piano</span>
        <span className="text-[10px] font-semibold text-foreground">{symbol}</span>
        <span className="text-[9px] text-muted-foreground font-mono">{chordNotes.join(' – ')}</span>
      </div>
      <div className="relative select-none" style={{ height: '72px' }}>
        {/* White keys */}
        <div className="flex h-full">
          {whiteKeys.map((k, i) => {
            const active = isChordTone(k.note);
            const root = isRoot(k.note);
            return (
              <div
                key={i}
                className={`relative flex-1 border border-border/50 rounded-b cursor-pointer transition-all duration-150
                  ${root
                    ? 'bg-primary shadow-[inset_0_-3px_0_0_hsl(var(--primary)/0.5)]'
                    : active
                      ? 'bg-accent shadow-[inset_0_-3px_0_0_hsl(var(--accent)/0.8)]'
                      : 'bg-card hover:bg-secondary/40'
                  }`}
                onClick={() => active && playNote(k.note, 0, 0.35, timbre)}
              >
                {active && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold
                    ${root ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {displayName(k.note)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Black keys */}
        {blackPositions.map((bp, i) => {
          const active = isChordTone(bp.note);
          const root = isRoot(bp.note);
          return (
            <div
              key={i}
              className={`absolute top-0 rounded-b cursor-pointer transition-all duration-150 z-20
                ${root
                  ? 'bg-primary shadow-md'
                  : active
                    ? 'bg-primary/60 shadow-md'
                    : 'bg-muted-foreground/80'
                }`}
              style={{
                left: `${bp.left}%`,
                width: `${(0.65 / totalWhite) * 100}%`,
                height: '58%',
              }}
              onClick={() => active && playNote(bp.note, 0, 0.35, timbre)}
            >
              {active && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] font-bold
                  ${root ? 'text-primary-foreground' : 'text-white'}`}>
                  {displayName(bp.note)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordPianoMini;
