import { useState, useEffect, useCallback, useRef } from 'react';
import { Usb, Play, Square, Upload, ChevronDown, ChevronRight, Zap, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { blipbloxEngine, type BlipbloxMidiDevice, type BlipbloxDeviceType } from './blipbloxEngine';
import { translateForMyTracks, translateForSK2, translateForAfterDark, getDeviceNote } from './deviceProfiles';
import { mapGroove, normalizeMeter, splitPolyrhythm } from './rhythmTranslator';
import StepSequencer from './StepSequencer';
import PatternMorpher from './PatternMorpher';
import type { PatternPreset } from '../DrumMachine/drumPresets';

interface BlipbloxConnectorProps {
  /** Current root note from ModeVisualizer (for SK2 scale awareness) */
  root?: string;
  /** Current mode/scale name */
  mode?: string;
  /** Embedded preset from DrumMachine */
  embeddedPreset?: PatternPreset;
  /** All available presets for morpher */
  presets?: PatternPreset[];
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'sending';

const BlipbloxConnector = ({ root = 'C', mode = 'major', embeddedPreset, presets = [] }: BlipbloxConnectorProps) => {
  const [outputs, setOutputs] = useState<BlipbloxMidiDevice[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [deviceType, setDeviceType] = useState<BlipbloxDeviceType>('mytracks');
  const [channel, setChannel] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [bpm, setBpm] = useState(120);
  const [stepMode, setStepMode] = useState<16 | 32>(16);
  const [midiSupported, setMidiSupported] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showMorpher, setShowMorpher] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ccNumber, setCcNumber] = useState(1);
  const [evolve, setEvolve] = useState(false);
  const [octave, setOctave] = useState(4);

  // Pattern state
  const [pattern, setPattern] = useState<number[]>(new Array(16).fill(0));
  const [velocityPattern, setVelocityPattern] = useState<number[]>(new Array(16).fill(0));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Init MIDI
  useEffect(() => {
    const init = async () => {
      const ok = await blipbloxEngine.init();
      setMidiSupported(ok);
      if (ok) {
        const outs = blipbloxEngine.getOutputs();
        setOutputs(outs);
        // Auto-detect
        const detected = blipbloxEngine.detectBlipblox();
        if (detected) setSelectedOutputId(detected.id);
        else if (outs.length > 0) setSelectedOutputId(outs[0].id);
      }
    };
    init();
  }, []);

  // Load embedded preset
  useEffect(() => {
    if (embeddedPreset) {
      setBpm(embeddedPreset.bpm);
      // Use first track's pattern
      const track = embeddedPreset.tracks[0];
      if (track) {
        const groove = mapGroove(track.steps);
        setPattern(groove.midiPattern);
        setVelocityPattern(groove.velocityPattern);
      }
    }
  }, [embeddedPreset]);

  const connect = useCallback(() => {
    if (!selectedOutputId) return;
    setStatus('connecting');
    const ok = blipbloxEngine.connect(selectedOutputId);
    setStatus(ok ? 'connected' : 'disconnected');
  }, [selectedOutputId]);

  const disconnect = useCallback(() => {
    blipbloxEngine.disconnect();
    setStatus('disconnected');
    setCurrentStep(-1);
  }, []);

  const sendPattern = useCallback(() => {
    if (status !== 'connected') return;
    setStatus('sending');

    const note = getDeviceNote(deviceType);

    if (deviceType === 'mytracks') {
      const { pattern: translated } = translateForMyTracks(pattern, velocityPattern, bpm, { stepMode });
      blipbloxEngine.startLoop(translated, note, channel, (step) => setCurrentStep(step));
    } else if (deviceType === 'sk2') {
      const { patterns } = translateForSK2(pattern, velocityPattern, bpm, {
        root,
        scale: mode,
        octave,
      });
      if (patterns.length > 0) {
        blipbloxEngine.startLoop(patterns[0].pattern, patterns[0].note, channel, (step) => setCurrentStep(step));
      }
    } else {
      const { ccMessages, pattern: translated } = translateForAfterDark(pattern, velocityPattern, bpm, {
        ccNumber: ccNumber,
        evolve,
      });
      // Send CC messages as pattern plays
      blipbloxEngine.startLoop(translated, note, channel, (step) => {
        setCurrentStep(step);
        const msg = ccMessages.find(m => m.step === step);
        if (msg) blipbloxEngine.sendCC(msg.cc, msg.value, channel);
      });
    }
  }, [status, pattern, velocityPattern, bpm, deviceType, channel, stepMode, root, mode, octave, ccNumber, evolve]);

  const stopPattern = useCallback(() => {
    blipbloxEngine.stopLoop();
    setStatus('connected');
    setCurrentStep(-1);
  }, []);

  const handleSysexUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await blipbloxEngine.loadSysexFile(file);
  }, []);

  const handlePatternChange = useCallback((p: number[], v: number[]) => {
    setPattern(p);
    setVelocityPattern(v);
  }, []);

  const refreshDevices = useCallback(async () => {
    await blipbloxEngine.init();
    setOutputs(blipbloxEngine.getOutputs());
  }, []);

  // Build morpher sources from presets
  const morpherSources = presets.slice(0, 10).map(p => ({
    name: p.name,
    midiPattern: mapGroove(p.tracks[0]?.steps || []).midiPattern,
    velocityPattern: mapGroove(p.tracks[0]?.steps || []).velocityPattern,
  }));

  const statusColor = {
    disconnected: 'bg-muted-foreground/30',
    connecting: 'bg-amber-500 animate-pulse',
    connected: 'bg-emerald-500',
    sending: 'bg-primary animate-pulse',
  }[status];

  if (!midiSupported) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
        <Usb className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium text-foreground">Web MIDI not supported</p>
        <p className="text-xs text-muted-foreground">
          Use Chrome, Edge, or Opera to connect MIDI devices.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Blipblox Connector
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Connect to MyTracks, SK2, or After Dark via MIDI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('w-2.5 h-2.5 rounded-full', statusColor)} />
          <span className="text-[10px] text-muted-foreground capitalize">{status}</span>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] text-muted-foreground block mb-1">MIDI Device</label>
          <div className="flex gap-1">
            <select
              value={selectedOutputId}
              onChange={e => setSelectedOutputId(e.target.value)}
              className="flex-1 bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
            >
              <option value="">Select device...</option>
              {outputs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <button
              onClick={refreshDevices}
              className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent"
              title="Refresh devices"
            >
              ↻
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Device Type</label>
          <select
            value={deviceType}
            onChange={e => setDeviceType(e.target.value as BlipbloxDeviceType)}
            className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground"
          >
            <option value="mytracks">MyTracks</option>
            <option value="sk2">SK2</option>
            <option value="afterdark">After Dark</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Channel</label>
          <select
            value={channel}
            onChange={e => setChannel(Number(e.target.value))}
            className="bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground w-16"
          >
            {Array.from({ length: 16 }, (_, i) => (
              <option key={i} value={i}>{i + 1}</option>
            ))}
          </select>
        </div>

        <button
          onClick={status === 'disconnected' || status === 'connecting' ? connect : disconnect}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
            status === 'connected' || status === 'sending'
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {status === 'connected' || status === 'sending' ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Device-specific options */}
      {(status === 'connected' || status === 'sending') && (
        <>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Device Options
          </button>

          {showAdvanced && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">BPM</span>
                  <input
                    type="number" min={40} max={300} value={bpm}
                    onChange={e => setBpm(Number(e.target.value))}
                    className="w-16 bg-card border border-border rounded px-2 py-1 text-xs text-foreground text-center"
                  />
                </div>

                {deviceType === 'mytracks' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Step Mode</span>
                    {([16, 32] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setStepMode(m)}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded',
                          stepMode === m ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                {deviceType === 'sk2' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Root</span>
                      <span className="text-xs font-medium text-foreground">{root}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Scale</span>
                      <span className="text-xs font-medium text-foreground">{mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Octave</span>
                      <input
                        type="number" min={1} max={7} value={octave}
                        onChange={e => setOctave(Number(e.target.value))}
                        className="w-12 bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground text-center"
                      />
                    </div>
                  </>
                )}

                {deviceType === 'afterdark' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">CC#</span>
                      <input
                        type="number" min={0} max={127} value={ccNumber}
                        onChange={e => setCcNumber(Number(e.target.value))}
                        className="w-14 bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground text-center"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox" checked={evolve}
                        onChange={e => setEvolve(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-[10px] text-muted-foreground">Evolving</span>
                    </label>
                  </>
                )}
              </div>

              {/* SysEx upload */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Upload className="w-3 h-3" /> Load .syx
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".syx,.SYX"
                  onChange={handleSysexUpload}
                  className="hidden"
                />
                <span className="text-[9px] text-muted-foreground">Upload SysEx preset file</span>
              </div>
            </div>
          )}

          {/* Step Sequencer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Pattern</span>
              <div className="flex gap-1">
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
            </div>
            <StepSequencer
              pattern={pattern}
              velocityPattern={velocityPattern}
              onChange={handlePatternChange}
              stepMode={stepMode}
              onStepModeChange={setStepMode}
              currentStep={currentStep}
            />
          </div>

          {/* Transport */}
          <div className="flex items-center gap-2">
            {status === 'sending' ? (
              <button
                onClick={stopPattern}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
              >
                <Square size={14} /> Stop
              </button>
            ) : (
              <button
                onClick={sendPattern}
                disabled={pattern.every(s => s === 0)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                <Play size={14} /> Send to Device
              </button>
            )}

            <button
              onClick={() => {
                blipbloxEngine.startClock(bpm);
              }}
              className="text-[10px] px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              Start Clock
            </button>
            <button
              onClick={() => blipbloxEngine.stopClock()}
              className="text-[10px] px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              Stop Clock
            </button>
          </div>

          {/* Pattern Morpher */}
          {morpherSources.length >= 2 && (
            <div>
              <button
                onClick={() => setShowMorpher(!showMorpher)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showMorpher ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <Music className="w-3.5 h-3.5" />
                Pattern Morpher
              </button>
              {showMorpher && (
                <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border">
                  <PatternMorpher
                    sources={morpherSources}
                    onResult={(p, v) => {
                      setPattern(p);
                      setVelocityPattern(v);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preset info tooltip */}
          {embeddedPreset && (
            <div className="p-2 rounded-md bg-secondary/20 border border-border/50 text-[10px] text-muted-foreground space-y-0.5">
              <div className="font-medium text-foreground">{embeddedPreset.name}</div>
              <div>{embeddedPreset.region} · {embeddedPreset.country} · {embeddedPreset.timeSignature[0]}/{embeddedPreset.timeSignature[1]}</div>
              <div className="italic">{embeddedPreset.description}</div>
              {embeddedPreset.culturalDescription && (
                <div className="text-primary/70">{embeddedPreset.culturalDescription}</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlipbloxConnector;
