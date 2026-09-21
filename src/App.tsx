import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GlobalMusicProvider } from "@/state/globalMusicState";

import Layout from "./app/Layout";
import { ROUTE_META, type RouteKey } from "./app/routeMeta";

// Every page is lazy: the entry chunk carries only the shell (Layout,
// Navbar, Footer, providers) and the route table.
const PAGES: Record<RouteKey, LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import("./pages/Index")),
  toolsIndex: lazy(() => import("./pages/tools/ToolsIndex")),
  rhythm: lazy(() => import("@/features/rhythm/Tool")),
  harmony: lazy(() => import("@/features/harmony/Tool")),
  circle: lazy(() => import("@/features/circle/Tool")),
  tonnetz: lazy(() => import("@/features/tonnetz/Tool")),
  musicAnalytics: lazy(() => import("./pages/MusicAnalyticsPage")),
  projects: lazy(() => import("./pages/ProjectsPage")),
  // Must stay at the same index as its ROUTE_META entry — the head-stamping
  // plugin pairs the two lists positionally.
  autoharm: lazy(() => import("./pages/AutoHarmCaseStudy")),
  catalogIntelligence: lazy(() => import("./pages/CatalogIntelligenceCaseStudy")),
  transitAtlas: lazy(() => import("./pages/TransitAtlasCaseStudy")),
  sessionState: lazy(() => import("./pages/SessionStateCaseStudy")),
  work: lazy(() => import("./pages/WorkPage")),
  cv: lazy(() => import("./pages/CVPage")),
  notFound: lazy(() => import("./pages/NotFound")),
};

const ROUTE_KEYS = Object.keys(ROUTE_META) as RouteKey[];

const App = () => (
  <GlobalMusicProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* The Groove Atlas is retired. Both its own path and the older
              /groove-intelligence one land on the rhythm engine, which still
              mounts the same world map. */}
          <Route path="/groove-atlas" element={<Navigate to="/tools/rhythm" replace />} />
          <Route path="/groove-intelligence" element={<Navigate to="/tools/rhythm" replace />} />
          {/* /tools/map mounted GlobalRhythmEngine with the same props as
              /tools/rhythm, and the atlas renders inside that engine. Merged.
              public/_redirects carries the host-level 301 for direct hits;
              this covers client-side navigation from an old in-app link. */}
          <Route path="/tools/map" element={<Navigate to="/tools/rhythm" replace />} />
          {ROUTE_KEYS.map((key) => {
            const Page = PAGES[key];
            return <Route key={key} path={ROUTE_META[key].path} element={<Page />} />;
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  </GlobalMusicProvider>
);

export default App;
