import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { TRANSIT_ATLAS_JSONLD } from "@/app/routeStructuredData";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * Case study for the world transit atlas.
 *
 * Every count here was recomputed from data/networks/*.json and
 * data/timemachine_data.json rather than copied from the project's README —
 * which is how the line count came out at 1,298 where the README says 1,303,
 * and how the ridership coverage (33 of 201) surfaced at all. The vertex
 * reduction was re-derived by running Ramer-Douglas-Peucker over the raw
 * paths at the tolerance the generator uses.
 *
 * The repository credits "Built with Claude (Cowork)". Nothing on this page
 * claims the code was hand-written; the claims are about data assembly,
 * measurement and the decisions behind them.
 */

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: "What it is", value: "An interactive world atlas of urban rail — 201 metro, light-rail and tram systems you can scrub through time" },
  { label: "Coverage", value: "1,298 lines and 22,641 stations across 7 regions; 142 metro systems, 28 light rail, 18 tram, 13 mixed" },
  { label: "Geometry", value: "Real alignments from OpenStreetMap via Overpass, citylines.co, and public agency open-data portals — not schematic diagrams" },
  { label: "Ridership", value: "An annual figure for 196 of the 201; a monthly time series for only 33, from the US National Transit Database and municipal feeds" },
  { label: "Stack", value: "Python for fetch and generation, R (tidyverse) as the analysis layer, one self-contained HTML file as the output" },
  { label: "Status", value: "Live on GitHub Pages. Geometry is complete; ridership is not, and the page says which is which." },
];

