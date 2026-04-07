import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Download, Zap, Sparkles, Globe, Music, Shuffle, Radio, Wifi, WifiOff } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import StepSequencer from './StepSequencer';
import PatternMorpher from './PatternMorpher';
import { blipbloxEngine, type StepPattern, type SyncMode } from './blipbloxEngine';
import { morphPatterns, velocityMorph, mapGroove } from './rhythmTranslator';
import { generateRhythm, REGION_OPTIONS, METER_OPTIONS, REGION_SUB_STYLES, type GenerateOptions } from './rhythmGenerator';
import { adaptiveEngine, type RegionId, type VariationType } from './adaptiveEngine';
import { generateHarmonic } from './harmonicEngine';
import { generateMidiFile, downloadMidiFile } from '../DrumMachine/midiExport';
import { DRUM_PRESETS, type PatternPreset } from '../DrumMachine/drumPresets';
import { lazy, Suspense } from 'react';

const BlipbloxConnector = lazy(() => import('./BlipbloxConnector'));

interface GlobalRhythmEngineProps {
  root?: string;
  mode?: string;
  embeddedPreset?: PatternPreset;
}

const VARIATION_LABELS: Record<VariationType, string> = {
  'ghost-notes': '👻 Ghost Notes',
  'syncopation': '🔀 Syncopation',
  'accent-shift': '🎯 Accent Shift',
  'fill': '🥁 Fill',
  'micro-timing': '⏱️ Micro-Timing',
  'subdivision-swap': '🔄 Subdivision Swap',
};

