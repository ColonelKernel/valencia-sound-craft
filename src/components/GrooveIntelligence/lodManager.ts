/**
 * Level-of-detail manager: decides what to render based on zoom + viewport.
 */

import type { NormalizedGroove } from "./types";
import type { Cluster } from "./clustering";
import type { Camera } from "./camera";
import { getViewport, getLODLevel } from "./camera";
import { SpatialIndex } from "./spatialIndex";

export interface LODResult {
  level: 1 | 2 | 3;
  /** Clusters to render (level 1–2) */
  visibleClusters: Cluster[];
  /** Individual grooves to render (level 2–3) */
  visibleGrooves: NormalizedGroove[];
  /** Whether to show glow effects */
  showGlow: boolean;
  /** Whether to show labels */
  showLabels: boolean;
  /** Node scale multiplier */
  nodeScale: number;
}

export function computeLOD(
  camera: Camera,
  allGrooves: NormalizedGroove[],
  clusters: Cluster[],
  spatialIndex: SpatialIndex<NormalizedGroove>,
  grooveMap: Map<string, NormalizedGroove>,
): LODResult {
  const level = getLODLevel(camera.zoom);
  const vp = getViewport(camera);

  // Expand viewport slightly for smooth edges
  const pad = 0.05 / camera.zoom;
  const queryVp = {
    x: vp.x - pad,
    y: vp.y - pad,
    w: vp.w + pad * 2,
    h: vp.h + pad * 2,
  };

  // Visible clusters: those whose centroid is in viewport
  const visibleClusters = clusters.filter(c =>
    c.centroid.px >= queryVp.x && c.centroid.px <= queryVp.x + queryVp.w &&
    c.centroid.py >= queryVp.y && c.centroid.py <= queryVp.y + queryVp.h
  );

  let visibleGrooves: NormalizedGroove[];

  if (level === 1) {
    // Overview: no individual grooves
    visibleGrooves = [];
  } else if (level === 2) {
    // Mid-zoom: show representatives only (max ~200-300)
    const repIds = new Set<string>();
    for (const c of visibleClusters) {
      for (const rid of c.representatives) repIds.add(rid);
    }
    visibleGrooves = [];
    for (const id of repIds) {
      const g = grooveMap.get(id);
      if (g) visibleGrooves.push(g);
    }
    // Cap at 300
    if (visibleGrooves.length > 300) visibleGrooves = visibleGrooves.slice(0, 300);
  } else {
    // Detail: query spatial index for viewport
    visibleGrooves = spatialIndex.queryViewport(queryVp.x, queryVp.y, queryVp.w, queryVp.h);
  }

  return {
    level,
    visibleClusters,
    visibleGrooves,
    showGlow: level >= 2,
    showLabels: level === 3,
    nodeScale: level === 3 ? 1.0 : level === 2 ? 0.7 : 0.4,
  };
}
