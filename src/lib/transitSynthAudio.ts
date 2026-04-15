import type { TransitSequenceEvent, TransitSonicProfile, TransitStationSoundProfile } from "./transitSynthEngine";

export type TransitWaveform = "sine" | "square" | "sawtooth" | "fm" | "wavetable";

export interface TransitAudioSettings extends TransitSonicProfile {
  waveform: TransitWaveform;
  tempo: number;
  masterGain: number;
}

export const TRANSIT_WAVEFORM_OPTIONS: { id: TransitWaveform; label: string }[] = [
  { id: "sine", label: "Sine" },
  { id: "square", label: "Square" },
  { id: "sawtooth", label: "Sawtooth" },
  { id: "fm", label: "FM" },
  { id: "wavetable", label: "Wavetable" },
];

class TransitSynthAudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbWet: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoDepth: GainNode | null = null;
  private scheduledTimeouts = new Set<number>();
  private activeVoiceStops = new Set<() => void>();

  get ready() {
    return this.context !== null;
  }

  async arm(settings: TransitAudioSettings) {
    const context = this.ensureContext();
    if (context.state === "suspended") {
      await context.resume();
    }
    this.applySettings(settings);
  }

  stop() {
    this.scheduledTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.scheduledTimeouts.clear();
    this.activeVoiceStops.forEach((stopVoice) => stopVoice());
    this.activeVoiceStops.clear();
  }

  async playStation(profile: TransitStationSoundProfile, settings: TransitAudioSettings, durationSeconds?: number) {
    await this.arm(settings);
    const secondsPerBeat = 60 / settings.tempo;
    this.playVoice(profile, settings, durationSeconds ?? profile.durationBeats * secondsPerBeat * 0.9);
  }

  async playSequence(
    events: TransitSequenceEvent[],
    settings: TransitAudioSettings,
    callbacks?: {
      onEventStart?: (event: TransitSequenceEvent, eventIndex: number) => void;
      onSequenceEnd?: () => void;
    },
  ) {
    await this.arm(settings);
    this.stop();

    const secondsPerBeat = 60 / settings.tempo;
    const endBeat = Math.max(...events.map((event) => event.startBeat + event.durationBeats), 0);

    events.forEach((event, eventIndex) => {
      const timeoutId = window.setTimeout(() => {
        callbacks?.onEventStart?.(event, eventIndex);
        this.playVoice(event, settings, event.durationBeats * secondsPerBeat * 0.88);
      }, event.startBeat * secondsPerBeat * 1000);

      this.scheduledTimeouts.add(timeoutId);
    });

    const finishTimeout = window.setTimeout(() => {
      callbacks?.onSequenceEnd?.();
      this.scheduledTimeouts.delete(finishTimeout);
    }, endBeat * secondsPerBeat * 1000 + 60);

    this.scheduledTimeouts.add(finishTimeout);
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.initializeGraph(this.context);
    }

    return this.context;
  }

  private initializeGraph(context: AudioContext) {
    this.masterGain = context.createGain();
    this.masterFilter = context.createBiquadFilter();
    this.masterCompressor = context.createDynamicsCompressor();
    this.delayNode = context.createDelay(1.2);
    this.delayFeedback = context.createGain();
    this.delayWet = context.createGain();
    this.reverbNode = context.createConvolver();
    this.reverbWet = context.createGain();
    this.lfo = context.createOscillator();
    this.lfoDepth = context.createGain();

    this.masterFilter.type = "lowpass";
    this.masterFilter.Q.value = 0.9;
    this.masterCompressor.threshold.value = -18;
    this.masterCompressor.knee.value = 18;
    this.masterCompressor.ratio.value = 3;
    this.masterCompressor.attack.value = 0.01;
    this.masterCompressor.release.value = 0.18;

    this.delayNode.delayTime.value = 0.21;
    this.delayFeedback.gain.value = 0.26;
    this.delayWet.gain.value = 0.18;
    this.reverbWet.gain.value = 0.22;
    this.reverbNode.buffer = this.buildImpulseResponse(context, 1.8);

    this.masterFilter.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(context.destination);

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.masterFilter);

    this.reverbNode.connect(this.reverbWet);
    this.reverbWet.connect(this.masterFilter);

    this.lfo.type = "sine";
    this.lfo.frequency.value = 0.19;
    this.lfoDepth.gain.value = 120;
    this.lfo.connect(this.lfoDepth);
    this.lfoDepth.connect(this.masterFilter.frequency);
    this.lfo.start();
  }

  private applySettings(settings: TransitAudioSettings) {
    if (!this.masterGain || !this.masterFilter || !this.delayFeedback || !this.delayWet || !this.reverbWet || !this.lfoDepth) {
      return;
    }

    this.masterGain.gain.setTargetAtTime(settings.masterGain, this.ensureContext().currentTime, 0.04);
    this.masterFilter.frequency.setTargetAtTime(settings.filterCutoffHz, this.ensureContext().currentTime, 0.06);
    this.masterFilter.Q.setTargetAtTime(0.8 + settings.densitySignal * 3.4, this.ensureContext().currentTime, 0.08);
    this.delayFeedback.gain.setTargetAtTime(clamp(settings.delayMix * 0.7, 0.08, 0.42), this.ensureContext().currentTime, 0.06);
    this.delayWet.gain.setTargetAtTime(settings.delayMix, this.ensureContext().currentTime, 0.06);
    this.reverbWet.gain.setTargetAtTime(settings.reverbMix, this.ensureContext().currentTime, 0.06);
    this.lfoDepth.gain.setTargetAtTime(settings.modulationDepth * 520, this.ensureContext().currentTime, 0.06);
  }

  private buildImpulseResponse(context: AudioContext, seconds: number) {
    const sampleRate = context.sampleRate;
    const impulse = context.createBuffer(2, sampleRate * seconds, sampleRate);

    for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
      const channelData = impulse.getChannelData(channelIndex);
      for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
        const decay = Math.pow(1 - sampleIndex / channelData.length, 2.6);
        channelData[sampleIndex] = (Math.random() * 2 - 1) * decay;
      }
    }

    return impulse;
  }

  private createPeriodicWave(lineColor: string) {
    const context = this.ensureContext();
    const hue = hexToHue(lineColor);
    const harmonics = 8;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);

    for (let harmonic = 1; harmonic < harmonics; harmonic += 1) {
      const weight = clamp((Math.sin((hue / 360) * Math.PI * harmonic) + 1) / 2, 0.1, 1);
      imag[harmonic] = weight / harmonic;
      real[harmonic] = (1 - weight) / (harmonic + 1);
    }

    return context.createPeriodicWave(real, imag);
  }

  private playVoice(
    profile: Pick<TransitStationSoundProfile, "frequency" | "velocity" | "pan" | "lineColor">,
    settings: TransitAudioSettings,
    durationSeconds: number,
  ) {
    const context = this.ensureContext();
    this.applySettings(settings);

    const amp = context.createGain();
    const panner = context.createStereoPanner();
    const toneFilter = context.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.frequency.value = settings.filterCutoffHz * (0.72 + profile.velocity * 0.42);
    toneFilter.Q.value = 0.7 + settings.densitySignal * 1.2;

    amp.gain.setValueAtTime(0.0001, context.currentTime);
    amp.gain.linearRampToValueAtTime(profile.velocity * 0.42, context.currentTime + 0.02);
    amp.gain.linearRampToValueAtTime(profile.velocity * 0.24, context.currentTime + 0.14);
    amp.gain.setValueAtTime(profile.velocity * 0.24, context.currentTime + durationSeconds * 0.65);
    amp.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationSeconds + 0.18);
    panner.pan.value = profile.pan;

    const voiceOutput = context.createGain();
    voiceOutput.connect(toneFilter);
    toneFilter.connect(panner);
    panner.connect(amp);

    if (this.masterFilter && this.delayNode && this.reverbNode) {
      amp.connect(this.masterFilter);

      const delaySend = context.createGain();
      const reverbSend = context.createGain();
      delaySend.gain.value = settings.delayMix;
      reverbSend.gain.value = settings.reverbMix;
      amp.connect(delaySend);
      amp.connect(reverbSend);
      delaySend.connect(this.delayNode);
      reverbSend.connect(this.reverbNode);
    }

    const stopHandlers: (() => void)[] = [];

    if (settings.waveform === "fm") {
      const carrier = context.createOscillator();
      const modulator = context.createOscillator();
      const modulationGain = context.createGain();
      carrier.type = "sine";
      modulator.type = "sine";
      carrier.frequency.value = profile.frequency;
      modulator.frequency.value = profile.frequency * 1.5;
      modulationGain.gain.value = 40 + settings.modulationDepth * 180;
      modulator.connect(modulationGain);
      modulationGain.connect(carrier.frequency);
      carrier.connect(voiceOutput);
      carrier.start();
      modulator.start();
      carrier.stop(context.currentTime + durationSeconds + 0.2);
      modulator.stop(context.currentTime + durationSeconds + 0.2);
      stopHandlers.push(() => {
        carrier.stop();
        modulator.stop();
      });
    } else {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = profile.frequency;

      if (settings.waveform === "wavetable") {
        oscillator.setPeriodicWave(this.createPeriodicWave(profile.lineColor));
      } else {
        oscillator.type = settings.waveform;
      }

      oscillator.connect(voiceOutput);
      oscillator.start();
      oscillator.stop(context.currentTime + durationSeconds + 0.2);
      stopHandlers.push(() => oscillator.stop());

      if (settings.waveform === "square" || settings.waveform === "sawtooth" || settings.waveform === "wavetable") {
        const subOscillator = context.createOscillator();
        const subGain = context.createGain();
        subOscillator.type = "sine";
        subOscillator.frequency.value = profile.frequency / 2;
        subGain.gain.value = 0.08 + settings.densitySignal * 0.04;
        subOscillator.connect(subGain);
        subGain.connect(voiceOutput);
        subOscillator.start();
        subOscillator.stop(context.currentTime + durationSeconds + 0.16);
        stopHandlers.push(() => subOscillator.stop());
      }
    }

    const stopVoice = () => {
      stopHandlers.forEach((handler) => {
        try {
          handler();
        } catch {
          // Voice may already be stopped.
        }
      });
      this.activeVoiceStops.delete(stopVoice);
    };

    this.activeVoiceStops.add(stopVoice);
    window.setTimeout(stopVoice, (durationSeconds + 0.24) * 1000);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToHue(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;

  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return Math.round(hue * 60 < 0 ? hue * 60 + 360 : hue * 60);
}

export const transitSynthAudio = new TransitSynthAudioEngine();
