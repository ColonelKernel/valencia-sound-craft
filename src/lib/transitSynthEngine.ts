import {
  type TransitLine,
  type TransitNetwork,
  type TransitStation,
  type TransitStyleMode,
} from "./transitSynthData";

export type TransitScaleMode = "major" | "minor" | "dorian" | "mixolydian" | "custom";
export type TransitSequenceMode = "route-solo" | "network-jam";

export interface TransitEngineControls {
  scaleMode: TransitScaleMode;
  styleMode: TransitStyleMode;
  sequenceMode: TransitSequenceMode;
  selectedLineId: string;
  tempo: number;
  urbanDensity: number;
  order: number;
}

export interface TransitProjectionPoint {
  stationId: string;
  x: number;
  y: number;
}

export interface TransitNetworkMetrics {
  stationCount: number;
  edgeCount: number;
  transferCount: number;
  density: number;
  averageDegree: number;
  geographicSpanKm: number;
  averageConnectionDistanceKm: number;
}

export interface TransitStylePreset {
  id: TransitStyleMode;
  label: string;
  description: string;
  rootMidi: number;
  tempoBias: number;
  orderBias: number;
  densityBias: number;
  delayMix: number;
  reverbMix: number;
  modulationDepth: number;
}

export interface TransitSonicProfile {
  filterCutoffHz: number;
  modulationDepth: number;
  reverbMix: number;
  delayMix: number;
  lineLayerCount: number;
  densitySignal: number;
  traversalBias: "ordered" | "balanced" | "chaotic";
}

export interface TransitStationSoundProfile {
  stationId: string;
  stationName: string;
  lineId: string;
  lineName: string;
  lineColor: string;
  midi: number;
  noteLabel: string;
  frequency: number;
  velocity: number;
  pan: number;
  durationBeats: number;
  degree: number;
  transferLines: number;
  reason: string;
}

export interface TransitSequenceEvent extends TransitStationSoundProfile {
  eventId: string;
  startBeat: number;
  orderIndex: number;
  isTransfer: boolean;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALE_INTERVALS: Record<TransitScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  custom: [0, 3, 5, 7, 10],
};

export const TRANSIT_SCALE_OPTIONS: { id: TransitScaleMode; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "dorian", label: "Dorian" },
  { id: "mixolydian", label: "Mixolydian" },
  { id: "custom", label: "Custom" },
];

export const TRANSIT_SEQUENCE_OPTIONS: { id: TransitSequenceMode; label: string }[] = [
  { id: "route-solo", label: "Route Solo" },
  { id: "network-jam", label: "Network Jam" },
];

export const TRANSIT_STYLE_PRESETS: Record<TransitStyleMode, TransitStylePreset> = {
  cartographic: {
    id: "cartographic",
    label: "Cartographic",
    description: "A balanced graph reading with clear pitch spacing and legible line order.",
    rootMidi: 47,
    tempoBias: 0,
    orderBias: 8,
    densityBias: 0,
    delayMix: 0.18,
    reverbMix: 0.22,
    modulationDepth: 0.24,
  },
  "berlin-techno": {
    id: "berlin-techno",
    label: "Berlin Techno",
    description: "Minimal pulses, darker root notes, and disciplined repetition with dry delay tails.",
    rootMidi: 40,
    tempoBias: 10,
    orderBias: 22,
    densityBias: 8,
    delayMix: 0.16,
    reverbMix: 0.12,
    modulationDepth: 0.18,
  },
  "nyc-jazz-chaos": {
    id: "nyc-jazz-chaos",
    label: "NYC Jazz Chaos",
    description: "Transfer hops, swing-ready phrasing, and more willingness to break linear route order.",
    rootMidi: 48,
    tempoBias: 6,
    orderBias: -16,
    densityBias: 6,
    delayMix: 0.24,
    reverbMix: 0.28,
    modulationDepth: 0.32,
  },
  "tokyo-minimal-precision": {
    id: "tokyo-minimal-precision",
    label: "Tokyo Minimal Precision",
    description: "Quantized routing, high order bias, and restrained ambience for clean grid phrasing.",
    rootMidi: 52,
    tempoBias: 4,
    orderBias: 26,
    densityBias: -2,
    delayMix: 0.12,
    reverbMix: 0.16,
    modulationDepth: 0.16,
  },
  "cinematic-drift": {
    id: "cinematic-drift",
    label: "Cinematic Drift",
    description: "Longer tails, smoother contour changes, and enough ambience to feel expansive.",
    rootMidi: 45,
    tempoBias: -2,
    orderBias: 6,
    densityBias: 4,
    delayMix: 0.28,
    reverbMix: 0.34,
    modulationDepth: 0.28,
  },
};

