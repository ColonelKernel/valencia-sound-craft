/**
 * Level-of-detail manager: decides what to render based on zoom + viewport.
 */

import type { Cluster } from "./clustering";
import type { Camera } from "./camera";
import { getViewport, getLODLevel } from "./camera";
import { SpatialIndex } from "./spatialIndex";

interface LODGroove {
  id: string;
  px: number;
  py: number;
  cx: number;
  cy: number;
}

export interface LODResult<T extends LODGroove> {
  level: 1 | 2 | 3;
  /** Clusters to render (level 1–2) */
  visibleClusters: Cluster[];
  /** Individual grooves to render (level 2–3) */
  visibleGrooves: T[];
  /** Whether to show glow effects */
  showGlow: boolean;
  /** Whether to show labels */
  showLabels: boolean;
  /** Node scale multiplier */
  nodeScale: number;
}

export function computeLOD<T extends LODGroove>(
  camera: Camera,
  allGrooves: T[],
  clusters: Cluster[],
  spatialIndex: SpatialIndex<T>,
  grooveMap: Map<string, T>,
  maxVisibleGrooves = 280,
): LODResult<T> {
  const level = getLODLevel(camera.zoom);
  const vp = getViewport(camera);
  const centerX = vp.x + vp.w / 2;
  const centerY = vp.y + vp.h / 2;

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

  let visibleGrooves: T[];

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

  if (visibleGrooves.length > maxVisibleGrooves) {
    visibleGrooves = visibleGrooves
      .slice()
      .sort((a, b) => {
        const da = (a.cx - centerX) ** 2 + (a.cy - centerY) ** 2;
        const db = (b.cx - centerX) ** 2 + (b.cy - centerY) ** 2;
        return da - db;
      })
      .slice(0, maxVisibleGrooves);
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
