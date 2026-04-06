import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Minus, Plus } from "lucide-react";

const TIME_SIGNATURES = [
  { label: '4/4', beats: 4 },
  { label: '3/4', beats: 3 },
  { label: '6/8', beats: 6 },
  { label: '5/4', beats: 5 },
  { label: '7/8', beats: 7 },
  { label: '2/4', beats: 2 },
];

const SUBDIVISIONS = [
  { label: '♩', value: 1 },
  { label: '♫', value: 2 },
  { label: '♬', value: 4 },
];

const BPM_PRESETS = [
  { label: 'Largo', bpm: 50 },
  { label: 'Adagio', bpm: 70 },
  { label: 'Andante', bpm: 92 },
  { label: 'Moderato', bpm: 110 },
  { label: 'Allegro', bpm: 132 },
  { label: 'Vivace', bpm: 160 },
  { label: 'Presto', bpm: 184 },
];

function createClick(
  audioCtx: AudioContext,
  time: number,
  isAccent: boolean,
  isSubdivision: boolean
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (isSubdivision) {
    osc.frequency.value = 600;
    gain.gain.value = 0.03;
  } else if (isAccent) {
    osc.frequency.value = 1200;
    gain.gain.value = 0.12;
  } else {
    osc.frequency.value = 800;
    gain.gain.value = 0.08;
  }

  osc.start(time);
  osc.stop(time + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
}

const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [timeSigIdx, setTimeSigIdx] = useState(0);
  const [subdivIdx, setSubdivIdx] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [accentFirst, setAccentFirst] = useState(true);
  const [swing, setSwing] = useState(50); // 50 = straight, 67 = triplet swing

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const timeSig = TIME_SIGNATURES[timeSigIdx];
  const subdivision = SUBDIVISIONS[subdivIdx].value;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
    setCurrentBeat(-1);
    beatRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    beatRef.current = 0;
    setPlaying(true);

    const totalSubBeats = timeSig.beats * subdivision;
    const beatDuration = 60 / bpm; // duration of one main beat in seconds
    const swingRatio = swing / 100; // 0.5 = straight, 0.67 = triplet swing

    // Play first beat immediately
    const isAccent = accentFirst && beatRef.current === 0;
    const isSub = beatRef.current % subdivision !== 0;
    createClick(ctx, ctx.currentTime, isAccent, isSub);
    setCurrentBeat(Math.floor(beatRef.current / subdivision));
    beatRef.current = (beatRef.current + 1) % totalSubBeats;

    // For swing: we need variable timing per sub-beat, so use setTimeout chain
    const scheduleNext = () => {
      const subBeatInMain = beatRef.current % subdivision;
      let delayMs: number;

      if (subdivision === 1) {
        delayMs = beatDuration * 1000;
      } else {
        // Apply swing to even-numbered sub-beats within each main beat
        // Even sub-beat (0, 2, ...) gets swingRatio of the beat duration
        // Odd sub-beat (1, 3, ...) gets (1 - swingRatio)
        if (subBeatInMain === 0) {
          // This is a main beat; time from last sub-beat of prev main beat
          // Last sub was odd, so it took (1-swingRatio) * beatDuration
          // But we just need the interval from the previous sub-beat
          const prevWasOdd = true;
          delayMs = (prevWasOdd ? (1 - swingRatio) : swingRatio) * beatDuration * 1000 * (2 / subdivision);
        } else if (subBeatInMain % 2 === 1) {
          // Odd sub-beat: preceded by even sub-beat which took swingRatio
          delayMs = swingRatio * beatDuration * 1000 * (2 / subdivision);
        } else {
          // Even sub-beat (not 0): preceded by odd which took (1-swingRatio)
          delayMs = (1 - swingRatio) * beatDuration * 1000 * (2 / subdivision);
        }
      }

      intervalRef.current = window.setTimeout(() => {
        const mainBeat = Math.floor(beatRef.current / subdivision);
        const isAcc = accentFirst && beatRef.current === 0;
        const isSubBeat = beatRef.current % subdivision !== 0;
        createClick(ctx, ctx.currentTime, isAcc, isSubBeat);
        setCurrentBeat(mainBeat);
        beatRef.current = (beatRef.current + 1) % totalSubBeats;
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();
  }, [bpm, timeSig, subdivision, accentFirst, swing]);

  // Restart if params change while playing
  useEffect(() => {
    if (playing) {
      stop();
      // Small delay to avoid audio glitch
      const t = setTimeout(() => start(), 50);
      return () => clearTimeout(t);
    }
  }, [bpm, timeSigIdx, subdivIdx, accentFirst, swing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleBpmChange = (delta: number) => {
    setBpm((prev) => Math.min(300, Math.max(20, prev + delta)));
  };

  const tempoLabel = BPM_PRESETS.reduce((closest, p) =>
    Math.abs(p.bpm - bpm) < Math.abs(closest.bpm - bpm) ? p : closest
  ).label;

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">Metronome</h3>

      {/* BPM Display */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleBpmChange(-5)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Minus size={16} />
          </button>
          <div className="text-center">
            <input
              type="number"
              value={bpm}
              min={20}
              max={300}
              onChange={(e) => setBpm(Math.min(300, Math.max(20, Number(e.target.value) || 20)))}
              className="w-24 text-center text-4xl font-bold bg-transparent border-none outline-none text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">{tempoLabel}</p>
          </div>
          <button
            onClick={() => handleBpmChange(5)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* BPM Slider */}
        <input
          type="range"
          min={20}
          max={300}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full max-w-xs mt-3 accent-amber-500"
        />

        {/* Tempo Presets */}
        <div className="flex flex-wrap gap-1 mt-3 justify-center">
          {BPM_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setBpm(p.bpm)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                Math.abs(bpm - p.bpm) < 10
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {p.label} ({p.bpm})
            </button>
          ))}
        </div>
      </div>

      {/* Beat Indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: timeSig.beats }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-100 ${
              currentBeat === i
                ? i === 0 && accentFirst
                  ? 'bg-amber-500 border-amber-400 text-black scale-110'
                  : 'bg-primary border-primary text-primary-foreground scale-110'
                : 'border-border text-muted-foreground'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => (playing ? stop() : start())}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            playing
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Stop' : 'Start'}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Time</label>
          <select
            value={timeSigIdx}
            onChange={(e) => setTimeSigIdx(Number(e.target.value))}
            className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {TIME_SIGNATURES.map((ts, i) => (
              <option key={ts.label} value={i}>{ts.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Subdivide</label>
          <div className="flex gap-1">
            {SUBDIVISIONS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setSubdivIdx(i)}
                className={`w-8 h-8 rounded border text-sm transition-colors ${
                  subdivIdx === i
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setAccentFirst(!accentFirst)}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            accentFirst
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-border text-muted-foreground hover:bg-accent'
          }`}
        >
          Accent 1
        </button>
      </div>
    </div>
  );
};

export default Metronome;
