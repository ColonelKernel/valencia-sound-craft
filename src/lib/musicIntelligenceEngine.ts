import {
  collaborativeClusterLabels,
  chordProgressionPresets,
  defaultAmieState,
  moodPresets,
  sampleTracks,
  styleBlendProfiles,
  type AdjustableFeatureKey,
  type ChordProgressionPreset,
  type CollaborativeCluster,
  type MoodPreset,
  type StyleBlendProfile,
  type TrackProfile,
} from "./musicIntelligenceData";

const trackIndex = new Map(sampleTracks.map((track) => [track.id, track]));
const moodIndex = new Map(moodPresets.map((preset) => [preset.id, preset]));
const blendIndex = new Map(styleBlendProfiles.map((profile) => [profile.id, profile]));
const progressionIndex = new Map(chordProgressionPresets.map((preset) => [preset.id, preset]));

const collaborativeClusters = Object.keys(collaborativeClusterLabels) as CollaborativeCluster[];
const recommendationCache = new Map<string, RecommendationBundle>();

interface RawFeatureState {
  energy: number;
  tempo: number;
  danceability: number;
  electronic: number;
  valence: number;
  groove: number;
  guitarFocus: number;
  globalFusion: number;
}

export interface RecommendationControls {
  seedTrackId: string;
  moodId: string;
  blendArtistId: string | null;
  chordProgressionId: string;
  energy: number;
  tempo: number;
  danceability: number;
  electronic: number;
  familiarity: number;
  guitaristMode: boolean;
  globalPulse: boolean;
  limit?: number;
}

export interface EmbeddingPoint {
  id: string;
  label: string;
  artist: string;
  x: number;
  y: number;
  region: string;
  genre: string;
  hybridScore: number | null;
}

export interface RecommendationResult {
  track: TrackProfile;
  hybridScore: number;
  modelScore: number;
  contentScore: number;
  collaborativeScore: number;
  tagScore: number;
  rhythmicSimilarity: number;
  familiarityAlignment: number;
  guitaristBoost: number;
  globalBoost: number;
  blendBoost: number;
  explanation: string[];
  modeRecommendation: string;
}

export interface RecommendationBundle {
  seedTrack: TrackProfile;
  mood: MoodPreset;
  blend: StyleBlendProfile | null;
  progression: ChordProgressionPreset;
  recommendations: RecommendationResult[];
  embedding: EmbeddingPoint[];
  primaryMode: string;
  narrativeArc: string;
  explainabilitySummary: string;
  latencyMs: number;
  usedCache: boolean;
}

function now() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeBpm(bpm: number) {
  return clamp((bpm - 80) / 60, 0, 1);
}