const sequenceCache = new Map<string, TransitSequenceEvent[]>();
const projectionCache = new Map<string, Record<string, TransitProjectionPoint>>();
const metricsCache = new Map<string, TransitNetworkMetrics>();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalize(value: number, min: number, max: number) {
  if (max === min) {
    return 0.5;
  }

  return clamp((value - min) / (max - min), 0, 1);
}

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number) {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function quantizeMidiToScale(rawMidi: number, scaleMode: TransitScaleMode, rootMidi: number) {
  const intervals = SCALE_INTERVALS[scaleMode];
  const offset = rawMidi - rootMidi;
  const octave = Math.floor(offset / 12);
  const pitchClass = ((offset % 12) + 12) % 12;

  let bestInterval = intervals[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  intervals.forEach((interval) => {
    const distance = Math.abs(interval - pitchClass);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestInterval = interval;
    }
  });

  return rootMidi + octave * 12 + bestInterval;
}

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) + 1;
}

function seededRandom(seed: number) {
  let current = seed;
  return () => {
    current = (current * 48271) % 0x7fffffff;
    return current / 0x7fffffff;
  };
}

function getLineById(network: TransitNetwork, lineId: string) {
  return network.lines.find((line) => line.id === lineId) ?? network.lines[0];
}

function getStationById(network: TransitNetwork, stationId: string) {
  return network.stations.find((station) => station.id === stationId) ?? network.stations[0];
}

function getDominantLineId(network: TransitNetwork, station: TransitStation, selectedLineId: string) {
  if (station.lines.includes(selectedLineId)) {
    return selectedLineId;
  }

  return station.lines[0] ?? network.lines[0].id;
}

function getRouteEdgeDistanceKm(network: TransitNetwork, fromStationId: string, toStationId: string) {
  const fromStation = getStationById(network, fromStationId);
  const toStation = getStationById(network, toStationId);
  return haversineKm(fromStation.lat, fromStation.lon, toStation.lat, toStation.lon);
}

