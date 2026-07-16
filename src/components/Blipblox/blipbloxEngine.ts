import { getAudioContext } from "@/music-core/audioContext";
// Blipblox MIDI Engine — Web MIDI + SysEx + AudioContext scheduling

export type BlipbloxDeviceType = 'mytracks' | 'sk2' | 'afterdark';
export type SyncMode = 'internal' | 'midi-clock' | 'link';

export interface SyncStatus {
  mode: SyncMode;
  isLocked: boolean;
  drift: number;
  peerCount: number;
  externalBpm: number | null;
}

export interface BlipbloxMidiDevice {
  id: string;
  name: string;
  output: MIDIOutput;
}

export interface StepPattern {
  midiPattern: number[];
  velocityPattern?: number[];
  bpm: number;
}

// LRU cache for translated patterns
class PatternCache {
  private cache = new Map<string, StepPattern>();
  private maxSize = 20;

  get(key: string): StepPattern | undefined {
    const val = this.cache.get(key);
    if (val) {
      this.cache.delete(key);
      this.cache.set(key, val);
    }
    return val;
  }

  set(key: string, value: StepPattern) {
    if (this.cache.size >= this.maxSize) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, value);
  }
}

class BlipbloxEngine {
  private midiAccess: MIDIAccess | null = null;
  private output: MIDIOutput | null = null;
  private isPlaying = false;
  private stepIndex = 0;
  private nextStepTime = 0;
  private timerHandle: number | null = null;
  private clockIntervalId: number | null = null;
  private currentPattern: StepPattern | null = null;
  private currentChannel = 0;
  private currentNote = 36; // default kick
  private onStepCallback: ((step: number) => void) | null = null;
  private stepCallbackTimers: number[] = [];
  public cache = new PatternCache();