const GlobalRhythmEngine = ({ root = 'C', mode = 'major', embeddedPreset }: GlobalRhythmEngineProps) => {
  // Pattern state
  const [pattern, setPattern] = useState<number[]>(new Array(16).fill(0));
  const [velocityPattern, setVelocityPattern] = useState<number[]>(new Array(16).fill(0));
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepMode, setStepMode] = useState<16 | 32>(16);

  // Generation controls
  const [genRegion, setGenRegion] = useState<GenerateOptions['region']>('african');
  const [genMeter, setGenMeter] = useState<[number, number]>([4, 4]);
  const [density, setDensity] = useState(0.5);
  const [complexity, setComplexity] = useState(0.5);
  const [swingAmount, setSwingAmount] = useState(0.3);
  const [subStyle, setSubStyle] = useState('');

  // Morph state
  const [morphAmount, setMorphAmount] = useState(0);
  const [secondaryPattern, setSecondaryPattern] = useState<number[]>([1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1]);
  const [secondaryVelocity, setSecondaryVelocity] = useState<number[]>(new Array(16).fill(100));

  // Adaptive mode
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [variationStrength, setVariationStrength] = useState(0.5);
  const [lastVariationType, setLastVariationType] = useState<VariationType | null>(null);
  const loopCountRef = useRef(0);

  // Sync state
  const [syncMode, setSyncMode] = useState<SyncMode>('internal');
  const [syncLocked, setSyncLocked] = useState(false);
  const [externalBpm, setExternalBpm] = useState<number | null>(null);

  // UI state
  const [showGenerate, setShowGenerate] = useState(true);
  const [showMorph, setShowMorph] = useState(false);
  const [showBlipblox, setShowBlipblox] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  // Audio playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const stepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const stepTimeoutsRef = useRef<number[]>([]);

  // Get unique countries from presets
  const countries = useMemo(() => {
    const set = new Set(DRUM_PRESETS.filter(p => p.countryCode !== 'UN').map(p => p.country));
    return Array.from(set).sort();
  }, []);

  // Sub-styles for current region
  const currentSubStyles = useMemo(() => REGION_SUB_STYLES[genRegion] || [], [genRegion]);

  // Reset sub-style when region changes
  useEffect(() => { setSubStyle(''); }, [genRegion]);

  // Sync mode management
  useEffect(() => {
    blipbloxEngine.setSyncMode(syncMode);
    blipbloxEngine.onTempoChange((newBpm) => {
      setExternalBpm(newBpm);
      setSyncLocked(true);
    });
    return () => { blipbloxEngine.onTempoChange(null); };
  }, [syncMode]);

  // Poll sync status
  useEffect(() => {
    if (syncMode === 'internal') return;
    const interval = setInterval(() => {
      const status = blipbloxEngine.getSyncStatus();
      setSyncLocked(status.isLocked);
      setExternalBpm(status.externalBpm);
    }, 500);
    return () => clearInterval(interval);
  }, [syncMode]);

  // Load embedded preset
  useEffect(() => {
    if (embeddedPreset) {
      setBpm(embeddedPreset.bpm);
      const track = embeddedPreset.tracks[0];
      if (track) {
        const groove = mapGroove(track.steps);
        setPattern(groove.midiPattern);
        setVelocityPattern(groove.velocityPattern);
      }
    }
  }, [embeddedPreset]);

  // Get effective (morphed) pattern
  const effectivePattern = useMemo(() => {
    if (morphAmount <= 0) return pattern;
    return morphPatterns(pattern, secondaryPattern, morphAmount);
  }, [pattern, secondaryPattern, morphAmount]);

  const effectiveVelocity = useMemo(() => {
    if (morphAmount <= 0) return velocityPattern;
    return velocityMorph(velocityPattern, secondaryVelocity, morphAmount);
  }, [velocityPattern, secondaryVelocity, morphAmount]);

  // Active BPM (external or internal)
  const activeBpm = useMemo(() => {
    if (syncMode !== 'internal' && externalBpm) return externalBpm;
    return bpm;
  }, [syncMode, externalBpm, bpm]);

  // ─── Playback Engine ───────────────────────────────────────
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const clearStepTimeouts = useCallback(() => {
    stepTimeoutsRef.current.forEach(clearTimeout);
    stepTimeoutsRef.current = [];
  }, []);

  const scheduler = useCallback(() => {
    if (!playingRef.current) return;
    const ctx = getCtx();
    const stepDuration = 60 / activeBpm / 4;

    while (nextTimeRef.current < ctx.currentTime + 0.1) {
      const scheduledStep = stepRef.current;
      const scheduledTime = nextTimeRef.current;
      const step = effectivePattern[scheduledStep];
      const vel = effectiveVelocity[scheduledStep] ?? 100;

      if (step === 1 && vel > 0) {
        const time = Math.max(ctx.currentTime, scheduledTime);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = vel >= 90 ? 880 : vel >= 50 ? 660 : 440;
        gain.gain.setValueAtTime((vel / 127) * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.start(time);
        osc.stop(time + 0.05);
      }

      const stepDelayMs = Math.max(0, (scheduledTime - ctx.currentTime) * 1000);
      const stepTimerId = window.setTimeout(() => {
        if (playingRef.current) {
          setCurrentStep(scheduledStep);
        }
        stepTimeoutsRef.current = stepTimeoutsRef.current.filter(id => id !== stepTimerId);
      }, stepDelayMs);
      stepTimeoutsRef.current.push(stepTimerId);

      stepRef.current = (scheduledStep + 1) % effectivePattern.length;

      // Adaptive: trigger variation after each full loop
      if (stepRef.current === 0) {
        loopCountRef.current++;
        if (adaptiveMode && loopCountRef.current >= 2) {
          loopCountRef.current = 0;
          setTimeout(() => {
            const result = adaptiveEngine.suggestVariation(
              pattern,
              velocityPattern,
              genRegion as RegionId,
              variationStrength
            );
            setPattern(result.pattern);
            setVelocityPattern(result.velocity);
            setLastVariationType(result.type);
          }, 0);
        }
      }

      nextTimeRef.current += stepDuration;
    }

    timerRef.current = window.setTimeout(scheduler, 25);
  }, [activeBpm, effectivePattern, effectiveVelocity, adaptiveMode, pattern, velocityPattern, getCtx, genRegion, variationStrength]);

  useEffect(() => {
    if (playing) {
      playingRef.current = true;
      const ctx = getCtx();
      nextTimeRef.current = ctx.currentTime + 0.05;
      stepRef.current = 0;
      loopCountRef.current = 0;
      clearStepTimeouts();
      scheduler();
    } else {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      clearStepTimeouts();
      setCurrentStep(-1);
      setLastVariationType(null);
    }
    return () => {
      playingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      clearStepTimeouts();
    };
  }, [playing, scheduler, getCtx, clearStepTimeouts]);

  // ─── Actions ───────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    const result = generateRhythm({
      region: genRegion,
      meter: genMeter,
      density,
      complexity,
      swing: swingAmount,
      steps: stepMode,
      subStyle: subStyle || undefined,
    });
    setPattern(result.midiPattern);
    setVelocityPattern(result.velocityPattern);
    adaptiveEngine.reset();
    setLastVariationType(null);
  }, [genRegion, genMeter, density, complexity, swingAmount, stepMode, subStyle]);

  const handlePatternChange = useCallback((p: number[], v: number[]) => {
    adaptiveEngine.trackEdit(pattern, p);
    setPattern(p);
    setVelocityPattern(v);
  }, [pattern]);

  const loadRhythmByCountry = useCallback((country: string) => {
    const rhythms = DRUM_PRESETS.filter(p => p.country === country);
    if (rhythms.length > 0) {
      const preset = rhythms[0];
      setBpm(preset.bpm);
      const track = preset.tracks[0];
      if (track) {
        const groove = mapGroove(track.steps);
        const resized = groove.midiPattern.length > stepMode
          ? groove.midiPattern.slice(0, stepMode)
          : [...groove.midiPattern, ...new Array(Math.max(0, stepMode - groove.midiPattern.length)).fill(0)];
        const resizedVel = groove.velocityPattern.length > stepMode
          ? groove.velocityPattern.slice(0, stepMode)
          : [...groove.velocityPattern, ...new Array(Math.max(0, stepMode - groove.velocityPattern.length)).fill(0)];
        setPattern(resized);
        setVelocityPattern(resizedVel);
      }
    }
  }, [stepMode]);

  const handleExportMidi = useCallback(() => {
    const exportTracks = [{
      instrumentId: 'kick',
      steps: effectivePattern.map((s, i) => s === 1 ? (effectiveVelocity[i] / 127) : 0),
      subdivisions: effectivePattern.length,
    }];
    const data = generateMidiFile(exportTracks, activeBpm, 'general-midi', 0, false, 4, genMeter);
    downloadMidiFile(data, `rhythm_${genRegion}_${activeBpm}bpm.mid`);
  }, [effectivePattern, effectiveVelocity, activeBpm, genRegion]);

  const handleExportJson = useCallback(() => {
    const data = {
      pattern: effectivePattern,
      velocity: effectiveVelocity,
      bpm: activeBpm,
      region: genRegion,
      meter: `${genMeter[0]}/${genMeter[1]}`,
      harmonic: generateHarmonic(effectivePattern, effectiveVelocity, root, mode),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rhythm_${genRegion}_${activeBpm}bpm.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [effectivePattern, effectiveVelocity, activeBpm, genRegion, genMeter, root, mode]);

  // Morph sources from presets
  const morphSources = useMemo(() =>
    DRUM_PRESETS.slice(0, 10).map(p => ({
      name: p.name,
      midiPattern: mapGroove(p.tracks[0]?.steps || []).midiPattern,
      velocityPattern: mapGroove(p.tracks[0]?.steps || []).velocityPattern,
    })), []);

  // Sync status indicator
  const syncStatusColor = syncMode === 'internal'
    ? 'bg-muted-foreground'
    : syncLocked ? 'bg-green-500' : 'bg-amber-500';
  const syncLabel = syncMode === 'internal'
    ? 'INTERNAL'
    : syncMode === 'midi-clock'
      ? (syncLocked ? 'CLOCK IN' : 'WAITING…')
      : (syncLocked ? 'LINK ACTIVE' : 'LINK (no bridge)');

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Engine
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Generate, morph, and perform culturally-informed rhythms — send to hardware or export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{activeBpm} BPM</span>
          {adaptiveMode && lastVariationType && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground animate-pulse">
              {VARIATION_LABELS[lastVariationType]}
            </span>
          )}
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-full',
            adaptiveMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          )}>
            {adaptiveMode ? '✨ Adaptive' : 'Manual'}
          </span>
        </div>
      </div>

      {/* Sync Bar */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', syncStatusColor)} />
          <span className="text-[10px] font-mono font-medium text-foreground">{syncLabel}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {(['internal', 'midi-clock', 'link'] as SyncMode[]).map(m => (
            <button
              key={m}
              onClick={() => setSyncMode(m)}
              className={cn(
                'text-[9px] px-2 py-1 rounded transition-colors',
                syncMode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {m === 'internal' && <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> Int</span>}
              {m === 'midi-clock' && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Clock</span>}
              {m === 'link' && <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Link</span>}
            </button>
          ))}
        </div>
        {syncMode !== 'internal' && externalBpm && (
          <span className="text-[9px] text-muted-foreground">Ext: {externalBpm} BPM</span>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 border-b border-border pb-0 overflow-x-auto">
        {[
          { id: 'generate', label: 'Generate', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'morph', label: 'Morph', icon: <Shuffle className="w-3.5 h-3.5" /> },
          { id: 'blipblox', label: 'Blipblox', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'export', label: 'Export', icon: <Download className="w-3.5 h-3.5" /> },
        ].map(tab => {
          const isActive =
            (tab.id === 'generate' && showGenerate) ||
            (tab.id === 'morph' && showMorph) ||
            (tab.id === 'blipblox' && showBlipblox) ||
            (tab.id === 'export' && showExport);
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'generate') setShowGenerate(!showGenerate);
                if (tab.id === 'morph') setShowMorph(!showMorph);
                if (tab.id === 'blipblox') setShowBlipblox(!showBlipblox);
                if (tab.id === 'export') setShowExport(!showExport);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors border-b-2 whitespace-nowrap',
                isActive
                  ? 'border-primary text-foreground bg-secondary/50'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Generate Panel */}
      {showGenerate && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Region</label>
              <select
                value={genRegion}
                onChange={e => setGenRegion(e.target.value as GenerateOptions['region'])}
                className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
              >
                {REGION_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {currentSubStyles.length > 0 && (
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Style</label>
                <select
                  value={subStyle}
                  onChange={e => setSubStyle(e.target.value)}
                  className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Default</option>
                  {currentSubStyles.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Meter</label>
              <select
                value={`${genMeter[0]}/${genMeter[1]}`}
                onChange={e => {
                  const opt = METER_OPTIONS.find(m => `${m.value[0]}/${m.value[1]}` === e.target.value);
                  if (opt) setGenMeter(opt.value);
                }}
                className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
              >
                {METER_OPTIONS.map(m => (
                  <option key={m.label} value={`${m.value[0]}/${m.value[1]}`}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={e => {
                  setSelectedCountry(e.target.value);
                  if (e.target.value) loadRhythmByCountry(e.target.value);
                }}
                className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground max-w-[140px]"
              >
                <option value="">From preset…</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">BPM</span>
              <input
                type="number" min={40} max={300} value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="w-14 bg-card border border-border rounded px-2 py-1 text-xs text-foreground text-center"
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">Density</span>
              <Slider
                value={[density * 100]}
                onValueChange={([v]) => setDensity(v / 100)}
                min={0} max={100} step={1} className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-8">{Math.round(density * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">Complexity</span>
              <Slider
                value={[complexity * 100]}
                onValueChange={([v]) => setComplexity(v / 100)}
                min={0} max={100} step={1} className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-8">{Math.round(complexity * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">Swing</span>
              <Slider
                value={[swingAmount * 100]}
                onValueChange={([v]) => setSwingAmount(v / 100)}
                min={0} max={100} step={1} className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-8">{Math.round(swingAmount * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Sparkles size={14} /> Generate Rhythm
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adaptiveMode}
                  onChange={e => {
                    setAdaptiveMode(e.target.checked);
                    if (e.target.checked) adaptiveEngine.reset();
                  }}
                  className="accent-primary"
                />
                <span className="text-[10px] text-muted-foreground">Adaptive</span>
              </label>
              {adaptiveMode && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground">Strength</span>
                  <input
                    type="range" min={10} max={100}
                    value={variationStrength * 100}
                    onChange={e => setVariationStrength(Number(e.target.value) / 100)}
                    className="w-16 accent-primary h-1"
                  />
                  <span className="text-[9px] text-muted-foreground w-6">{Math.round(variationStrength * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step Sequencer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" /> Pattern
          </span>
          <button
            onClick={() => {
              setPattern(new Array(stepMode).fill(0));
              setVelocityPattern(new Array(stepMode).fill(0));
            }}
            className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-accent"
          >
            Clear
          </button>
        </div>
        <StepSequencer
          pattern={effectivePattern}
          velocityPattern={effectiveVelocity}
          onChange={handlePatternChange}
          stepMode={stepMode}
          onStepModeChange={setStepMode}
          currentStep={currentStep}
        />
      </div>

      {/* Morph */}
      {showMorph && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Groove Morph</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground shrink-0">Current</span>
            <Slider
              value={[morphAmount * 100]}
              onValueChange={([v]) => setMorphAmount(v / 100)}
              min={0} max={100} step={1} className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">Secondary</span>
            <span className="text-[10px] text-muted-foreground w-8">{Math.round(morphAmount * 100)}%</span>
          </div>
          {morphSources.length >= 2 && (
            <PatternMorpher
              sources={morphSources}
              onResult={(p, v) => {
                setSecondaryPattern(p);
                setSecondaryVelocity(v);
              }}
            />
          )}
        </div>
      )}

      {/* Transport */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setPlaying(!playing)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm',
            playing
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          disabled={effectivePattern.every(s => s === 0)}
        >
          {playing ? <Square size={14} /> : <Play size={14} />}
          {playing ? 'Stop' : 'Play'}
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-muted-foreground">BPM</span>
          <input type="range" min={40} max={300} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-20 accent-primary" />
          <span className="text-xs font-medium text-foreground w-8">{activeBpm}</span>
        </div>
      </div>

      {/* Blipblox */}
      {showBlipblox && (
        <Suspense fallback={<div className="text-xs text-muted-foreground p-3">Loading Blipblox…</div>}>
          <BlipbloxConnector root={root} mode={mode} presets={DRUM_PRESETS} />
        </Suspense>
      )}

      {/* Export */}
      {showExport && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Export</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMidi}
              disabled={effectivePattern.every(s => s === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Download size={12} /> MIDI File
            </button>
            <button
              onClick={handleExportJson}
              disabled={effectivePattern.every(s => s === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Download size={12} /> JSON Pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRhythmEngine;
