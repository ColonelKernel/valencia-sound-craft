import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "src/components/Blipblox/midiLoopLibrary.ts");

const midiRoot = process.env.NATE_SMITH_MIDI_ROOT
  || "/Volumes/Mac-Storage/Samples/Nate Smith Samples/NateSmithV1Drums_WAV/NateSmithV1Drums_WAV/MIDI Loops";

const PACK_CONFIG = [
  { folder: "Halftime_79bpm", family: "Halftime", familyLabel: "Halftime", bpm: 79 },
  { folder: "BigBass_90bpm", family: "BigBass", familyLabel: "Big Bass", bpm: 90 },
  { folder: "Crispy_95bpm", family: "Crispy", familyLabel: "Crispy", bpm: 95 },
  { folder: "Clyde_130bpm", family: "Clyde", familyLabel: "Clyde", bpm: 130 },
];

const SECTION_LABELS = {
  Bridge: "Bridge",
  BrkDown: "Breakdown",
  Chorus: "Chorus",
  ChorusV: "Chorus V",
  Crash: "Crash",
  Fill: "Fill",
  Hat: "Hat",
  Intro: "Intro",
  Snare: "Snare",
  Verse: "Verse",
  XStick: "X-Stick",
};

const SECTION_ORDER = {
  Intro: 10,
  Verse: 20,
  Chorus: 30,
  ChorusV: 35,
  Bridge: 40,
  BrkDown: 45,
  XStick: 50,
  Fill: 60,
  Crash: 70,
  Hat: 80,
  Snare: 90,
};

function readVarLength(buffer, index) {
  let value = 0;
  let byte = 0;

  do {
    byte = buffer[index];
    index += 1;
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);

  return [value, index];
}

function parseMidi(filePath) {
  const buffer = fs.readFileSync(filePath);
  let index = 0;

  const readString = (length) => buffer.toString("ascii", index, index + length);
  const readUInt32 = () => {
    const value = buffer.readUInt32BE(index);
    index += 4;
    return value;
  };
  const readUInt16 = () => {
    const value = buffer.readUInt16BE(index);
    index += 2;
    return value;
  };

  if (readString(4) !== "MThd") {
    throw new Error(`Invalid MIDI header in ${filePath}`);
  }
  index += 4;

  const headerLength = readUInt32();
  readUInt16();
  const trackCount = readUInt16();
  const division = readUInt16();
  index += headerLength - 6;

  const notes = [];
  const timeSignatures = [];

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    const trackId = buffer.toString("ascii", index, index + 4);
    index += 4;
    const trackLength = readUInt32();
    const trackEnd = index + trackLength;

    if (trackId !== "MTrk") {
      throw new Error(`Invalid track chunk in ${filePath}`);
    }

    let tick = 0;
    let runningStatus = null;

    while (index < trackEnd) {
      let delta;
      [delta, index] = readVarLength(buffer, index);
      tick += delta;

      let event = buffer[index];
      index += 1;

      if (event < 0x80) {
        index -= 1;
        event = runningStatus;
      } else {
        runningStatus = event;
      }

      if (event === 0xff) {
        const metaType = buffer[index];
        index += 1;
        let metaLength;
        [metaLength, index] = readVarLength(buffer, index);

        if (metaType === 0x58 && metaLength === 4) {
          timeSignatures.push({
            tick,
            numerator: buffer[index],
            denominator: 2 ** buffer[index + 1],
          });
        }

        index += metaLength;
        runningStatus = null;
        continue;
      }

      if (event === 0xf0 || event === 0xf7) {
        let sysexLength;
        [sysexLength, index] = readVarLength(buffer, index);
        index += sysexLength;
        runningStatus = null;
        continue;
      }

      const eventType = event & 0xf0;

      if (eventType === 0x80 || eventType === 0x90) {
        const note = buffer[index];
        const velocity = buffer[index + 1];
        index += 2;

        if (eventType === 0x90 && velocity > 0) {
          notes.push({ tick, note, velocity });
        }
        continue;
      }

      if (eventType === 0xa0 || eventType === 0xb0 || eventType === 0xe0) {
        index += 2;
        continue;
      }

      if (eventType === 0xc0 || eventType === 0xd0) {
        index += 1;
        continue;
      }

      throw new Error(`Unsupported MIDI event 0x${event.toString(16)} in ${filePath}`);
    }
  }

  return { division, notes, timeSignatures };
}

