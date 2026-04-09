import type {
  DegreeBasedChord,
  ProgressionChord,
} from "@/components/ModeVisualizer/chordProgressionUtils";
import type { ChordSpelling } from "@/components/ModeVisualizer/scaleData";

function equalStringArrays(left: string[], right: string[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function equalOptionalStringArrays(left?: string[], right?: string[]) {
  if (!left || !right) {
    return left === right;
  }

  return equalStringArrays(left, right);
}

function equalChordSpellings(left: ChordSpelling, right: ChordSpelling) {
  return (
    left.symbol === right.symbol &&
    left.rootNote === right.rootNote &&
    left.name === right.name &&
    equalStringArrays(left.notes, right.notes) &&
    equalStringArrays(left.intervals, right.intervals)
  );
}

function equalDegreeRefs(left?: DegreeBasedChord, right?: DegreeBasedChord) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.degree === right.degree &&
    left.quality === right.quality &&
    left.source === right.source &&
    left.sourceLabel === right.sourceLabel &&
    left.rootSemitone === right.rootSemitone &&
    left.extension === right.extension &&
    left.voicing === right.voicing &&
    equalOptionalStringArrays(left.notes, right.notes) &&
    equalStringArrays(left.alterations, right.alterations)
  );
}

export function equalProgressions(left: ProgressionChord[], right: ProgressionChord[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];

    return (
      entry.source === nextEntry.source &&
      entry.sourceLabel === nextEntry.sourceLabel &&
      entry.function === nextEntry.function &&
      equalChordSpellings(entry.chord, nextEntry.chord) &&
      equalDegreeRefs(entry.degreeRef, nextEntry.degreeRef)
    );
  });
}

function cloneDegreeRef(degreeRef?: DegreeBasedChord): DegreeBasedChord | undefined {
  if (!degreeRef) {
    return undefined;
  }

  return {
    ...degreeRef,
    alterations: [...degreeRef.alterations],
    notes: degreeRef.notes ? [...degreeRef.notes] : undefined,
  };
}

export function cloneProgression(progression: ProgressionChord[]) {
  return progression.map((entry) => ({
    ...entry,
    chord: {
      ...entry.chord,
      notes: [...entry.chord.notes],
      intervals: [...entry.chord.intervals],
    },
    degreeRef: cloneDegreeRef(entry.degreeRef),
  }));
}