function haversineKm(latA: number, lonA: number, latB: number, lonB: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(latB - latA);
  const dLon = toRad(lonB - lonA);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getEffectiveOrder(controls: TransitEngineControls) {
  const style = TRANSIT_STYLE_PRESETS[controls.styleMode];
  return clamp(controls.order + style.orderBias, 0, 100);
}

function getEffectiveDensity(controls: TransitEngineControls) {
  const style = TRANSIT_STYLE_PRESETS[controls.styleMode];
  return clamp(controls.urbanDensity + style.densityBias, 0, 100);
}

export function getTransitNetworkMetrics(network: TransitNetwork): TransitNetworkMetrics {
  if (metricsCache.has(network.id)) {
    return metricsCache.get(network.id)!;
  }

  const edgeCount = network.stations.reduce((sum, station) => sum + station.connections.length, 0) / 2;
  const transferCount = network.stations.filter((station) => station.lines.length > 1).length;
  const averageDegree =
    network.stations.reduce((sum, station) => sum + station.degree, 0) / Math.max(network.stations.length, 1);
  const density =
    network.stations.length < 2 ? 0 : edgeCount / ((network.stations.length * (network.stations.length - 1)) / 2);

  const lats = network.stations.map((station) => station.lat);
  const lons = network.stations.map((station) => station.lon);
  const geographicSpanKm = haversineKm(
    Math.min(...lats),
    Math.min(...lons),
    Math.max(...lats),
    Math.max(...lons),
  );

  let connectionDistanceTotal = 0;
  let connectionDistanceCount = 0;
  const seenEdges = new Set<string>();

  network.stations.forEach((station) => {
    station.connections.forEach((neighborId) => {
      const edgeId = [station.id, neighborId].sort().join("::");
      if (seenEdges.has(edgeId)) {
        return;
      }

      seenEdges.add(edgeId);
      connectionDistanceTotal += getRouteEdgeDistanceKm(network, station.id, neighborId);
      connectionDistanceCount += 1;
    });
  });

  const metrics = {
    stationCount: network.stations.length,
    edgeCount,
    transferCount,
    density,
    averageDegree,
    geographicSpanKm,
    averageConnectionDistanceKm: connectionDistanceCount === 0 ? 0 : connectionDistanceTotal / connectionDistanceCount,
  };

  metricsCache.set(network.id, metrics);
  return metrics;
}

export function projectTransitNetwork(
  network: TransitNetwork,
  width = 920,
  height = 620,
  padding = 72,
) {
  const cacheKey = `${network.id}:${width}:${height}:${padding}`;
  if (projectionCache.has(cacheKey)) {
    return projectionCache.get(cacheKey)!;
  }

  const minLat = Math.min(...network.stations.map((station) => station.lat));
  const maxLat = Math.max(...network.stations.map((station) => station.lat));
  const minLon = Math.min(...network.stations.map((station) => station.lon));
  const maxLon = Math.max(...network.stations.map((station) => station.lon));

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;
  const scale = Math.min(usableWidth / lonSpan, usableHeight / latSpan);
  const offsetX = (usableWidth - lonSpan * scale) / 2;
  const offsetY = (usableHeight - latSpan * scale) / 2;

  const projection = Object.fromEntries(
    network.stations.map((station) => [
      station.id,
      {
        stationId: station.id,
        x: padding + offsetX + (station.lon - minLon) * scale,
        y: height - padding - offsetY - (station.lat - minLat) * scale,
      },
    ]),
  );

  projectionCache.set(cacheKey, projection);
  return projection;
}

export function getTransitSonicProfile(network: TransitNetwork, controls: TransitEngineControls): TransitSonicProfile {
  const metrics = getTransitNetworkMetrics(network);
  const style = TRANSIT_STYLE_PRESETS[controls.styleMode];
  const effectiveDensity = getEffectiveDensity(controls) / 100;
  const effectiveOrder = getEffectiveOrder(controls);
  const densitySignal = clamp(metrics.density * 0.55 + effectiveDensity * 0.45, 0, 1);

  return {
    filterCutoffHz: Math.round(420 + densitySignal * 1700 + metrics.averageDegree * 120),
    modulationDepth: clamp(style.modulationDepth + densitySignal * 0.22, 0.08, 0.82),
    reverbMix: clamp(style.reverbMix + densitySignal * 0.12, 0.06, 0.55),
    delayMix: clamp(style.delayMix + (1 - metrics.density) * 0.08, 0.06, 0.48),
    lineLayerCount: controls.sequenceMode === "route-solo" ? 1 : Math.max(2, Math.round(1 + effectiveDensity * 2.6)),
    densitySignal,
    traversalBias: effectiveOrder >= 66 ? "ordered" : effectiveOrder <= 38 ? "chaotic" : "balanced",
  };
}

export function getStationSoundProfile(
  network: TransitNetwork,
  stationId: string,
  controls: TransitEngineControls,
  dominantLineId = controls.selectedLineId,
): TransitStationSoundProfile {
  const station = getStationById(network, stationId);
  const metrics = getTransitNetworkMetrics(network);
  const style = TRANSIT_STYLE_PRESETS[controls.styleMode];
  const dominantLine = getLineById(network, getDominantLineId(network, station, dominantLineId));

  const minLat = Math.min(...network.stations.map((item) => item.lat));
  const maxLat = Math.max(...network.stations.map((item) => item.lat));
  const minLon = Math.min(...network.stations.map((item) => item.lon));
  const maxLon = Math.max(...network.stations.map((item) => item.lon));
  const normalizedLat = normalize(station.lat, minLat, maxLat);
  const normalizedLon = normalize(station.lon, minLon, maxLon);
  const centralityBias = normalize(station.degree, 1, Math.max(...network.stations.map((item) => item.degree), 1));
  const rawMidi = style.rootMidi + normalizedLat * 22 + centralityBias * 5 + (station.lines.length - 1) * 1.2;
  const midi = quantizeMidiToScale(rawMidi, controls.scaleMode, style.rootMidi);
  const frequency = midiToFrequency(midi);
  const averageEdgeDistance =
    station.connections.length === 0
      ? metrics.averageConnectionDistanceKm
      : station.connections.reduce(
          (sum, neighborId) => sum + getRouteEdgeDistanceKm(network, station.id, neighborId),
          0,
        ) / station.connections.length;
  const durationBeats = clamp(0.55 + averageEdgeDistance / 4.4, 0.55, 2.8);
  const velocity = clamp(0.34 + centralityBias * 0.28 + station.lines.length * 0.04, 0.3, 0.92);
  const pan = clamp(normalizedLon * 2 - 1, -1, 1);
  const reason = `${station.degree}-way node, ${station.lines.length} line${station.lines.length > 1 ? "s" : ""}, ${station.name} quantized to ${midiToNoteName(midi)}.`;

  return {
    stationId: station.id,
    stationName: station.name,
    lineId: dominantLine.id,
    lineName: dominantLine.name,
    lineColor: dominantLine.color,
    midi,
    noteLabel: midiToNoteName(midi),
    frequency,
    velocity,
    pan,
    durationBeats,
    degree: station.degree,
    transferLines: station.lines.length,
    reason,
  };
}

function buildChaoticTraversal(
  network: TransitNetwork,
  orderedStations: string[],
  desiredLength: number,
  controls: TransitEngineControls,
) {
  const random = seededRandom(hashSeed(`${network.id}:${orderedStations.join("-")}:${controls.styleMode}:${controls.order}`));
  const stationLookup = new Map(network.stations.map((station) => [station.id, station]));
  const sequence = [orderedStations[0]];
  let currentStationId = orderedStations[0];
  let previousStationId: string | null = null;
  const lineMembership = new Set(orderedStations);
  const effectiveChaos = 1 - getEffectiveOrder(controls) / 100;

  while (sequence.length < desiredLength) {
    const currentStation = stationLookup.get(currentStationId);
    if (!currentStation) {
      break;
    }

    const lineNeighbor = orderedStations[sequence.length % orderedStations.length];
    const candidateNeighbors = currentStation.connections.filter((neighborId) => neighborId !== previousStationId);

    let nextStationId = lineNeighbor;

    if (candidateNeighbors.length > 0 && random() < effectiveChaos) {
      const weightedCandidates = [...candidateNeighbors].sort((leftId, rightId) => {
        const leftWeight = stationLookup.get(leftId)?.degree ?? 0;
        const rightWeight = stationLookup.get(rightId)?.degree ?? 0;
        return rightWeight - leftWeight;
      });
      const randomIndex = Math.floor(random() * weightedCandidates.length);
      nextStationId = weightedCandidates[randomIndex] ?? weightedCandidates[0];
    } else if (candidateNeighbors.includes(lineNeighbor)) {
      nextStationId = lineNeighbor;
    } else {
      nextStationId = candidateNeighbors.find((neighborId) => lineMembership.has(neighborId)) ?? candidateNeighbors[0];
    }

    if (!nextStationId) {
      break;
    }

    sequence.push(nextStationId);
    previousStationId = currentStationId;
    currentStationId = nextStationId;
  }

  return sequence;
}

function getLineTraversal(line: TransitLine, network: TransitNetwork, controls: TransitEngineControls) {
  const orderedStations = line.stations;
  const effectiveOrder = getEffectiveOrder(controls);

  if (controls.sequenceMode === "route-solo" || effectiveOrder >= 60) {
    return orderedStations;
  }

  return buildChaoticTraversal(network, orderedStations, orderedStations.length, controls);
}

export function generateTransitSequence(network: TransitNetwork, controls: TransitEngineControls) {
  const cacheKey = JSON.stringify({
    networkId: network.id,
    selectedLineId: controls.selectedLineId,
    scaleMode: controls.scaleMode,
    styleMode: controls.styleMode,
    tempo: controls.tempo,
    sequenceMode: controls.sequenceMode,
    urbanDensity: controls.urbanDensity,
    order: controls.order,
  });

  if (sequenceCache.has(cacheKey)) {
    return sequenceCache.get(cacheKey)!;
  }

  const sonicProfile = getTransitSonicProfile(network, controls);
  const selectedLine = getLineById(network, controls.selectedLineId);
  const activeLines =
    controls.sequenceMode === "route-solo"
      ? [selectedLine]
      : network.lines
          .slice()
          .sort((left, right) => right.stations.length - left.stations.length)
          .slice(0, sonicProfile.lineLayerCount);

  let eventIndex = 0;
  const events: TransitSequenceEvent[] = [];
  const baseStride = controls.sequenceMode === "route-solo" ? 1.15 : 1;
  const orderBalance = getEffectiveOrder(controls) / 100;

  activeLines.forEach((line, lineIndex) => {
    const traversal = getLineTraversal(line, network, controls);
    const sequenceLength =
      controls.sequenceMode === "route-solo"
        ? traversal.length
        : Math.min(traversal.length, 4 + Math.round((controls.urbanDensity / 100) * 3));
    let beatCursor = lineIndex * 0.36;

    traversal.slice(0, sequenceLength).forEach((stationId, stationIndex) => {
      const soundProfile = getStationSoundProfile(network, stationId, controls, line.id);
      const previousStationId = stationIndex > 0 ? traversal[stationIndex - 1] : null;
      const routeDistance = previousStationId ? getRouteEdgeDistanceKm(network, previousStationId, stationId) : 0;
      const connectionDuration = clamp(0.7 + routeDistance / 5.6, 0.7, 2.6);
      const interLineOffset =
        controls.sequenceMode === "route-solo" ? 0 : lineIndex * (0.18 + sonicProfile.densitySignal * 0.1);
      const durationBeats = clamp(
        soundProfile.durationBeats * 0.65 + connectionDuration * 0.35,
        0.55,
        2.8,
      );

      events.push({
        ...soundProfile,
        eventId: `${line.id}:${stationId}:${eventIndex}`,
        startBeat: beatCursor + interLineOffset,
        durationBeats,
        orderIndex: eventIndex,
        isTransfer: getStationById(network, stationId).lines.length > 1,
      });

      beatCursor += baseStride + (1 - orderBalance) * 0.16;
      eventIndex += 1;
    });
  });

  const sortedEvents = events.sort((left, right) => left.startBeat - right.startBeat);
  sequenceCache.set(cacheKey, sortedEvents);
  return sortedEvents;
}

export function buildTransitLinePaths(network: TransitNetwork) {
  const projection = projectTransitNetwork(network);
  return network.lines.map((line) => ({
    ...line,
    path: line.stations
      .map((stationId) => projection[stationId])
      .filter(Boolean)
      .map((point) => `${point.x},${point.y}`)
      .join(" "),
  }));
}

export function buildTransitInsightCopy(network: TransitNetwork, controls: TransitEngineControls) {
  const metrics = getTransitNetworkMetrics(network);
  const sonicProfile = getTransitSonicProfile(network, controls);
  const style = TRANSIT_STYLE_PRESETS[controls.styleMode];
  const traversalTone =
    sonicProfile.traversalBias === "ordered"
      ? "clean, route-faithful phrasing"
      : sonicProfile.traversalBias === "chaotic"
        ? "transfer-heavy jump cuts"
        : "a balance of line memory and intersection drift";

  return `This ${network.shortLabel} preset turns ${metrics.stationCount} stations and ${metrics.edgeCount.toFixed(0)} edges into ${traversalTone}. ${style.label} pushes the network toward ${style.description.toLowerCase()}`;
}
