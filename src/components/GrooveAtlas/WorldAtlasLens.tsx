import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Play, Square } from "lucide-react";

import { getAudioContext } from "@/music-core/audioContext";
import GlobalRhythmMap from "@/components/Blipblox/GlobalRhythmMap";
import {
  GLOBAL_RHYTHM_ATLAS,
  getAtlasRhythmByCountry,
  getPlaybackVelocityPattern,
  type Rhythm,
} from "@/components/Blipblox/globalRhythmAtlas";
import { getDefaultRhythmDefinitionForCountry } from "@/components/Blipblox/rhythmEngineModel";
import { useRhythmSelection } from "@/features/shared/useRhythmSelection";
import { getScholarshipForRhythm } from "@/content/atlasCitations";
import { cn } from "@/lib/utils";

const PANEL_TIMBRES: Record<string, { freq: number; type: OscillatorType }> = {
  djembe: { freq: 180, type: "triangle" },
  "conga/clave": { freq: 800, type: "square" },
  surdo: { freq: 100, type: "sine" },
  "cajón": { freq: 220, type: "triangle" },
  tupan: { freq: 140, type: "sine" },
  tabla: { freq: 260, type: "triangle" },
  darbuka: { freq: 340, type: "triangle" },
  taiko: { freq: 90, type: "sine" },
  "log drum": { freq: 400, type: "square" },
  "neutral kit": { freq: 150, type: "sine" },
};

const CLASSIFICATION_LABELS: Record<Rhythm["classification"], string> = {
  documented: "Documented tradition",
  regional: "Regional estimate",
  proxy: "Continental proxy",
};

/**
 * Looping preview of one atlas rhythm cycle on the shared AudioContext.
 * Self-contained so the lens can stop cleanly on unmount or rhythm change.
 */
function useLoopedPreview(rhythm: Rhythm | null) {
  const [playing, setPlaying] = useState(false);
  const timersRef = useRef<number[]>([]);
  const [step, setStep] = useState<number | null>(null);

  const stop = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPlaying(false);
    setStep(null);
  }, []);

  const start = useCallback(() => {
    if (!rhythm) return;
    stop();
    setPlaying(true);

    const ctx = getAudioContext();
    const velocity = getPlaybackVelocityPattern(rhythm);
    const bpm = (rhythm.bpmRange[0] + rhythm.bpmRange[1]) / 2;
    const stepDuration = 60 / bpm / 4;
    const steps = rhythm.midiPattern.length;
    const timbre = PANEL_TIMBRES[rhythm.timbreProfile] || PANEL_TIMBRES["neutral kit"];

    const scheduleCycle = (cycle: number) => {
      for (let i = 0; i < steps; i++) {
        const at = (cycle * steps + i) * stepDuration * 1000;
        timersRef.current.push(
          window.setTimeout(() => {
            setStep(i);
            if (!rhythm.midiPattern[i]) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = timbre.type;
            osc.frequency.setValueAtTime(timbre.freq * (rhythm.accents[i] ? 1.2 : 1), now);
            gain.gain.setValueAtTime(Math.max(0.05, (velocity[i] / 127) * 0.25), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
          }, at),
        );
      }
    };

    // Two cycles, then stop — long enough to hear the loop point without
    // becoming an unbounded background loop.
    scheduleCycle(0);
    scheduleCycle(1);
    timersRef.current.push(window.setTimeout(stop, 2 * steps * stepDuration * 1000 + 150));
  }, [rhythm, stop]);

  useEffect(() => stop, [stop]);
  useEffect(() => {
    stop();
  }, [rhythm, stop]);

  return { playing, step, start, stop };
}

interface TraditionPanelProps {
  rhythm: Rhythm | null;
}

