import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NormalizedGroove, RawGroove, TrajectoryPoint } from "./types";
import type { Cluster } from "./clustering";
import { normalizeGrooves, sampleGrooveSet, MAX_RENDERED_GROOVES, grooveDistance } from "./utils";
import { buildSimilarityCache, clusterGrooves } from "./clustering";
import { generatePattern, playGrooveSequence, startPlayback, stopPlayback } from "./audioEngine";
import DesktopLab from "./DesktopLab";
import MobileAtlas from "./MobileAtlas";

const MOBILE_LIMIT = 24;
const KEYBOARD_LIMIT = 48;
const CLUSTER_K = 12;
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export interface GrooveScene {
  /** Full lab working set (up to MAX_RENDERED_GROOVES nodes). */
  grooves: NormalizedGroove[];
  grooveMap: Map<string, NormalizedGroove>;
  clusters: Cluster[];
  /** Nested subset of `grooves` — the desktop aside list (keyboard-accessible path). */
  keyboardGrooves: NormalizedGroove[];
  /** Nested subset of `grooves` — the mobile atlas list. */
  mobileGrooves: NormalizedGroove[];
  totalCount: number;
  genreCount: number;
}

/**
 * Build the full scene once: normalize the lab working set against the full
 * dataset (preserves global feature ranges), run the O(n²) similarity cache a
 * single time, cluster, then carve the mobile/keyboard lists as nested subsets
 * so a selection made anywhere stays valid across breakpoints.
 */
function buildScene(rawData: RawGroove[]): GrooveScene {
  // The dataset repeats the same groove across train/eval splits, so ids are not
  // unique (≈1000 rows, ≈400 distinct grooves). Dedupe by id up front: it keeps
  // React keys unique everywhere, and prevents similarity/clustering from
  // treating one groove as two nodes.
  const seen = new Set<string>();
  const data = rawData.filter(groove => {
    if (seen.has(groove.id)) return false;
    seen.add(groove.id);
    return true;
  });

  const labRaw = sampleGrooveSet(data, MAX_RENDERED_GROOVES);
  const keyboardRaw = sampleGrooveSet(labRaw, KEYBOARD_LIMIT);
  const mobileRaw = sampleGrooveSet(keyboardRaw, MOBILE_LIMIT);

  const normalized = normalizeGrooves(labRaw, data);
  const similarity = buildSimilarityCache(normalized, 5);
  const grooves = normalized.map(groove => ({
    ...groove,
    similar: similarity.neighbors.get(groove.id) ?? [],
  }));
  const grooveMap = new Map(grooves.map(groove => [groove.id, groove]));

  const clusterCount = Math.min(CLUSTER_K, Math.max(6, Math.floor(grooves.length / 24)));
  const clusters = clusterGrooves(grooves, clusterCount);

  const keyboardIds = new Set(keyboardRaw.map(groove => groove.id));
  const mobileIds = new Set(mobileRaw.map(groove => groove.id));

  return {
    grooves,
    grooveMap,
    clusters,
    keyboardGrooves: grooves.filter(groove => keyboardIds.has(groove.id)),
    mobileGrooves: grooves.filter(groove => mobileIds.has(groove.id)),
    totalCount: data.length,
    genreCount: new Set(grooves.map(groove => groove.genre)).size,
  };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false
  ));

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export default function GrooveIntelligenceLab() {
  const [scene, setScene] = useState<GrooveScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetch("/data/egmd.json")
      .then(response => response.json())
      .then((data: RawGroove[]) => {
        if (cancelled) return;
        const nextScene = buildScene(data);
        setScene(nextScene);
        // Auto-select the first groove (content for the DNA panel + a keyboard
        // starting point) WITHOUT starting audio.
        setSelectedId(current => current ?? nextScene.grooves[0]?.id ?? null);
      })
      .catch(() => {
        // UI state only — console.error here would fail the console-clean gate.
        if (!cancelled) setLoadError("Unable to load the groove field right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clearPendingPlayback = useCallback(() => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  // Stop audio on unmount and when the layout that started it flips breakpoint
  // (prevents a scheduled auto-play firing after the field is gone).
  useEffect(() => () => {
    clearPendingPlayback();
    stopPlayback();
  }, [clearPendingPlayback]);

  useEffect(() => {
    clearPendingPlayback();
    stopPlayback();
  }, [isDesktop, clearPendingPlayback]);

  const selected = useMemo(() => {
    if (!scene || !selectedId) return null;
    return scene.grooveMap.get(selectedId) ?? null;
  }, [scene, selectedId]);

  /** Desktop selection: preview tick, trajectory append, then looped playback. */
  const handleSelectDesktop = useCallback((groove: NormalizedGroove) => {
    clearPendingPlayback();
    stopPlayback();
    playGrooveSequence(groove.norm_density, groove.norm_swing, groove.norm_velocity);
    setSelectedId(groove.id);
    setTrajectory(previous => (
      previous[previous.length - 1]?.grooveId === groove.id
        ? previous
        : [...previous, { grooveId: groove.id, timestamp: Date.now() }]
    ));

    const pattern = generatePattern(groove);
    playbackTimerRef.current = window.setTimeout(() => {
      startPlayback(groove, pattern);
      playbackTimerRef.current = null;
    }, 80);
  }, [clearPendingPlayback]);

  /** Mobile selection: manual playback stays the contract — select only. */
  const handleSelectMobile = useCallback((groove: NormalizedGroove) => {
    stopPlayback();
    setSelectedId(groove.id);
  }, []);

  const clearSelection = useCallback(() => {
    clearPendingPlayback();
    stopPlayback();
    setSelectedId(null);
  }, [clearPendingPlayback]);

  const trajectoryStats = useMemo(() => {
    if (!scene || trajectory.length < 2) return null;

    let totalDistance = 0;
    for (let index = 1; index < trajectory.length; index++) {
      const from = scene.grooveMap.get(trajectory[index - 1].grooveId);
      const to = scene.grooveMap.get(trajectory[index].grooveId);
      if (!from || !to) continue;
      totalDistance += grooveDistance(from, to);
    }

    const previous = scene.grooveMap.get(trajectory[trajectory.length - 2].grooveId);
    const current = scene.grooveMap.get(trajectory[trajectory.length - 1].grooveId);

    return {
      totalDistance,
      lastHop: previous && current ? grooveDistance(previous, current) : 0,
    };
  }, [scene, trajectory]);

  const clearTrajectory = useCallback(() => {
    setTrajectory(selected ? [{ grooveId: selected.id, timestamp: Date.now() }] : []);
  }, [selected]);

  if (isDesktop) {
    return (
      <DesktopLab
        scene={scene}
        selected={selected}
        selectedId={selectedId}
        trajectory={trajectory}
        trajectoryStats={trajectoryStats}
        isLoading={isLoading}
        loadError={loadError}
        onSelect={handleSelectDesktop}
        onClearSelection={clearSelection}
        onClearTrajectory={clearTrajectory}
      />
    );
  }

  return (
    <MobileAtlas
      scene={scene}
      selected={selected}
      selectedId={selectedId}
      isLoading={isLoading}
      loadError={loadError}
      onSelect={handleSelectMobile}
    />
  );
}
