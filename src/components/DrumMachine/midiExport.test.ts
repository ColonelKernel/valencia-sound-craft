import { describe, expect, it } from "vitest";

import { generateMidiFile, type ExportTrack } from "./midiExport";

/**
 * The MIDI export's swing branch had no reachable caller: GlobalRhythmEngine
 * passed a hardcoded 0, so a visitor who set the slider to 30%, listened, and
 * exported got a straight file. Its comment also claimed it swung
 * "even-indexed steps (off-beats)" while testing `stepIdx % 2 === 1` — two
 * claims that cannot both hold.
 *
 * These parse the bytes rather than trusting either. The convention being
 * pinned is the audio engine's, which is the one the visitor hears:
 * getSwingAdjustedStepAdvance lengthens even steps to (1 + s)·d, so odd
 * onsets land s·d late and even onsets stay on the grid.
 */

const PPQ = 480;
/** 4/4, one bar, 4 steps → a step is a quarter note. */
const TICKS_PER_STEP = PPQ;

/** Minimal format-0 reader: enough to recover note-on ticks. */
function noteOnTicks(bytes: Uint8Array): number[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("MThd");
  expect(view.getUint16(12)).toBe(PPQ);

  let i = 14;
  expect(String.fromCharCode(...bytes.slice(i, i + 4))).toBe("MTrk");
  const end = i + 8 + view.getUint32(i + 4);
  i += 8;

  const ticks: number[] = [];
  let tick = 0;
  while (i < end) {
    let delta = 0;
    for (;;) {
      const b = bytes[i++];
      delta = (delta << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) break;
    }
    tick += delta;

    const status = bytes[i++];
    if (status === 0xff) {
      const type = bytes[i++];
      let len = 0;
      for (;;) {
        const b = bytes[i++];
        len = (len << 7) | (b & 0x7f);
        if ((b & 0x80) === 0) break;
      }
      i += len;
      if (type === 0x2f) break; // end of track
    } else if ((status & 0xf0) === 0x90) {
      ticks.push(tick);
      i += 2;
    } else {
      i += 2; // note-off and anything else two-byte
    }
  }
  return ticks;
}

/** One instrument striking every step at full velocity. */
const everyStep = (count: number): ExportTrack[] => [
  { instrumentId: "kick", steps: Array<number>(count).fill(1), subdivisions: count },
];

describe("generateMidiFile swing", () => {
  it("places every step on the grid when swing is zero", () => {
    const ticks = noteOnTicks(generateMidiFile(everyStep(4), 120, "general-midi", 0, false, 1));
    expect(ticks).toEqual([0, TICKS_PER_STEP, TICKS_PER_STEP * 2, TICKS_PER_STEP * 3]);
  });

  it("delays the odd-indexed steps and leaves the even ones on the grid", () => {
    const swingPercent = 25;
    const shift = Math.round(TICKS_PER_STEP * (swingPercent / 100));
    const ticks = noteOnTicks(
      generateMidiFile(everyStep(4), 120, "general-midi", swingPercent, false, 1),
    );

    expect(ticks).toEqual([
      0,
      TICKS_PER_STEP + shift,
      TICKS_PER_STEP * 2,
      TICKS_PER_STEP * 3 + shift,
    ]);
  });

  it("displaces the off-beat by exactly the fraction the audio engine does", () => {
    // The engine holds each even step for (1 + s)·d, so the following onset is
    // late by s·d. Same number, arrived at from the other direction.
    const s = 0.3;
    const engineOnsetOfStep1 = TICKS_PER_STEP * (1 + s);
    const ticks = noteOnTicks(
      generateMidiFile(everyStep(4), 120, "general-midi", s * 100, false, 1),
    );
    expect(ticks[1]).toBe(Math.round(engineOnsetOfStep1));
  });

  it("is monotonic — swing must not reorder the pattern", () => {
    for (const swing of [0, 5, 18, 30]) {
      const ticks = noteOnTicks(
        generateMidiFile(everyStep(8), 120, "general-midi", swing, false, 1),
      );
      expect([...ticks].sort((a, b) => a - b), `swing ${swing}`).toEqual(ticks);
    }
  });
});
