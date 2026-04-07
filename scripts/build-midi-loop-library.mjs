import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "src/components/Blipblox/midiLoopLibrary.ts");

const sampleRoot = process.env.SAMPLE_MIDI_ROOT
  || process.env.NATE_SMITH_MIDI_ROOT
  || "/Volumes/Mac-Storage/Samples";

const SECTION_LABELS = {
  Intro: "Intro",
  Verse: "Verse",
  PreChorus: "Pre-Chorus",
  Chorus: "Chorus",
  ChorusV: "Chorus V",
  Bridge: "Bridge",
  BrkDown: "Breakdown",
  BrkDwn: "Breakdown",
  Outro: "Outro",
  End: "End",
  Solo: "Solo",
  XStick: "X-Stick",
  Fill: "Fill",
  Groove: "Groove",
  Loop: "Loop",
  Crash: "Crash",
  Hat: "Hat",
  Ride: "Ride",
  Snare: "Snare",
  Kick: "Kick",
  Toms: "Toms",
  Percussion: "Percussion",
  Top: "Top",
  Hit: "Hit",
};

const SECTION_ORDER = {
  Intro: 10,
  Verse: 20,
  PreChorus: 25,
  Chorus: 30,
  ChorusV: 35,
  Bridge: 40,
  BrkDown: 45,
  BrkDwn: 45,
  Outro: 48,
  End: 49,
  Solo: 50,
  XStick: 55,
  Fill: 60,
  Groove: 65,
  Loop: 68,
  Crash: 70,
  Hat: 80,
  Ride: 85,
  Snare: 90,
  Kick: 92,
  Toms: 95,
  Percussion: 97,
  Top: 98,
  Hit: 100,
};

const ROLAND_DRUM_PATH_PATTERN = /drum|drums|drum loops|midi drums|drum midi/i;

