import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalMusicProvider } from "@/state/globalMusicState";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const ToolsLayout = lazy(() => import("./pages/tools/ToolsLayout.tsx"));
const ToolsIndex = lazy(() => import("./pages/tools/ToolsIndex.tsx"));
const RhythmTool = lazy(() => import("@/features/rhythm/Tool"));
const HarmonyTool = lazy(() => import("@/features/harmony/Tool"));
const MapTool = lazy(() => import("@/features/map/Tool"));
const CircleTool = lazy(() => import("@/features/circle/Tool"));
const TonnetzTool = lazy(() => import("@/features/tonnetz/Tool"));
const MusicAnalyticsPage = lazy(() => import("./pages/MusicAnalyticsPage"));
const GrooveIntelligencePage = lazy(() => import("./pages/GrooveIntelligencePage"));
const MusicIntelligencePage = lazy(() => import("./pages/MusicIntelligencePage"));
const TransitSynthPage = lazy(() => import("./pages/TransitSynthPage"));

const routeFallback = (
  <div className="min-h-screen bg-background pt-24">
    <div className="container mx-auto px-6 py-10 text-sm text-muted-foreground">Loading route…</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalMusicProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tools" element={<ToolsLayout />}>
                <Route index element={<ToolsIndex />} />
                <Route path="rhythm" element={<RhythmTool />} />
                <Route path="harmony" element={<HarmonyTool />} />
                <Route path="map" element={<MapTool />} />
                <Route path="circle" element={<CircleTool />} />
                <Route path="tonnetz" element={<TonnetzTool />} />
              </Route>
              <Route path="/music-analytics" element={<MusicAnalyticsPage />} />
              <Route path="/music-intelligence" element={<MusicIntelligencePage />} />
              <Route path="/transit-synth" element={<TransitSynthPage />} />
              <Route path="/groove-intelligence" element={<GrooveIntelligencePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalMusicProvider>
  </QueryClientProvider>
);

export default App;
