import { lazy, Suspense, useState } from "react";
import { Globe2, ScatterChart } from "lucide-react";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { GROOVE_ATLAS_JSONLD } from "@/app/routeStructuredData";
import { cn } from "@/lib/utils";

// Each lens is its own chunk: the Leaflet map and the canvas feel-space lab
// are both heavy, and most visits only open one of them.
const WorldAtlasLens = lazy(() => import("@/components/GrooveAtlas/WorldAtlasLens"));
const GrooveIntelligenceLab = lazy(() => import("@/components/GrooveIntelligence"));

type Lens = "atlas" | "feelspace";

const LENSES: Array<{ id: Lens; label: string; icon: typeof Globe2; hint: string }> = [
  { id: "atlas", label: "World Atlas", icon: Globe2, hint: "195 countries, cited traditions" },
  { id: "feelspace", label: "Feel-Space", icon: ScatterChart, hint: "grooves mapped by rhythmic feel" },
];

const lensFallback = (
  <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">
    Loading lens…
  </div>
);

/**
 * The Groove Atlas merges two ways of looking at rhythm: a cultural world map
 * backed by real citations, and a perceptual feel-space over a drum-performance
 * dataset. Switching lenses unmounts the inactive one, which stops its audio.
 */
const GrooveAtlasPage = () => {
  const [lens, setLens] = useState<Lens>("atlas");

  return (
    <>
      <RouteHead
        title={ROUTE_META.grooveAtlas.title}
        description={ROUTE_META.grooveAtlas.description}
        canonicalPath={ROUTE_META.grooveAtlas.path}
        jsonLd={GROOVE_ATLAS_JSONLD}
      />
      <main className="pt-16">
        <div className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Groove Atlas</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Rhythm traditions on the map, groove families by feel.
              </p>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Atlas lens">
              {LENSES.map(({ id, label, icon: Icon, hint }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={lens === id}
                  title={hint}
                  onClick={() => setLens(id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors",
                    lens === id
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {lens === "atlas" ? (
          <section className="container mx-auto px-6 py-8">
            <Suspense fallback={lensFallback}>
              <WorldAtlasLens />
            </Suspense>
          </section>
        ) : (
          <Suspense fallback={<div className="container mx-auto px-6 py-8">{lensFallback}</div>}>
            <GrooveIntelligenceLab />
          </Suspense>
        )}
      </main>
    </>
  );
};

export default GrooveAtlasPage;