const TransitAtlasCaseStudy = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.transitAtlas.title}
        description={ROUTE_META.transitAtlas.description}
        canonicalPath={ROUTE_META.transitAtlas.path}
        jsonLd={TRANSIT_ATLAS_JSONLD}
      />

      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-10">
              <Link
                to="/projects"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={14} /> All projects
              </Link>

              <p className="eyebrow mb-3">Case study</p>
              <h1 className="type-h1 mb-5">World Transit Atlas</h1>

              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Every urban rail network on earth that publishes its geometry, in one map you
                can scrub through time. 201 systems, drawn at their real coordinates rather
                than as schematic diagrams, with monthly ridership layered on for the systems
                that report it. My graduate degree is in transportation policy; this is the
                dataset I wanted then and could not assemble.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://colonelkernel.github.io/world-transit-atlas/"
                  className={buttonClasses({ variant: "primary" })}
                >
                  Open the atlas <ArrowUpRight size={15} />
                </a>
                <a
                  href="https://github.com/ColonelKernel/world-transit-atlas"
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Source <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <dl className={cardClasses({ padding: "none", flush: true }, "fade-up mb-16 divide-y divide-border")}>
              {AT_A_GLANCE.map((row) => (
                <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-foreground">{row.label}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="fade-up max-w-2xl space-y-12">
              <div>
                <h2 className="type-h2 mb-4">The gap the map fills</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Transit geometry is public almost everywhere and comparable almost nowhere.
                    OpenStreetMap has most of it under one schema but tagged by thousands of
                    contributors with different habits. Agencies publish their own, in their own
                    projections and formats, on portals that do not know about each other.
                    Comparing Cologne to Chicago means doing the reconciliation yourself.
                  </p>
                  <p>
                    So the work here is not the map. It is the assembly: 201 systems across
                    seven regions — 69 in Europe, 66 in Asia, 35 in North America, and the rest
                    across South America, the Middle East and Central Asia, Africa and Oceania —
                    pulled from Overpass, citylines.co and a long tail of agency open-data hubs,
                    then normalized into one shape. Depot tracks, sidings and disused heritage
                    alignments are filtered out, so what is drawn is passenger service.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">The bug that looked like missing data</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Thirty-four cities came back with stations but no lines. The obvious reading
                    was that OpenStreetMap simply had not mapped those routes as relations yet —
                    a coverage problem, nothing to be done about it from here.
                  </p>
                  <p>
                    It was not a coverage problem. The fetcher was asking Overpass for{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                      out tags geom;
                    </code>
                    , and <code className="font-mono text-xs">tags</code> there is not a modifier
                    that adds tags — it is an output <em>mode</em>, and it suppresses relation
                    member lists. The query was returning exactly what it asked for: relations
                    with no members, which serialize to zero lines. Every city it touched, every
                    time, regardless of how well mapped it was. Dropping one word fixed all of
                    them.
                  </p>
                  <p>
                    A second batch failed for a different reason. The mode map sent light-rail
                    cities to <code className="font-mono text-xs">route=light_rail</code> alone,
                    but German <em>Stadtbahn</em> networks — Cologne, Düsseldorf, Hanover — and
                    the Tyne &amp; Wear Metro are tagged inconsistently across{" "}
                    <code className="font-mono text-xs">tram</code> and{" "}
                    <code className="font-mono text-xs">light_rail</code> by the people who
                    mapped them. Querying one tag was a bet on a taxonomy that real contributors
                    never agreed to. It now queries across several route types.
                  </p>
                  <p>
                    Both are the same lesson in different clothes: a quiet empty result is a
                    claim about your query at least as often as it is a claim about the world.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">899,105 vertices into one file</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Raw OSM ways carry a vertex every few metres. Across all 1,298 lines that is{" "}
                    <strong className="text-foreground">899,105 points</strong> — about 19 MB of
                    geometry on disk, and far more precision than any screen can draw.
                  </p>
                  <p>
                    The generator runs Ramer-Douglas-Peucker on the way into the page at a
                    tolerance of roughly 17 metres, chosen because it sits below one screen pixel
                    at the deepest city zoom the map allows. That leaves{" "}
                    <strong className="text-foreground">217,378 vertices, a 76% reduction</strong>,
                    and brings the build from about 20 MB to 6.3 MB. The tolerance is a constant
                    at the top of the generator, so the size-versus-precision trade is one number
                    someone can argue with rather than a decision buried in a pipeline.
                  </p>
                  <p>
                    The full-fidelity geometry is kept in the repository. Only the rendered page
                    is simplified — the analysis layer still reads the real thing.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Ridership is the thin layer, and it should say so</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    All 201 systems carry geometry, and 196 carry a single annual ridership
                    figure. What only{" "}
                    <strong className="text-foreground">33 of them carry is a time series</strong>{" "}
                    — monthly figures from the US National Transit Database and a handful of
                    municipal feeds, running from 2002 to 2026 at their deepest and seven months
                    at their shallowest. The map can size almost every city by how many people
                    ride it. Only a sixth of them can be watched changing.
                  </p>
                  <p>
                    That asymmetry is the most important thing to understand about the atlas and
                    the easiest thing to miss, because the time dial moves the whole map. Scrub
                    to March 2020 and the collapse you see and hear is real — it is just being
                    reported by a few dozen systems, most of them American, not by the world.
                    Any cross-city ridership claim from this dataset is a claim about the
                    agencies that publish monthly open data, which is a biased sample of the
                    world's transit and biased in a direction worth naming: toward the anglophone
                    and the well funded.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">What the city boundary actually is</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The fetcher sweeps a 45 km radius around each city centre, which is a
                    pragmatic definition of a city and not a real one. In dense conurbations it
                    bleeds: Cologne picks up Bonn's 6x lines and Düsseldorf's 70x, and
                    Düsseldorf's entry spans much of the Rhine-Ruhr. The geometry is real and in
                    the right place; the label on it is coarser than it sounds.
                  </p>
                  <p>
                    It is a single constant in the fetcher, so anyone who needs strictly
                    municipal networks can lower it and refetch. I left it wide because a
                    network that stops at an administrative line is the less honest picture of
                    how people actually move — but that is a judgment, and it is the reader's to
                    disagree with.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">What is missing</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    No service frequency, so a line drawn here says nothing about whether a train
                    comes every three minutes or every forty. No travel times, no accessibility
                    data. Commuter rail and bus rapid transit are excluded, which understates
                    cities whose backbone is either. The covariate layer — population, density,
                    GDP per capita, motorization — is joined and available in the R side but does
                    no work in the map yet.
                  </p>
                  <p>
                    The system attributes thin out fast behind the headline ones. Opening year is
                    complete at 201 of 201, but ownership and operating model reach 108, grade of
                    automation 67, and farebox recovery only 41. Anything built on those is a
                    statement about a subset, and a subset nobody sampled deliberately.
                  </p>
                  <p>
                    And the counts here are recomputed from the data files rather than taken from
                    the project's own README, which reports 1,303 lines where the files hold
                    1,298. A number on a résumé should be one you can reproduce on demand; this
                    is what that check looks like when it turns something up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TransitAtlasCaseStudy;
