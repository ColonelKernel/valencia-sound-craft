// Harmonic Engine — links rhythm to pitched MIDI output

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const ROOT_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71,
};

export interface HarmonicResult {
  notes: number[];
  velocities: number[];
}

/**
 * Generate pitched MIDI notes from a rhythm pattern.
 * Strong beats → chord tones (1, 3, 5)
 * Weak beats → passing tones
 * Dense patterns → arpeggiation
 * Sparse patterns → sustained root/fifth
 */
export function generateHarmonic(
  midiPattern: number[],
  velocityPattern: number[],
  key: string,
  mode: string
): HarmonicResult {
  const rootMidi = ROOT_MIDI[key] || 60;
  const intervals = SCALE_INTERVALS[mode.toLowerCase()] || SCALE_INTERVALS.major;
  const scaleNotes = intervals.map(i => rootMidi + i);

  // Chord tones: root (0), third (2), fifth (4) indices into scale
  const chordToneIndices = [0, 2, 4].filter(i => i < scaleNotes.length);
  const chordTones = chordToneIndices.map(i => scaleNotes[i]);

  const density = midiPattern.filter(s => s > 0).length / midiPattern.length;
  const notes: number[] = [];
  const velocities: number[] = [];

  let arpIndex = 0;
  const beatInterval = Math.max(2, Math.round(midiPattern.length / 4));

  for (let i = 0; i < midiPattern.length; i++) {
    if (midiPattern[i] === 0) {
      notes.push(-1); // rest
      velocities.push(0);
      continue;
    }

    const vel = velocityPattern[i] || 100;
    const isStrongBeat = i % beatInterval === 0;
    const isAccent = vel >= 90;

    let note: number;

    if (density > 0.5) {
      // Dense: arpeggiate through scale
      note = scaleNotes[arpIndex % scaleNotes.length];
      arpIndex++;
    } else if (isStrongBeat || isAccent) {
      // Strong beat: chord tone
      note = chordTones[arpIndex % chordTones.length];
      arpIndex++;
    } else {
      // Weak beat: passing tone
      const passingIndices = intervals.length > 5
        ? [1, 3, 5].filter(idx => idx < scaleNotes.length)
        : [1, 3].filter(idx => idx < scaleNotes.length);
      note = scaleNotes[passingIndices[arpIndex % passingIndices.length] || 0];
      arpIndex++;
    }

    notes.push(note);
    velocities.push(vel);
  }

  return { notes, velocities };
}
