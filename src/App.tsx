import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  map: lazy(() => import("@/features/map/Tool")),
  circle: lazy(() => import("@/features/circle/Tool")),
  tonnetz: lazy(() => import("@/features/tonnetz/Tool")),
  musicAnalytics: lazy(() => import("./pages/MusicAnalyticsPage")),
  grooveAtlas: lazy(() => import("./pages/GrooveAtlasPage")),
  work: lazy(() => import("./pages/WorkPage")),
  notFound: lazy(() => import("./pages/NotFound")),
};

const ROUTE_KEYS = Object.keys(ROUTE_META) as RouteKey[];

const App = () => (
  <GlobalMusicProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Legacy path from before the Groove Lab / Rhythm Map merge. */}
            <Route path="/groove-intelligence" element={<Navigate to="/groove-atlas" replace />} />
            {ROUTE_KEYS.map((key) => {
              const Page = PAGES[key];
              return <Route key={key} path={ROUTE_META[key].path} element={<Page />} />;
            })}
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </GlobalMusicProvider>
);

export default App;
