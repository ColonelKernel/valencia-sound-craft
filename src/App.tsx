import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalMusicProvider } from "@/state/globalMusicState";

import Layout from "./app/Layout";
import { ROUTE_META, type RouteKey } from "./app/routeMeta";

const queryClient = new QueryClient();

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
  grooveIntelligence: lazy(() => import("./pages/GrooveIntelligencePage")),
  notFound: lazy(() => import("./pages/NotFound")),
};

const ROUTE_KEYS = Object.keys(ROUTE_META) as RouteKey[];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalMusicProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {ROUTE_KEYS.map((key) => {
                const Page = PAGES[key];
                return <Route key={key} path={ROUTE_META[key].path} element={<Page />} />;
              })}
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalMusicProvider>
  </QueryClientProvider>
);

export default App;