function parseSection(rawSection) {
  const match = rawSection.match(/^([A-Za-z]+?)(\d+)([A-Za-z]*)$/);

  if (!match) {
    return {
      raw: rawSection,
      type: rawSection,
      label: rawSection,
      index: 0,
      variant: "",
      order: 999,
    };
  }

  const [, sectionType, sectionIndexRaw, sectionVariant] = match;
  const sectionLabel = SECTION_LABELS[sectionType]
    || sectionType.replace(/([a-z])([A-Z])/g, "$1 $2");
  const sectionIndex = Number(sectionIndexRaw);
  const label = [sectionLabel, sectionIndexRaw, sectionVariant].filter(Boolean).join(" ");

  return {
    raw: rawSection,
    type: sectionType,
    label,
    index: sectionIndex,
    variant: sectionVariant,
    order: SECTION_ORDER[sectionType] ?? 999,
  };
}

function quantizeLoop(filePath, pack) {
  const fileName = path.basename(filePath);
  const fileMatch = fileName.match(/^(.*)_([A-Za-z]+)_(\d+)bpm\.mid$/i);

  if (!fileMatch) {
    throw new Error(`Unexpected MIDI filename: ${fileName}`);
  }

  const rawSection = fileMatch[1];
  const parsedMidi = parseMidi(filePath);
  const timeSignature = parsedMidi.timeSignatures[0] || { numerator: 4, denominator: 4 };
  const ticksPerBar = parsedMidi.division * timeSignature.numerator * (4 / timeSignature.denominator);
  const maxTick = parsedMidi.notes.reduce((currentMax, note) => Math.max(currentMax, note.tick), 0);
  const bars = Math.max(1, Math.round(maxTick / ticksPerBar));
  const steps = bars * 16;
  const ticksPerStep = ticksPerBar / 16;
  const velocityByStep = new Array(steps).fill(0);

  for (const note of parsedMidi.notes) {
    const step = Math.max(0, Math.min(steps - 1, Math.round(note.tick / ticksPerStep)));
    velocityByStep[step] = Math.max(velocityByStep[step], note.velocity);
  }

  const hits = [];
  velocityByStep.forEach((velocity, step) => {
    if (velocity > 0) {
      hits.push([step, velocity]);
    }
  });

  const section = parseSection(rawSection);
  const packId = `${pack.family.toLowerCase()}-${pack.bpm}`;
  const packLabel = `${pack.familyLabel} (${pack.bpm} BPM)`;

  return {
    id: fileName.replace(/\.mid$/i, "").toLowerCase(),
    name: `${pack.familyLabel} ${section.label}`,
    packId,
    packLabel,
    family: pack.family,
    section: rawSection,
    sectionType: section.type,
    sectionLabel: section.label,
    sectionIndex: section.index,
    sectionVariant: section.variant || undefined,
    bpm: pack.bpm,
    timeSignature: `${timeSignature.numerator}/${timeSignature.denominator}`,
    bars,
    steps,
    hits,
    _sortKey: [pack.bpm, section.order, section.index, section.variant || "", fileName],
  };
}

function compareLoops(a, b) {
  const maxLength = Math.max(a._sortKey.length, b._sortKey.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = a._sortKey[index];
    const right = b._sortKey[index];

    if (left === right) {
      continue;
    }

    if (typeof left === "number" && typeof right === "number") {
      return left - right;
    }

    return String(left).localeCompare(String(right));
  }

  return 0;
}

function formatField(key, value) {
  if (typeof value === "number") {
    return `${key}: ${value}`;
  }

  if (Array.isArray(value)) {
    return `${key}: [${value.map(([step, velocity]) => `[${step}, ${velocity}]`).join(", ")}]`;
  }

  return `${key}: ${JSON.stringify(value)}`;
}