const SOURCE_CONFIGS = [
  {
    id: "nate-smith",
    label: "Nate Smith",
    order: 10,
    matches: (relativePath) => relativePath.startsWith("Nate Smith Samples/") && relativePath.includes("/MIDI Loops/"),
    buildMetadata: buildNateSmithMetadata,
  },
  {
    id: "groove-monkee",
    label: "Groove Monkee",
    order: 20,
    matches: (relativePath) => relativePath.startsWith("Groove Monkee Free MIDI GM/"),
    buildMetadata: buildGrooveMonkeeMetadata,
  },
  {
    id: "steven-slate",
    label: "Steven Slate",
    order: 30,
    matches: (relativePath) => relativePath.startsWith("Steven Slate Drums Samples/"),
    buildMetadata: buildStevenSlateMetadata,
  },
  {
    id: "roland",
    label: "Roland",
    order: 40,
    matches: (relativePath) => relativePath.startsWith("Roland Samples/") && ROLAND_DRUM_PATH_PATTERN.test(relativePath),
    buildMetadata: buildRolandMetadata,
  },
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isMidiFile(fileName) {
  const normalized = fileName.toLowerCase();
  return normalized.endsWith(".mid") || normalized.endsWith(".midi");
}

function stripExtension(fileName) {
  return fileName.replace(/\.(mid|midi)$/i, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDisplayLabel(value) {
  return value
    .replace(/\.(mid|midi|lib|sng|prt)$/i, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPackSegment(segment) {
  return formatDisplayLabel(segment)
    .replace(/\s+\d+\.\d+\.\d+$/i, "")
    .trim();
}

function stripTempoFromLabel(label, bpm) {
  let result = formatDisplayLabel(label);

  if (bpm) {
    const escapedBpm = String(bpm).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`^0*${escapedBpm}\\s*bpm\\b\\s*`, "i"),
      new RegExp(`^0*${escapedBpm}\\b\\s*`, "i"),
      new RegExp(`\\b0*${escapedBpm}\\s*bpm\\b`, "i"),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, "").trim();
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function extractBpmFromStrings(strings) {
  for (let index = strings.length - 1; index >= 0; index -= 1) {
    const text = String(strings[index] || "");
    const explicitMatches = Array.from(text.matchAll(/(\d{2,3})\s*bpm/gi))
      .map((match) => Number(match[1]))
      .filter((value) => value >= 40 && value <= 260);

    if (explicitMatches.length > 0) {
      return explicitMatches[explicitMatches.length - 1];
    }
  }

  for (let index = strings.length - 1; index >= 0; index -= 1) {
    const text = String(strings[index] || "");
    const implicitMatches = Array.from(text.matchAll(/(^|[^0-9])(\d{2,3})(?=$|[^0-9])/g))
      .map((match) => ({ raw: match[2], value: Number(match[2]) }))
      .filter(({ value }) => value >= 40 && value <= 260);

    if (implicitMatches.length > 0) {
      const preferredMatches = implicitMatches.filter(({ raw }) => raw.length === 3);
      const candidates = preferredMatches.length > 0 ? preferredMatches : implicitMatches;
      return candidates[0].value;
    }
  }

  return null;
}

function extractSectionIndex(text) {
  const match = text.match(/(\d{1,3})/);
  return match ? Number(match[1]) : 0;
}

function resolveSectionType(rawType) {
  const normalized = rawType.replace(/[^A-Za-z]/g, "").toLowerCase();

  const aliases = {
    int: "Intro",
    intro: "Intro",
    vrs: "Verse",
    verse: "Verse",
    prc: "PreChorus",
    prechorus: "PreChorus",
    chr: "Chorus",
    chorus: "Chorus",
    chorusv: "ChorusV",
    brg: "Bridge",
    bridge: "Bridge",
    brkdown: "BrkDown",
    brkdwn: "BrkDwn",
    breakdown: "BrkDown",
    otr: "Outro",
    outro: "Outro",
    end: "End",
    ending: "End",
    solo: "Solo",
    xstick: "XStick",
    fill: "Fill",
    groove: "Groove",
    grooves: "Groove",
    loop: "Loop",
    drumloop: "Loop",
    kick: "Kick",
    snare: "Snare",
    hat: "Hat",
    hh: "Hat",
    ride: "Ride",
    crash: "Crash",
    tom: "Toms",
    toms: "Toms",
    perc: "Percussion",
    percussion: "Percussion",
    top: "Top",
    hit: "Hit",
  };

  return aliases[normalized] || null;
}

function parseIndexedSection(rawSection) {
  const compact = rawSection.replace(/[^A-Za-z0-9]/g, "");
  const match = compact.match(/^([A-Za-z]+?)(\d+)([A-Za-z]*)$/);

  if (!match) {
    return null;
  }

  const [, rawType, indexRaw, variantRaw] = match;
  const sectionType = resolveSectionType(rawType) || rawType;
  const sectionLabel = SECTION_LABELS[sectionType] || formatDisplayLabel(rawType);

  return {
    raw: rawSection,
    type: sectionType,
    label: [sectionLabel, indexRaw, variantRaw].filter(Boolean).join(" "),
    index: Number(indexRaw),
    variant: variantRaw,
    order: SECTION_ORDER[sectionType] ?? 999,
  };
}

function detectSectionType(text) {
  const patterns = [
    { type: "Intro", pattern: /\bintro\b|\bint\b/i },
    { type: "Verse", pattern: /\bverse\b|\bvrs\b/i },
    { type: "PreChorus", pattern: /pre[-\s]?chorus|\bprc\b/i },
    { type: "ChorusV", pattern: /\bchorusv\b/i },
    { type: "Chorus", pattern: /\bchorus\b|\bchr\b/i },
    { type: "Bridge", pattern: /\bbridge\b|\bbrg\b/i },
    { type: "BrkDown", pattern: /\bbrkdown\b|\bbrkdwn\b|\bbreakdown\b/i },
    { type: "Outro", pattern: /\boutro\b|\botr\b/i },
    { type: "End", pattern: /\bending\b|\bend\b/i },
    { type: "Solo", pattern: /\bsolo\b/i },
    { type: "XStick", pattern: /x[-\s]?stick|rimclick|cross[-\s]?stick/i },
    { type: "Fill", pattern: /\bfill\b/i },
    { type: "Groove", pattern: /\bgroove\b/i },
    { type: "Loop", pattern: /drum\s*loop|drumloop|\bloop\b/i },
    { type: "Crash", pattern: /\bcrash\b/i },
    { type: "Ride", pattern: /\bride\b/i },
    { type: "Hat", pattern: /\bhh\b|\bhi[-\s]?hat\b|\bhihat\b|\bhat\b/i },
    { type: "Snare", pattern: /\bsnare\b/i },
    { type: "Kick", pattern: /\bkick\b/i },
    { type: "Toms", pattern: /\btoms?\b/i },
    { type: "Percussion", pattern: /\bperc\b|\bpercussion\b|cowbell|tamb|splash|bell/i },
    { type: "Top", pattern: /\btop\b/i },
    { type: "Hit", pattern: /\bhit\b/i },
  ];

  for (const { type, pattern } of patterns) {
    if (pattern.test(text)) {
      return type;
    }
  }

  return null;
}

function buildSectionInfo(rawSection, contextText, fallbackType = "Loop", labelOverride) {
  const parsed = parseIndexedSection(rawSection);
  const label = (labelOverride || "").trim() || (parsed?.label ?? formatDisplayLabel(rawSection));

  if (parsed) {
    return { ...parsed, label };
  }

  const sectionType = detectSectionType(`${contextText} ${rawSection}`) || fallbackType;

  return {
    raw: rawSection,
    type: sectionType,
    label: label || SECTION_LABELS[sectionType] || "Loop",
    index: extractSectionIndex(rawSection),
    variant: "",
    order: SECTION_ORDER[sectionType] ?? 999,
  };
}

function buildPackMetadata(sourceLabel, familyLabel, packParts, bpm) {
  const cleanedParts = packParts.map((part) => cleanPackSegment(part)).filter(Boolean);
  const packBaseLabel = [sourceLabel, cleanedParts.join(" / ")].filter(Boolean).join(" • ");
  const packKey = `${sourceLabel}/${cleanedParts.join("/")}`;
  const packShortLabel = cleanedParts[cleanedParts.length - 1] || familyLabel || sourceLabel;

  return {
    family: familyLabel,
    familyLabel,
    packKey,
    packBaseLabel,
    packShortLabel,
    explicitBpm: bpm,
  };
}

function buildNateSmithMetadata(relativePath, sourceConfig) {
  const parts = relativePath.split("/");
  const fileName = parts[parts.length - 1];
  const midiLoopsIndex = parts.lastIndexOf("MIDI Loops");
  const packFolder = parts[midiLoopsIndex + 1];
  const packMatch = packFolder?.match(/^(.+?)_(\d+)bpm$/i);

  if (!packMatch) {
    return null;
  }

  const [, familyRaw, bpmRaw] = packMatch;
  const familyLabel = cleanPackSegment(familyRaw);
  const baseName = stripExtension(fileName);
  const fileMatch = baseName.match(/^(.*)_([A-Za-z]+)_(\d+)bpm$/i);
  const rawSection = fileMatch ? fileMatch[1] : stripTempoFromLabel(baseName, Number(bpmRaw));
  const bpm = Number(bpmRaw);
  const section = buildSectionInfo(rawSection, packFolder, "Loop");
  const pack = buildPackMetadata(sourceConfig.label, familyLabel, [familyLabel], bpm);

  return {
    ...pack,
    section,
    namePrefix: familyLabel,
  };
}

function selectGrooveMonkeePackParts(directories) {
  const cleanedDirs = directories
    .filter((segment) => !/^\d+\s*bpm$/i.test(segment))
    .filter((segment) => !/^\d{2,3}\s*$/i.test(segment));

  if (cleanedDirs.length <= 2) {
    return cleanedDirs;
  }

  if (/^song\s+/i.test(cleanedDirs[1] || "")) {
    return cleanedDirs.slice(0, 2);
  }

  return cleanedDirs.slice(0, 3);
}

function buildGrooveMonkeeMetadata(relativePath, sourceConfig) {
  const parts = relativePath.split("/");
  const fileName = parts[parts.length - 1];
  const directories = parts.slice(1, -1);
  const bpm = extractBpmFromStrings([...directories, stripExtension(fileName)]);
  const packParts = selectGrooveMonkeePackParts(directories);
  const rawSection = stripExtension(fileName);
  const labelOverride = stripTempoFromLabel(rawSection, bpm) || formatDisplayLabel(rawSection);
  const section = buildSectionInfo(rawSection, directories.join(" "), detectSectionType(directories.join(" ")) || "Loop", labelOverride);
  const familyLabel = cleanPackSegment(packParts[0] || sourceConfig.label);
  const pack = buildPackMetadata(sourceConfig.label, familyLabel, packParts, bpm);

  return {
    ...pack,
    section,
    namePrefix: pack.packShortLabel,
  };
}

function cleanStevenSlateSongLabel(segment, bpm) {
  let label = cleanPackSegment(segment)
    .replace(/^\d{2}\s+/, "")
    .trim();

  if (bpm) {
    label = stripTempoFromLabel(label, bpm);
  }

  return label || cleanPackSegment(segment);
}

function findLastSegment(segments, pattern) {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (pattern.test(segments[index])) {
      return segments[index];
    }
  }

  return null;
}

function buildStevenSlateMetadata(relativePath, sourceConfig) {
  const parts = relativePath.split("/");
  const fileName = parts[parts.length - 1];
  const directories = parts.slice(1, -1);
  const collectionSegment = findLastSegment(directories, /\.lib$/i) || directories[0] || sourceConfig.label;
  const songSegment = findLastSegment(directories, /\.sng$/i) || directories[directories.length - 2] || "";
  const partSegment = findLastSegment(directories, /\.prt$/i) || directories[directories.length - 1] || "";
  const bpm = extractBpmFromStrings([songSegment, collectionSegment, stripExtension(fileName)]);
  const familyLabel = cleanPackSegment(collectionSegment);
  const songLabel = cleanStevenSlateSongLabel(songSegment, bpm);
  const packParts = [familyLabel, songLabel].filter(Boolean);
  const rawSection = stripExtension(fileName);
  const labelOverride = formatDisplayLabel(rawSection);
  const section = buildSectionInfo(rawSection, `${partSegment} ${songSegment}`, detectSectionType(`${partSegment} ${rawSection}`) || "Loop", labelOverride);
  const pack = buildPackMetadata(sourceConfig.label, familyLabel, packParts, bpm);

  return {
    ...pack,
    section,
    namePrefix: songLabel || familyLabel,
  };
}

function cleanRolandProductName(segment) {
  return cleanPackSegment(segment)
    .replace(/^RolandCloud\s+/i, "")
    .replace(/^Roland Cloud\s*-\s*/i, "")
    .trim();
}

function buildRolandMetadata(relativePath, sourceConfig) {
  const parts = relativePath.split("/");
  const productSegment = parts[1];
  const fileName = parts[parts.length - 1];
  const directories = parts.slice(2, -1);
  const bpm = extractBpmFromStrings([...directories, stripExtension(fileName)]);
  const productLabel = cleanRolandProductName(productSegment);
  const drumIndex = directories.findIndex((segment) => ROLAND_DRUM_PATH_PATTERN.test(segment));
  const packParts = [productLabel];

  if (drumIndex >= 0) {
    packParts.push(cleanPackSegment(directories[drumIndex]));

    const subSegment = directories[drumIndex + 1];
    if (subSegment && !/^midi$/i.test(subSegment) && !/^midi files$/i.test(subSegment)) {
      const cleanedSubSegment = cleanPackSegment(subSegment);
      if (cleanedSubSegment && cleanedSubSegment.toLowerCase() !== packParts[packParts.length - 1].toLowerCase()) {
        packParts.push(cleanedSubSegment);
      }
    }
  }

  const rawSection = stripExtension(fileName);
  const labelOverride = stripTempoFromLabel(rawSection, bpm) || formatDisplayLabel(rawSection);
  const section = buildSectionInfo(rawSection, directories.join(" "), detectSectionType(directories.join(" ")) || "Loop", labelOverride);
  const pack = buildPackMetadata(sourceConfig.label, productLabel, packParts, bpm);

  return {
    ...pack,
    section,
    namePrefix: pack.packShortLabel,
  };
}

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

function parseMidiBuffer(buffer, filePath) {
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
  const tempos = [];

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

        if (metaType === 0x51 && metaLength === 3) {
          tempos.push({
            tick,
            microsecondsPerQuarter: buffer.readUIntBE(index, 3),
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

  return { division, notes, timeSignatures, tempos };
}

function inferBpm(entryBpm, parsedMidi) {
  if (Number.isFinite(entryBpm) && entryBpm > 0) {
    return Number(entryBpm);
  }

  const tempo = parsedMidi.tempos[0];
  if (!tempo?.microsecondsPerQuarter) {
    return 120;
  }

  return Math.max(40, Math.min(260, Math.round(60000000 / tempo.microsecondsPerQuarter)));
}

function walkMidiFiles(rootDir) {
  const midiFiles = [];
  const pendingDirs = [rootDir];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "__MACOSX" || entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        pendingDirs.push(fullPath);
        continue;
      }

      if (entry.isFile() && isMidiFile(entry.name)) {
        midiFiles.push(fullPath);
      }
    }
  }

  return midiFiles.sort((left, right) => left.localeCompare(right));
}

function discoverLoopEntries() {
  const entries = [];

  for (const filePath of walkMidiFiles(sampleRoot)) {
    const relativePath = toPosixPath(path.relative(sampleRoot, filePath));
    const sourceConfig = SOURCE_CONFIGS.find((config) => config.matches(relativePath));

    if (!sourceConfig) {
      continue;
    }

    const metadata = sourceConfig.buildMetadata(relativePath, sourceConfig);
    if (!metadata) {
      continue;
    }

    entries.push({
      filePath,
      relativePath,
      fileName: path.basename(filePath),
      sourceId: sourceConfig.id,
      sourceLabel: sourceConfig.label,
      sourceOrder: sourceConfig.order,
      ...metadata,
    });
  }

  return entries.sort((left, right) => {
    if (left.sourceOrder !== right.sourceOrder) {
      return left.sourceOrder - right.sourceOrder;
    }

    return left.relativePath.localeCompare(right.relativePath);
  });
}

function createFileHash(filePath) {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function dedupeEntries(entries) {
  const seenHashes = new Set();
  const uniqueEntries = [];
  let skippedDuplicates = 0;

  for (const entry of entries) {
    const fileHash = createFileHash(entry.filePath);

    if (seenHashes.has(fileHash)) {
      skippedDuplicates += 1;
      continue;
    }

    seenHashes.add(fileHash);
    uniqueEntries.push(entry);
  }

  return { uniqueEntries, skippedDuplicates };
}

function quantizeLoop(entry) {
  const buffer = fs.readFileSync(entry.filePath);
  const parsedMidi = parseMidiBuffer(buffer, entry.filePath);
  const bpm = inferBpm(entry.explicitBpm, parsedMidi);
  const timeSignature = parsedMidi.timeSignatures[0] || { numerator: 4, denominator: 4 };
  const ticksPerBar = parsedMidi.division * timeSignature.numerator * (4 / timeSignature.denominator);
  const maxTick = parsedMidi.notes.reduce((currentMax, note) => Math.max(currentMax, note.tick), 0);
  const bars = Math.max(1, Math.round(maxTick / ticksPerBar));
  const stepsPerBar = Math.max(1, Math.round(timeSignature.numerator * (16 / timeSignature.denominator)));
  const steps = bars * stepsPerBar;
  const ticksPerStep = ticksPerBar / stepsPerBar;
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

  const packId = `${slugify(entry.packKey)}-${bpm}`;
  const packLabel = `${entry.packBaseLabel} (${bpm} BPM)`;
  const section = entry.section;
  const name = [entry.namePrefix, section.label].filter(Boolean).join(" ").trim();
  const id = `${packId}--${slugify(stripExtension(entry.fileName))}`;

  return {
    id,
    name: name || stripExtension(entry.fileName),
    packId,
    packLabel,
    family: entry.familyLabel,
    section: section.raw,
    sectionType: section.type,
    sectionLabel: section.label,
    sectionIndex: section.index,
    sectionVariant: section.variant || undefined,
    bpm,
    timeSignature: `${timeSignature.numerator}/${timeSignature.denominator}`,
    bars,
    steps,
    hits,
    _sortKey: [
      entry.sourceOrder,
      bpm,
      entry.packBaseLabel,
      section.order,
      section.index,
      section.variant || "",
      section.label,
      entry.relativePath,
    ],
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
  const discoveredEntries = discoverLoopEntries();
  const { uniqueEntries, skippedDuplicates } = dedupeEntries(discoveredEntries);
  const loops = uniqueEntries.map(quantizeLoop).sort(compareLoops);
  const packCount = new Set(loops.map((loop) => loop.packId)).size;
  const sourceCount = new Set(uniqueEntries.map((entry) => entry.sourceId)).size;

  fs.writeFileSync(outputPath, buildOutputFile(loops));
  console.log(
    `Wrote ${loops.length} MIDI loops from ${packCount} packs across ${sourceCount} sources to ${outputPath}`
      + ` (${skippedDuplicates} duplicate MIDI files skipped)`,
  );
}

main();