function normalizePercent(value: number) {
  return clamp(value / 100, 0, 1);
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function cosineSimilarity(left: number[], right: number[]) {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftMagnitude = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightMagnitude = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return clamp(dot / (leftMagnitude * rightMagnitude), 0, 1);
}

function overlapRatio(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  const overlap = [...leftSet].filter((value) => rightSet.has(value)).length;
  return union.size === 0 ? 0 : overlap / union.size;
}

function getTrackFeatureState(track: TrackProfile): RawFeatureState {
  return {
    energy: track.energy,
    tempo: track.bpm,
    danceability: track.danceability,
    electronic: track.electronic,
    valence: track.valence,
    groove: track.groove,
    guitarFocus: track.guitarFocus,
    globalFusion: track.globalFusion,
  };
}

function toContentVector(raw: RawFeatureState) {
  return [
    normalizePercent(raw.energy),
    normalizeBpm(raw.tempo),
    normalizePercent(raw.danceability),
    normalizePercent(raw.electronic),
    normalizePercent(raw.valence),
    normalizePercent(raw.groove),
    normalizePercent(raw.guitarFocus),
    normalizePercent(raw.globalFusion),
  ];
}

function toCollaborativeVector(track: TrackProfile) {
  return collaborativeClusters.map((cluster) => track.collaborative[cluster]);
}

function buildTargetFeatureState(
  seedTrack: TrackProfile,
  mood: MoodPreset,
  blend: StyleBlendProfile | null,
  progression: ChordProgressionPreset,
  controls: RecommendationControls,
) {
  const seed = getTrackFeatureState(seedTrack);
  const sliderBaseline: RawFeatureState = {
    energy: controls.energy,
    tempo: controls.tempo,
    danceability: controls.danceability,
    electronic: controls.electronic,
    valence: seed.valence,
    groove: seed.groove,
    guitarFocus: controls.guitaristMode ? seed.guitarFocus : seed.guitarFocus * 0.55,
    globalFusion: controls.globalPulse ? clamp(seed.globalFusion + 10, 0, 100) : seed.globalFusion,
  };

  const buildFeature = (feature: AdjustableFeatureKey, fallback = 0) =>
    clamp(
      seed[feature] * 0.46 +
        sliderBaseline[feature] * 0.36 +
        (mood.featureBias[feature] ?? 0) +
        (blend?.featureBias[feature] ?? 0) +
        (progression.featureBias[feature] ?? 0) +
        fallback,
      feature === "tempo" ? 80 : 0,
      feature === "tempo" ? 140 : 100,
    );

  return {
    energy: buildFeature("energy"),
    tempo: buildFeature("tempo"),
    danceability: buildFeature("danceability"),
    electronic: buildFeature("electronic"),
    valence: buildFeature("valence", mood.id === "festival" ? 3 : 0),
    groove: buildFeature("groove"),
    guitarFocus: buildFeature("guitarFocus", controls.guitaristMode ? 8 : -16),
    globalFusion: buildFeature("globalFusion", controls.globalPulse ? 8 : -8),
  };
}

function buildCollaborativeTarget(
  seedTrack: TrackProfile,
  mood: MoodPreset,
  blend: StyleBlendProfile | null,
  controls: RecommendationControls,
) {
  const base = collaborativeClusters.map((cluster) => seedTrack.collaborative[cluster]);
  const familiarity = clamp(controls.familiarity / 100, 0, 1);

  return base.map((value, index) => {
    const cluster = collaborativeClusters[index];
    const blendBias = blend?.collaborativeBias[cluster] ?? 0;
    const moodBias = mood.id === "global-hop" && cluster === "globalPulse"
      ? 0.12
      : mood.id === "focus" && cluster === "guitarNarrative"
        ? 0.06
        : 0;
    const familiarityBias = cluster === "guitarNarrative" || cluster === "altSoul"
      ? familiarity * 0.08
      : (1 - familiarity) * 0.08;
    const globalBias = controls.globalPulse && cluster === "globalPulse" ? 0.1 : 0;
    return clamp(value + blendBias + moodBias + familiarityBias + globalBias, 0, 1);
  });
}

function topCollaborativeLabels(track: TrackProfile) {
  return collaborativeClusters
    .map((cluster) => ({
      cluster,
      value: track.collaborative[cluster],
      label: collaborativeClusterLabels[cluster],
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 2)
    .map((entry) => entry.label);
}

function getModeAlignment(
  track: TrackProfile,
  progression: ChordProgressionPreset,
  blend: StyleBlendProfile | null,
  controls: RecommendationControls,
) {
  const requestedModes = new Set([...progression.compatibleModes, ...(blend?.modeHints ?? [])]);
  const matchedMode = track.modeHints.find((mode) => requestedModes.has(mode)) ?? track.modeHints[0];
  const matches = track.modeHints.filter((mode) => requestedModes.has(mode)).length;
  const chordScore = track.chordMatches.includes(progression.id) ? 1 : 0;
  const modeScore = requestedModes.size === 0 ? 0 : matches / requestedModes.size;
  const guitaristBonus = controls.guitaristMode ? clamp(track.guitarFocus / 100, 0, 1) : 0;

  return {
    matchedMode,
    modeScore,
    chordScore,
    guitaristBonus,
  };
}

function getRhythmicSimilarity(track: TrackProfile, target: RawFeatureState) {
  const bpmCloseness = 1 - clamp(Math.abs(track.bpm - target.tempo) / 38, 0, 1);
  const danceCloseness = 1 - clamp(Math.abs(track.danceability - target.danceability) / 30, 0, 1);
  const grooveCloseness = 1 - clamp(Math.abs(track.groove - target.groove) / 30, 0, 1);
  return clamp((bpmCloseness + danceCloseness + grooveCloseness) / 3, 0, 1);
}

function getBlendBoost(track: TrackProfile, blend: StyleBlendProfile | null) {
  if (!blend) {
    return 0;
  }

  const tagOverlap = overlapRatio(track.tags, blend.tags);
  return round(tagOverlap * 0.06, 3);
}

function getFamiliarityAlignment(
  track: TrackProfile,
  seedTrack: TrackProfile,
  contentScore: number,
  collaborativeScore: number,
  controls: RecommendationControls,
) {
  const familiarityPreference = clamp(controls.familiarity / 100, 0, 1);
  const seedAffinity = cosineSimilarity(
    toContentVector(getTrackFeatureState(track)),
    toContentVector(getTrackFeatureState(seedTrack)),
  );
  const familiarScore = seedAffinity * 0.55 + collaborativeScore * 0.45;
  const discoveryScore = normalizePercent(track.discovery) * 0.55
    + normalizePercent(track.globalFusion) * 0.2
    + (1 - seedAffinity) * 0.25;
  const alignment = familiarScore * familiarityPreference + discoveryScore * (1 - familiarityPreference);
  return clamp((alignment + contentScore * 0.2) / 1.2, 0, 1);
}

function createExplanation(args: {
  track: TrackProfile;
  seedTrack: TrackProfile;
  mood: MoodPreset;
  blend: StyleBlendProfile | null;
  progression: ChordProgressionPreset;
  controls: RecommendationControls;
  contentScore: number;
  collaborativeScore: number;
  rhythmicSimilarity: number;
  familiarityAlignment: number;
  modeAlignment: ReturnType<typeof getModeAlignment>;
  blendBoost: number;
}) {
  const {
    track,
    seedTrack,
    mood,
    blend,
    progression,
    controls,
    contentScore,
    collaborativeScore,
    rhythmicSimilarity,
    familiarityAlignment,
    modeAlignment,
    blendBoost,
  } = args;

  const reasons: string[] = [];
  const similarityPercent = Math.round(contentScore * 100);
  const rhythmPercent = Math.round(rhythmicSimilarity * 100);
  const collaborativePercent = Math.round(collaborativeScore * 100);

  reasons.push(
    `${similarityPercent}% audio-profile match across energy, danceability, tone, and groove density.`,
  );

  if (rhythmicSimilarity >= 0.72) {
    reasons.push(`Rhythmic contour lands at ${rhythmPercent}% similarity to your target tempo and pocket.`);
  } else {
    reasons.push(`It bends the groove just enough to open discovery without leaving the pocket behind.`);
  }

  if (collaborativeScore >= 0.66) {
    reasons.push(
      `Behavioral layer shows ${collaborativePercent}% listener crossover with ${seedTrack.artist} fans.`,
    );
  }

  if (controls.guitaristMode) {
    reasons.push(
      `Guitarist mode points to ${modeAlignment.matchedMode} over ${progression.chords} for the cleanest solo lane.`,
    );
  }

  if (controls.globalPulse && track.region !== seedTrack.region) {
    reasons.push(`Global Pulse creates a ${seedTrack.region} -> ${track.region} transition with preserved groove weight.`);
  }

  if (blend && blendBoost > 0.01) {
    reasons.push(`Style blend pulls in ${blend.label}'s ${blend.tags.slice(0, 2).join(" + ")} character.`);
  }

  if (familiarityAlignment > 0.7 && controls.familiarity >= 50) {
    reasons.push(`It stays within your familiar lane while still refreshing the harmonic color.`);
  }

  if (reasons.length < 4) {
    reasons.push(`The ${mood.label.toLowerCase()} target fits its ${track.genre.toLowerCase()} footprint unusually well.`);
  }

  return reasons.slice(0, 4);
}

function createNarrativeArc(seedTrack: TrackProfile, results: RecommendationResult[]) {
  const regionalFlow = results.slice(0, 3).map((result) => result.track.region);
  return [seedTrack.region, ...regionalFlow]
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(" -> ");
}

function createExplainabilitySummary(results: RecommendationResult[]) {
  const averageContent = Math.round(
    (results.reduce((sum, result) => sum + result.contentScore, 0) / Math.max(results.length, 1)) * 100,
  );
  const averageCollaborative = Math.round(
    (results.reduce((sum, result) => sum + result.collaborativeScore, 0) / Math.max(results.length, 1)) * 100,
  );

  return `Hybrid model blends ${averageContent}% average content similarity with ${averageCollaborative}% collaborative alignment, then layers progression and discovery logic for explainability.`;
}

function createPrimaryMode(results: RecommendationResult[]) {
  const modeCounts = new Map<string, number>();

  results.slice(0, 4).forEach((result) => {
    modeCounts.set(result.modeRecommendation, (modeCounts.get(result.modeRecommendation) ?? 0) + 1);
  });

  return [...modeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Dorian";
}

function createEmbedding(sampleScoreMap: Map<string, number>) {
  return sampleTracks.map((track) => {
    const x = round(
      clamp(track.danceability * 0.44 + track.globalFusion * 0.36 + (100 - track.electronic) * 0.2, 0, 100),
      1,
    );
    const y = round(
      clamp(track.energy * 0.42 + track.groove * 0.38 + track.guitarFocus * 0.2, 0, 100),
      1,
    );

    return {
      id: track.id,
      label: track.title,
      artist: track.artist,
      x,
      y,
      region: track.region,
      genre: track.genre,
      hybridScore: sampleScoreMap.has(track.id) ? sampleScoreMap.get(track.id) ?? null : null,
    };
  });
}

export function getDefaultRecommendationControls(): RecommendationControls {
  return { ...defaultAmieState };
}

export function getMusicIntelligenceBundle(input: RecommendationControls): RecommendationBundle {
  const controls: RecommendationControls = {
    ...getDefaultRecommendationControls(),
    ...input,
    blendArtistId: input.blendArtistId ?? null,
    limit: input.limit ?? 6,
  };
  const cacheKey = JSON.stringify(controls);

  if (recommendationCache.has(cacheKey)) {
    const cached = recommendationCache.get(cacheKey)!;
    return {
      ...cached,
      usedCache: true,
      latencyMs: 0.18,
    };
  }

  const startedAt = now();
  const seedTrack = trackIndex.get(controls.seedTrackId) ?? sampleTracks[0];
  const mood = moodIndex.get(controls.moodId) ?? moodPresets[0];
  const blend = controls.blendArtistId ? blendIndex.get(controls.blendArtistId) ?? null : null;
  const progression = progressionIndex.get(controls.chordProgressionId) ?? chordProgressionPresets[0];

  const targetState = buildTargetFeatureState(seedTrack, mood, blend, progression, controls);
  const targetVector = toContentVector(targetState);
  const collaborativeTarget = buildCollaborativeTarget(seedTrack, mood, blend, controls);
  const desiredTags = [
    ...seedTrack.tags,
    ...mood.tags,
    ...(blend?.tags ?? []),
    ...progression.tags,
  ];

  const recommendations = sampleTracks
    .filter((track) => track.id !== seedTrack.id)
    .map((track) => {
      const contentScore = cosineSimilarity(toContentVector(getTrackFeatureState(track)), targetVector);
      const collaborativeScore = cosineSimilarity(toCollaborativeVector(track), collaborativeTarget);
      const tagScore = overlapRatio(track.tags, desiredTags);
      const rhythmicSimilarity = getRhythmicSimilarity(track, targetState);
      const familiarityAlignment = getFamiliarityAlignment(track, seedTrack, contentScore, collaborativeScore, controls);
      const modeAlignment = getModeAlignment(track, progression, blend, controls);
      const guitaristBoost = controls.guitaristMode
        ? round((modeAlignment.chordScore * 0.04) + (modeAlignment.guitaristBonus * 0.04) + (modeAlignment.modeScore * 0.02), 3)
        : 0;
      const globalBoost = controls.globalPulse
        ? round(((track.region !== seedTrack.region ? 0.025 : 0) + normalizePercent(track.globalFusion) * 0.035), 3)
        : 0;
      const blendBoost = getBlendBoost(track, blend);
      const modelScore = 0.6 * contentScore + 0.4 * collaborativeScore;
      const hybridScore = clamp(
        modelScore * 0.84
          + tagScore * 0.05
          + rhythmicSimilarity * 0.04
          + familiarityAlignment * 0.04
          + guitaristBoost
          + globalBoost
          + blendBoost,
        0,
        0.99,
      );

      return {
        track,
        hybridScore,
        modelScore,
        contentScore,
        collaborativeScore,
        tagScore,
        rhythmicSimilarity,
        familiarityAlignment,
        guitaristBoost,
        globalBoost,
        blendBoost,
        modeRecommendation: modeAlignment.matchedMode,
        explanation: createExplanation({
          track,
          seedTrack,
          mood,
          blend,
          progression,
          controls,
          contentScore,
          collaborativeScore,
          rhythmicSimilarity,
          familiarityAlignment,
          modeAlignment,
          blendBoost,
        }),
      } satisfies RecommendationResult;
    })
    .sort((left, right) => right.hybridScore - left.hybridScore)
    .slice(0, controls.limit);

  const sampleScoreMap = new Map(recommendations.map((result) => [result.track.id, result.hybridScore]));
  const bundle: RecommendationBundle = {
    seedTrack,
    mood,
    blend,
    progression,
    recommendations,
    embedding: createEmbedding(sampleScoreMap),
    primaryMode: createPrimaryMode(recommendations),
    narrativeArc: createNarrativeArc(seedTrack, recommendations),
    explainabilitySummary: createExplainabilitySummary(recommendations),
    latencyMs: round(now() - startedAt, 2),
    usedCache: false,
  };

  recommendationCache.set(cacheKey, bundle);
  return bundle;
}

export function describeListenerOverlap(track: TrackProfile) {
  return topCollaborativeLabels(track);
}
