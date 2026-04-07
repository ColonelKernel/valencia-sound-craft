// Web MIDI API output for sending chords/notes to external DAWs

const PITCH_MAP: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

export interface MidiOutputDevice {
  id: string;
  name: string;
  output: MIDIOutput;
}

let midiAccess: MIDIAccess | null = null;
let activeOutput: MIDIOutput | null = null;
let activeNoteOffs: number[] = [];

export async function requestMidiAccess(): Promise<MidiOutputDevice[]> {
  if (!navigator.requestMIDIAccess) {
    throw new Error('Web MIDI API not supported in this browser');
  }
  midiAccess = await navigator.requestMIDIAccess({ sysex: false });
  return getOutputDevices();
}

export function getOutputDevices(): MidiOutputDevice[] {
  if (!midiAccess) return [];
  const devices: MidiOutputDevice[] = [];
  midiAccess.outputs.forEach((output) => {
    devices.push({ id: output.id, name: output.name || `MIDI Output ${output.id}`, output });
  });
  return devices;
}

export function selectOutput(deviceId: string): boolean {
  if (!midiAccess) return false;
  const output = midiAccess.outputs.get(deviceId);
  if (output) {
    activeOutput = output;
    return true;
  }
  return false;
}

export function getActiveOutput(): MidiOutputDevice | null {
  if (!activeOutput) return null;
  return { id: activeOutput.id, name: activeOutput.name || 'Unknown', output: activeOutput };
}

export function isConnected(): boolean {
  return activeOutput !== null;
}

// Send note-on for a set of notes (chord)
export function sendNoteOn(notes: string[], velocity = 100, channel = 0): void {
  if (!activeOutput) return;
  const statusByte = 0x90 | (channel & 0x0F);
  activeNoteOffs = [];
  for (const note of notes) {
    const midi = PITCH_MAP[note];
    if (midi === undefined) continue;
    activeOutput.send([statusByte, midi, velocity]);
    activeNoteOffs.push(midi);
  }
}

// Send note-off for previously sent notes
export function sendNoteOff(channel = 0): void {
  if (!activeOutput) return;
  const statusByte = 0x80 | (channel & 0x0F);
  for (const midi of activeNoteOffs) {
    activeOutput.send([statusByte, midi, 0]);
  }
  activeNoteOffs = [];
}

// Send a chord with automatic note-off after duration (ms)
export function sendChord(notes: string[], durationMs: number, velocity = 100, channel = 0): void {
  sendNoteOn(notes, velocity, channel);
  setTimeout(() => sendNoteOff(channel), durationMs);
}

// Send a single note
export function sendSingleNote(note: string, durationMs = 500, velocity = 100, channel = 0): void {
  if (!activeOutput) return;
  const midi = PITCH_MAP[note];
  if (midi === undefined) return;
  const onByte = 0x90 | (channel & 0x0F);
  const offByte = 0x80 | (channel & 0x0F);
  activeOutput.send([onByte, midi, velocity]);
  setTimeout(() => activeOutput?.send([offByte, midi, 0]), durationMs);
}

// All notes off (panic)
export function sendAllNotesOff(channel = 0): void {
  if (!activeOutput) return;
  // CC 123 = All Notes Off
  activeOutput.send([0xB0 | (channel & 0x0F), 123, 0]);
  activeNoteOffs = [];
}

export function disconnect(): void {
  if (activeOutput) {
    sendAllNotesOff();
    activeOutput = null;
  }
}