function buildOutputFile(loops) {
  const encodedLoops = loops
    .map(({ _sortKey, ...loop }) => loop)
    .map((loop) => {
      const fields = [
        "id",
        "name",
        "packId",
        "packLabel",
        "family",
        "section",
        "sectionType",
        "sectionLabel",
        "sectionIndex",
        "sectionVariant",
        "bpm",
        "timeSignature",
        "bars",
        "steps",
        "hits",
      ]
        .filter((key) => loop[key] !== undefined)
        .map((key) => formatField(key, loop[key]));

      return `  { ${fields.join(", ")} },`;
    })
    .join("\n");

  return `// Generated by scripts/build-midi-loop-library.mjs
// Do not edit manually.

export interface ImportedMidiLoop {
  id: string;
  name: string;
  packId: string;
  packLabel: string;
  family: string;
  section: string;
  sectionType: string;
  sectionLabel: string;
  sectionIndex: number;
  sectionVariant?: string;
  bpm: number;
  timeSignature: string;
  bars: number;
  steps: number;
  midiPattern: number[];
  velocityPattern: number[];
}

export interface ImportedMidiLoopPack {
  id: string;
  label: string;
  bpm: number;
  loops: ImportedMidiLoop[];
}

interface EncodedMidiLoop extends Omit<ImportedMidiLoop, "midiPattern" | "velocityPattern"> {
  hits: Array<[number, number]>;
}

function expandLoop(loop: EncodedMidiLoop): ImportedMidiLoop {
  const midiPattern = new Array(loop.steps).fill(0);
  const velocityPattern = new Array(loop.steps).fill(0);

  loop.hits.forEach(([step, velocity]) => {
    if (step < 0 || step >= loop.steps) {
      return;
    }

    midiPattern[step] = 1;
    velocityPattern[step] = velocity;
  });

  return { ...loop, midiPattern, velocityPattern };
}

const ENCODED_MIDI_LOOPS: EncodedMidiLoop[] = [
${encodedLoops}
];

export const IMPORTED_MIDI_LOOPS: ImportedMidiLoop[] = ENCODED_MIDI_LOOPS.map(expandLoop);

export const IMPORTED_MIDI_LOOP_MAP: Record<string, ImportedMidiLoop> = Object.fromEntries(
  IMPORTED_MIDI_LOOPS.map((loop) => [loop.id, loop]),
);

export const IMPORTED_MIDI_LOOP_PACKS: ImportedMidiLoopPack[] = Array.from(
  IMPORTED_MIDI_LOOPS.reduce<Map<string, ImportedMidiLoopPack>>((packs, loop) => {
    const existing = packs.get(loop.packId);

    if (existing) {
      existing.loops.push(loop);
      return packs;
    }

    packs.set(loop.packId, {
      id: loop.packId,
      label: loop.packLabel,
      bpm: loop.bpm,
      loops: [loop],
    });

    return packs;
  }, new Map()).values(),
);

export const IMPORTED_MIDI_LOOP_GROUPS = Object.fromEntries(
  IMPORTED_MIDI_LOOP_PACKS.map((pack) => [pack.label, pack.loops]),
);
`;
}

function main() {
  const loops = [];

  for (const pack of PACK_CONFIG) {
    const packDir = path.join(midiRoot, pack.folder);

    if (!fs.existsSync(packDir)) {
      throw new Error(`Missing MIDI loop folder: ${packDir}`);
    }

    const fileNames = fs.readdirSync(packDir)
      .filter((fileName) => fileName.toLowerCase().endsWith(".mid"))
      .sort((left, right) => left.localeCompare(right));

    for (const fileName of fileNames) {
      loops.push(quantizeLoop(path.join(packDir, fileName), pack));
    }
  }

  loops.sort(compareLoops);
  fs.writeFileSync(outputPath, buildOutputFile(loops));
  console.log(`Wrote ${loops.length} MIDI loops to ${outputPath}`);
}

main();