  // ─── Sync state ─────────────────────────────────────────────
  private syncMode: SyncMode = 'internal';
  private externalBpm: number | null = null;
  private clockTimestamps: number[] = [];
  private clockInputListener: ((e: MIDIMessageEvent) => void) | null = null;
  private onTempoChangeCallback: ((bpm: number) => void) | null = null;
  private syncLocked = false;
  private syncDrift = 0;

  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) return false;
    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      return true;
    } catch {
      try {
        this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        return true;
      } catch {
        return false;
      }
    }
  }

  getOutputs(): BlipbloxMidiDevice[] {
    if (!this.midiAccess) return [];
    const devices: BlipbloxMidiDevice[] = [];
    this.midiAccess.outputs.forEach((output) => {
      devices.push({ id: output.id, name: output.name || `MIDI ${output.id}`, output });
    });
    return devices;
  }

  detectBlipblox(): BlipbloxMidiDevice | null {
    const outputs = this.getOutputs();
    const keywords = ['blipblox', 'blip', 'playtime'];
    return outputs.find(d => keywords.some(k => d.name.toLowerCase().includes(k))) || null;
  }

  connect(deviceId: string): boolean {
    if (!this.midiAccess) return false;
    const output = this.midiAccess.outputs.get(deviceId);
    if (output) {
      this.output = output;
      return true;
    }
    return false;
  }

  disconnect() {
    this.stopLoop();
    this.stopClock();
    this.detachClockInput();
    if (this.output) {
      this.sendAllNotesOff();
      this.output = null;
    }
  }

  isConnected(): boolean {
    return this.output !== null;
  }

  getConnectedDevice(): BlipbloxMidiDevice | null {
    if (!this.output) return null;
    return { id: this.output.id, name: this.output.name || 'Unknown', output: this.output };
  }

  // ─── Note sending ──────────────────────────────────────────
  sendNote(note: number, velocity: number, channel: number, durationMs = 100, whenMs = performance.now()) {
    if (!this.output) return;
    const on = 0x90 | (channel & 0x0F);
    const off = 0x80 | (channel & 0x0F);
    const vel = Math.max(0, Math.min(127, Math.round(velocity)));
    this.output.send([on, note, vel], whenMs);
    this.output.send([off, note, 0], whenMs + durationMs);
  }

  sendCC(cc: number, value: number, channel: number) {
    if (!this.output) return;
    this.output.send([0xB0 | (channel & 0x0F), cc & 0x7F, value & 0x7F]);
  }

  sendAllNotesOff(channel = 0) {
    if (!this.output) return;
    this.output.send([0xB0 | (channel & 0x0F), 123, 0]);
  }

  // ─── SysEx ─────────────────────────────────────────────────
  sendSysex(data: Uint8Array | number[]) {
    if (!this.output) return;
    const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (arr[0] !== 0xF0) {
      const framed = new Uint8Array(arr.length + 2);
      framed[0] = 0xF0;
      framed.set(arr, 1);
      framed[framed.length - 1] = 0xF7;
      this.output.send(framed);
    } else {
      this.output.send(arr);
    }
  }

  async loadSysexFile(file: File): Promise<Uint8Array> {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    this.sendSysex(data);
    return data;
  }

  // ─── MIDI Clock Output ────────────────────────────────────
  startClock(bpm: number) {
    this.stopClock();
    if (!this.output) return;
    this.output.send([0xFA]);
    const intervalMs = (60000 / bpm) / 24;
    this.clockIntervalId = window.setInterval(() => {
      this.output?.send([0xF8]);
    }, intervalMs);
  }

  stopClock() {
    if (this.clockIntervalId !== null) {
      clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }
    this.output?.send([0xFC]);
  }

  // ─── Sync Mode Management ─────────────────────────────────
  setSyncMode(mode: SyncMode) {
    this.detachClockInput();
    this.syncMode = mode;
    this.syncLocked = false;
    this.syncDrift = 0;
    this.externalBpm = null;

    if (mode === 'midi-clock') {
      this.attachClockInput();
    } else if (mode === 'link') {
      // Link not natively available in browser — placeholder
      // A future WebSocket bridge can call setExternalTempo()
      console.info('Ableton Link requires a native bridge. Using internal clock with Link UI.');
    }
  }

  getSyncMode(): SyncMode {
    return this.syncMode;
  }

  getSyncStatus(): SyncStatus {
    return {
      mode: this.syncMode,
      isLocked: this.syncLocked,
      drift: this.syncDrift,
      peerCount: this.syncMode === 'link' ? 0 : (this.syncMode === 'midi-clock' && this.syncLocked ? 1 : 0),
      externalBpm: this.externalBpm,
    };
  }

  setExternalTempo(bpm: number) {
    this.externalBpm = bpm;
    this.syncLocked = true;
    this.onTempoChangeCallback?.(bpm);
  }

  onTempoChange(cb: ((bpm: number) => void) | null) {
    this.onTempoChangeCallback = cb;
  }

  private attachClockInput() {
    if (!this.midiAccess) return;
    this.clockTimestamps = [];

    this.clockInputListener = (e: MIDIMessageEvent) => {
      const data = e.data;
      if (!data || data.length === 0) return;

      if (data[0] === 0xF8) {
        // MIDI clock tick — 24 PPQN
        const now = performance.now();
        this.clockTimestamps.push(now);
        // Keep last 48 ticks (2 beats) for BPM calculation
        if (this.clockTimestamps.length > 48) {
          this.clockTimestamps = this.clockTimestamps.slice(-48);
        }
        if (this.clockTimestamps.length >= 24) {
          const span = now - this.clockTimestamps[this.clockTimestamps.length - 24];
          const derivedBpm = Math.round(60000 / span);
          if (derivedBpm > 20 && derivedBpm < 400) {
            const prevBpm = this.externalBpm;
            this.externalBpm = derivedBpm;
            this.syncLocked = true;
            if (prevBpm !== null) {
              this.syncDrift = Math.abs(derivedBpm - prevBpm);
            }
            this.onTempoChangeCallback?.(derivedBpm);
          }
        }
      } else if (data[0] === 0xFA) {
        // Start
        this.clockTimestamps = [];
      } else if (data[0] === 0xFC) {
        // Stop
        this.syncLocked = false;
      }
    };

    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = this.clockInputListener;
    });
  }

  private detachClockInput() {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    this.clockInputListener = null;
    this.clockTimestamps = [];
  }

  // ─── Pattern Loop (AudioContext scheduler) ─────────────────
  private getAudioCtx(): AudioContext {
    return getAudioContext();
  }

  startLoop(
    pattern: StepPattern,
    note: number,
    channel: number,
    onStep?: (step: number) => void
  ) {
    this.stopLoop();
    this.currentPattern = pattern;
    this.currentNote = note;
    this.currentChannel = channel;
    this.onStepCallback = onStep || null;
    this.isPlaying = true;
    this.stepIndex = 0;

    const ctx = this.getAudioCtx();
    this.nextStepTime = ctx.currentTime + 0.05;
    this.scheduler();
  }

  private scheduler() {
    if (!this.isPlaying || !this.currentPattern) return;
    const ctx = this.getAudioCtx();
    const lookAhead = 0.1;
    const pattern = this.currentPattern;

    // Use external BPM if in sync mode and locked
    const activeBpm = (this.syncMode !== 'internal' && this.externalBpm) ? this.externalBpm : pattern.bpm;
    const stepDuration = 60 / activeBpm / 4;

    while (this.nextStepTime < ctx.currentTime + lookAhead) {
      const scheduledStep = this.stepIndex;
      const step = pattern.midiPattern[this.stepIndex];
      const velocity = pattern.velocityPattern?.[this.stepIndex] ?? 100;

      if (step === 1 && velocity > 0) {
        const offset = (Math.random() - 0.5) * 0.01;
        const time = Math.max(ctx.currentTime, this.nextStepTime + offset);
        const whenMs = performance.now() + Math.max(0, (time - ctx.currentTime) * 1000);
        this.sendNote(this.currentNote, velocity, this.currentChannel, stepDuration * 800, whenMs);
      }

      if (this.onStepCallback) {
        const callbackDelayMs = Math.max(0, (this.nextStepTime - ctx.currentTime) * 1000);
        const timerId = window.setTimeout(() => {
          this.onStepCallback?.(scheduledStep);
          this.stepCallbackTimers = this.stepCallbackTimers.filter(id => id !== timerId);
        }, callbackDelayMs);
        this.stepCallbackTimers.push(timerId);
      }

      this.stepIndex = (this.stepIndex + 1) % pattern.midiPattern.length;
      this.nextStepTime += stepDuration;
    }

    this.timerHandle = window.setTimeout(() => this.scheduler(), 25);
  }

  stopLoop() {
    this.isPlaying = false;
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.stepCallbackTimers.forEach(clearTimeout);
    this.stepCallbackTimers = [];
    this.sendAllNotesOff(this.currentChannel);
  }

  updatePattern(pattern: StepPattern) {
    this.currentPattern = pattern;
  }

  getIsPlaying() { return this.isPlaying; }
  getCurrentStep() { return this.stepIndex; }
}

export const blipbloxEngine = new BlipbloxEngine();