const TraditionPanel = ({ rhythm }: TraditionPanelProps) => {
  const preview = useLoopedPreview(rhythm);

  if (!rhythm) {
    return (
      <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">
        Select a country on the map to see its rhythm tradition, hear a preview, and read
        the sources behind it.
      </div>
    );
  }

  const scholarship = getScholarshipForRhythm(rhythm.id, rhythm.country);

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-6 space-y-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{rhythm.country}</p>
            <h2 className="text-2xl font-bold tracking-tight mt-1">{rhythm.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{rhythm.tradition}</p>
          </div>
          <button
            type="button"
            onClick={preview.playing ? preview.stop : preview.start}
            aria-label={preview.playing ? "Stop preview" : `Play ${rhythm.name} preview`}
            className="shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {preview.playing ? <Square size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
          {CLASSIFICATION_LABELS[rhythm.classification]} · {rhythm.confidence} confidence
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Meter</dt>
          <dd className="text-foreground">{rhythm.meter} · {rhythm.cycleLength}-unit cycle</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Tempo</dt>
          <dd className="text-foreground">{rhythm.bpmRange[0]}–{rhythm.bpmRange[1]} BPM</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Instruments</dt>
          <dd className="text-foreground">{rhythm.instruments.join(", ")}</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cycle</p>
        <div
          role="img"
          aria-label={`${rhythm.name} step pattern: ${rhythm.midiPattern.filter(Boolean).length} strokes over ${rhythm.midiPattern.length} steps`}
          className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-[3px]"
        >
          {rhythm.midiPattern.map((hit, index) => (
            <span
              key={index}
              className={cn(
                "h-3 rounded-[2px] transition-colors",
                hit
                  ? rhythm.accents[index]
                    ? "bg-primary"
                    : "bg-primary/45"
                  : "bg-muted",
                preview.step === index && "ring-1 ring-foreground",
              )}
            />
          ))}
        </div>
      </div>

      {scholarship?.note && (
        <p className="text-sm text-muted-foreground leading-relaxed">{scholarship.note}</p>
      )}

      {scholarship && scholarship.citations.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Sources</p>
          <ul className="space-y-2">
            {scholarship.citations.map((citation) => (
              <li key={citation.url} className="text-sm leading-snug">
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-1.5 text-foreground hover:text-primary transition-colors"
                >
                  <span>
                    {citation.title}
                    <span className="text-muted-foreground">
                      {" "}— {citation.author ? `${citation.author}, ` : ""}
                      {citation.publisher}
                      {citation.year ? `, ${citation.year}` : ""}
                    </span>
                  </span>
                  <ExternalLink size={12} className="mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Reference: {rhythm.source.title}. {rhythm.classification !== "documented" &&
            "This entry is an honest regional estimate, not a documented transcription."}
        </p>
      )}
    </div>
  );
};

/**
 * Map-led cultural lens of the Groove Atlas: the world rhythm map as hero,
 * with a read-only tradition panel. Selection is pushed into the shared music
 * store so the same rhythm is active in the Rhythm and Map workshop tools.
 */
const WorldAtlasLens = () => {
  const [selected, setSelected] = useState<Rhythm | null>(() => getAtlasRhythmByCountry("Cuba") ?? null);
  const selection = useRhythmSelection("groove-atlas");
  // These come from useGlobalMusicActions, which memoizes on the singleton
  // store, so they are stable for the life of the component. Destructured so
  // the dependency array names them directly.
  const { setRhythm, suggestTempo } = selection;

  const handleCountrySelect = useCallback(
    (rhythm: Rhythm) => {
      setSelected(rhythm);
      const definition = getDefaultRhythmDefinitionForCountry(rhythm.country);
      if (definition) {
        setRhythm(definition.id, definition.region);
        suggestTempo(Math.round((rhythm.bpmRange[0] + rhythm.bpmRange[1]) / 2));
      }
    },
    [setRhythm, suggestTempo],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)] items-start">
      <div className="rounded-[1.5rem] border border-border/70 overflow-hidden">
        <GlobalRhythmMap
          rhythms={GLOBAL_RHYTHM_ATLAS}
          selectedCountry={selected?.country}
          onCountrySelect={handleCountrySelect}
        />
      </div>
      <TraditionPanel rhythm={selected} />
    </div>
  );
};

export default WorldAtlasLens;
