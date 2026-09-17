import { lazy, Suspense, useState } from "react";
import { Globe2, ScatterChart } from "lucide-react";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { GROOVE_ATLAS_JSONLD } from "@/app/routeStructuredData";
import { cardClasses } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

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
  <div className={cardClasses({ padding: "md" }, "text-sm text-muted-foreground")}>
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
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 py-3">
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
                  className={buttonClasses(
                    { variant: "secondary", size: "sm" },
                    lens === id && "border-primary/60 bg-primary/10 text-foreground",
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
          <section className="container mx-auto py-8">
            <Suspense fallback={lensFallback}>
              <WorldAtlasLens />
            </Suspense>
          </section>
        ) : (
          <Suspense fallback={<div className="container mx-auto py-8">{lensFallback}</div>}>
            <GrooveIntelligenceLab />
          </Suspense>
        )}

        {/* The feel-space lens is the most quantitative thing on the site after
            the catalog dashboard, and none of that was visible from the page. */}
        <section className="border-t border-border/70 bg-secondary/20 py-12">
          <div className="container mx-auto">
            <article className={cardClasses({ padding: "md" }, "max-w-3xl")}>
              <h2 className="text-xl font-semibold text-foreground">How this is built</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  The feel-space lens runs k-means over 1,000 performances sampled from the
                  Expanded Groove MIDI Dataset (E-GMD v1.0.0, Google Magenta), in a
                  five-dimensional feature space: tempo, note density, syncopation, swing ratio
                  and velocity variance, each normalized before any distance is taken. Seeding
                  is farthest-point rather than random: the first centroid is the groove
                  nearest the middle of the field, and each next one is whichever groove is
                  furthest from everything chosen so far. That makes the layout deterministic,
                  and a clustering that reshuffles on reload is a clustering nobody can reason
                  about.
                </p>
                <p>
                  What the clusters buy is rendering. Points go into a quadtree and a
                  level-of-detail manager decides, from the camera and the viewport, whether to
                  draw cluster centroids, a handful of representatives, or the individual
                  grooves. Zoomed out, the canvas draws a dozen shapes instead of a thousand.
                  The camera, the spatial index and the LOD rules each have their own unit
                  suite, because they are the parts where a wrong answer looks like a rendering
                  bug rather than a logic error.
                </p>
                <p>
                  The two lenses are separate chunks and switching unmounts the inactive one,
                  which is also how its audio gets stopped. The atlas side is Leaflet over 195
                  country centroids, with 103 ethnomusicological citations attached to 39 of
                  the traditions — every one fetched and read before it was recorded, and
                  traditions that could not be credibly sourced left uncited rather than
                  decorated. The feel-space side is a canvas. Neither loads until you ask.
                </p>
              </div>
              <a
                href="https://github.com/ColonelKernel/valencia-sound-craft"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Read the source
              </a>
            </article>
          </div>
        </section>
      </main>
    </>
  );
};

export default GrooveAtlasPage;
