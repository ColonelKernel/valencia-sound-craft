export interface ModeReferenceStep {
  note: string;
  octave: number;
}

export const MODE_REFERENCE_START_OCTAVE = 3;
export const MODE_REFERENCE_OCTAVES = 1;

const PITCH_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function buildModeReferenceSequence(
  notes: string[],
  startOctave = MODE_REFERENCE_START_OCTAVE,
  octaves = MODE_REFERENCE_OCTAVES
): ModeReferenceStep[] {
  if (notes.length === 0 || octaves < 1) return [];

  const sequence: ModeReferenceStep[] = [];
  let currentOctave = startOctave;
  let previousPitch: number | null = null;

  const pushNote = (note: string) => {
    const pitch = PITCH_INDEX[note];
    if (pitch === undefined) return;
    if (previousPitch !== null && pitch <= previousPitch) {
      currentOctave += 1;
    }
    sequence.push({ note, octave: currentOctave });
    previousPitch = pitch;
  };

  for (let octaveIndex = 0; octaveIndex < octaves; octaveIndex += 1) {
    notes.forEach(pushNote);
  }

  pushNote(notes[0]);

  return sequence;
}
