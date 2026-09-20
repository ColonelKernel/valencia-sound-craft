import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import CaseStudyFooter from "@/components/CaseStudyFooter";
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
 * which is how the line count came out at 1,298 where the README said 1,303
 * (since corrected), and how the ridership coverage surfaced at all.
 *
 * The regression figures come from running tools/ridership_model.py against
 * data/research/ridership_verified.csv, not from notes. They moved four times
 * while this page was being written, every time in the direction of a smaller
 * claim, and the page says so because that is the interesting part.
 *
 * Re-audited 2026-09-20 against the atlas repository, because three passages
 * did not reconcile with each other and a page arguing for reproducible
 * numbers cannot leave that standing. Three were wrong:
 *
 *   - The density model's sample. The page said a column missing for 21
 *     cities shrank it from 196 to 149. Adding urban_area_km2 to spec F's
 *     requirements drops 22 cities and leaves 174; no combination of the
 *     covariate columns reaches 149. Corrected to 22 and 174.
 *   - "thirteen of them the highest-ridership European systems" — twelve are
 *     European, and they are not the largest: the biggest system dropped is
 *     Guangzhou, and the German ones are mid-sized. Corrected to twelve,
 *     with the superlative removed.
 *   - Operating model reaches 81, not the 108 that ownership reaches. The
 *     two were sharing a number.
 *
 * Two others read as contradictions and were not. "28 of the 30 Chinese
 * systems" is exact — ridership_long.csv has 28 station_entries and 2 already
 * unlinked_trips — and verify_camet.py tests all thirty regardless of label,
 * which is why 14+12+4 exceeds 28. And "a sixth, Kochi" always referred to
 * the five disputed systems; a sentence about nine sat between them. Both
 * passages now say so rather than leaving the reader to work it out.
 *
 * Everything else checked out: spec F at n=196 and adjusted R² 0.677, the age
 * elasticity +0.628 → +0.362, population +0.386, boardings +1.048 with Asia
 * and −1.015 without, trips per capita 52/47/32, 49 of 58 countries on one
 * convention, the CAMET totals and their 1.666 ratio, Taiyuan and Ürümqi to
 * the unit, 14/12/4 and twenty-six relabelled, the five disputed systems by
 * name, 33 monthly series, and 201/108/67/41 on the attribute counts.
 *
 * The repository credits "Built with Claude (Cowork)". Nothing on this page
 * claims the code was hand-written; the claims are about data assembly,
 * measurement and the decisions behind them.
 */

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: "What it is", value: "An interactive world atlas of urban rail — 201 metro, light-rail and tram systems you can scrub through time" },
  { label: "Coverage", value: "1,298 lines and 22,641 stations across 7 regions; 142 metro systems, 28 light rail, 18 tram, 13 mixed" },
  { label: "Geometry", value: "Real alignments from OpenStreetMap via Overpass, citylines.co, and public agency open-data portals — not schematic diagrams" },
  { label: "Ridership", value: "An annual figure for 196 of the 201; a monthly time series for only 33. What each figure counts is now recorded for 187 of them — it was 24" },
  { label: "Stack", value: "Python for fetch and generation, R (tidyverse) as the analysis layer, one self-contained HTML file as the output" },
  { label: "Result", value: "A regression that looked publishable, and did not survive its own data being checked" },
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
                <h2 className="type-h2 mb-4">The finding that did not survive</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    With a complete 201-city cross-section sitting unused, the obvious thing
                    was to regress ridership on it. Density came back at{" "}
                    <strong className="text-foreground">+0.53, p=0.0001</strong>. Denser
                    cities ride more — a clean result, the kind that goes on a r&eacute;sum&eacute;.
                  </p>
                  <p>
                    Then came a one-line question:{" "}
                    <em>may want to verify the data is of the same type and comparable by unit.</em>{" "}
                    It turned out to be the most expensive sentence in the project, and it was
                    right.
                  </p>
                  <p>
                    Agencies do not count the same thing. Some report{" "}
                    <strong className="text-foreground">boardings</strong> — every leg of a
                    journey, so one trip with a transfer counts twice. Some report{" "}
                    <strong className="text-foreground">linked journeys</strong> — one count
                    door to door. Some report{" "}
                    <strong className="text-foreground">faregate entries</strong>. For identical
                    travel these differ by 1.2&ndash;1.6&times;, and transfer rates rise with
                    network size and age — which were exactly the variables in the regression.
                    An unrecorded convention does not add noise. It adds slope.
                  </p>
                  <p>
                    Nothing in the dataset said which was which for 177 of the 201 systems. So
                    the finding could not be published, and the work became building the thing
                    that would let it be.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Four axes, and the one nobody has data for</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The provenance turned out to exist already — written alongside the atlas
                    and dropped at the packaging step, because the generator re-serializes its
                    data file verbatim and that file has no units field. The repository shipped
                    the numbers and left behind the record of what they meant. Recovering it
                    moved the counting convention from known for 24 systems to known for{" "}
                    <strong className="text-foreground">187 of the 196</strong> that carry a
                    figure at all.
                  </p>
                  <p>
                    But the convention is only the first of four axes a cross-city ratio
                    depends on. The second is the <em>denominator</em>: the old check tested
                    whether the population source contained the string
                    &ldquo;Demographia&rdquo;, a vendor name standing in for a concept, which
                    misfiled fifteen cities using the identical concept under a national name —
                    French <em>unit&eacute; urbaine</em>, Swedish <em>t&auml;tort</em>, Finnish{" "}
                    <em>taajama</em>, Norwegian <em>tettsted</em>. The third is vintage: these
                    figures run 2013 to 2026, straddling COVID.
                  </p>
                  <p>
                    The fourth is recorded nowhere, and naming it matters more than the three
                    that were fixed. It is what <em>modes</em> the numerator covers. Prague
                    reads as 488 trips per capita, roughly five times the European median, and
                    it is tagged metro-plus-tram — but the operator&rsquo;s headline figure
                    covers the whole agency, buses included. Three graded axes should not be
                    allowed to imply the problem is solved.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">One identity, twenty-six relabelled systems</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The recovered provenance labelled 28 of the 30 Chinese systems as faregate
                    entries. China is 15% of the atlas and that was more than half of the
                    entire entries category, so it was worth checking rather than trusting.
                  </p>
                  <p>
                    The China Association of Metros publishes two columns side by side for
                    every city: <span className="font-mono text-xs">客运量</span> and{" "}
                    <span className="font-mono text-xs">进站量</span>. The report proves which
                    is which without anyone needing to translate a definition. For every{" "}
                    <strong className="text-foreground">single-line</strong> city the two
                    columns are bit-identical — Taiyuan 48,199,200 against 48,199,200, Ürümqi
                    43,346,700 against 43,346,700. A single-line network has no transfers, so a
                    boarding and a station entry are the same event. Everywhere else the columns
                    diverge, and the gap between them <em>is</em> the transfer volume:
                    nationally 32.3 billion against 19.4 billion, a ratio of 1.666.
                  </p>
                  <p>
                    So the headline Chinese figure is boardings, and the label was wrong. The
                    check is written as a script that tests each city&rsquo;s recorded value
                    against <em>both</em> columns rather than applying the inference wholesale,
                    and it tests all thirty rather than only the twenty-eight — a label that
                    already reads <span className="font-mono text-xs">unlinked_trips</span> is
                    still worth confirming. Fourteen match to within 0.2%, twelve more to within
                    6% — the atlas carries some 2025 figures against a 2024 report — and four
                    match neither, because their vintage predates the report entirely.
                    Wuxi&rsquo;s number is from 2016. Those four were cleared to unknown rather
                    than guessed, which is why twenty-six is the number in the heading and
                    thirty is the number tested.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">What the verified data says, which is less</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Refitting on corrected data did not rescue the result. It removed most of
                    it, in four rounds.
                  </p>
                  <p>
                    <strong className="text-foreground">Density was never a variable.</strong>{" "}
                    Density equals population over area for 178 of the 178 systems carrying
                    both, so with population already in the model the density coefficient was
                    algebraically minus the <em>area</em> coefficient — a geometric identity
                    about a denominator I had constructed, wearing the clothes of a behavioural
                    elasticity. It also required a column missing for 22 cities, twelve of
                    them European, which shrank the sample from 196 to 174 and inflated the
                    very gap it sat beside.
                  </p>
                  <p>
                    <strong className="text-foreground">
                      The counting convention cannot be separated from geography.
                    </strong>{" "}
                    The boardings effect is +1.05 with Asia in the sample and −1.02 without it;
                    leave-one-region-out swings it across that whole range depending only on
                    which continent steps out. And the raw numbers settle it without a
                    coefficient at all: mean trips per capita run 52 for journey-reporting
                    systems, 47 for entries, 32 for boardings — which <em>inverts</em> the
                    ordering the bookkeeping requires, since boardings count every leg. A dummy
                    that reverses the thing it is meant to measure is not measuring it. Forty-nine
                    of 58 countries use exactly one convention, so convention and country are
                    very nearly the same variable.
                  </p>
                  <p>
                    <strong className="text-foreground">Network age halved.</strong> Station
                    counts for all 201 systems were sitting in the geometry files, unused as a
                    control. Adding them cut the age elasticity from +0.63 to{" "}
                    <strong className="text-foreground">+0.36</strong>. Old systems have big
                    networks; half the age effect was network size.
                  </p>
                  <p>
                    What is left, at n=196 and adjusted R&sup2; 0.68: ridership scales{" "}
                    <strong className="text-foreground">sublinearly</strong> with city
                    population, elasticity +0.39; network age holds at +0.36; and mode matters
                    more than any of it. Two attenuated elasticities and a negative result. That
                    is a smaller claim than the one I started with, and it is the only one the
                    data supports.
                  </p>
                  <p>
                    The part worth keeping is the mechanism. Before the Chinese labels were
                    fixed, the entries effect was +1.13 at p&lt;0.0001 and looked like the one
                    robust convention finding in the dataset. It was twenty-six mislabelled
                    systems. Correcting a data error dissolved a significant result — which is
                    the argument for doing the verification first, made in the only way that is
                    actually convincing.
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
                    cities whose backbone is either. The covariate layer now drives the analysis
                    above, but still does no work in the map itself.
                  </p>
                  <p>
                    The system attributes thin out fast behind the headline ones. Opening year is
                    complete at 201 of 201, but ownership reaches 108, operating model 81, grade
                    of automation 67, and farebox recovery only 41. Anything built on those is a
                    statement about a subset, and a subset nobody sampled deliberately.
                  </p>
                  <p>
                    Five systems&rsquo; ridership figures match no source that could be located —
                    Doha, Dhaka, Nagpur, Incheon and Taoyuan — and they are marked disputed in
                    the dataset rather than left looking sound. A sixth, Kochi, was checked while
                    this page was being written and could not be confirmed either: the
                    operator&rsquo;s table carried only four months of the year in question, so
                    it is recorded as unverified rather than verified. Separately, nine of the
                    196 systems carrying a ridership figure have no established counting
                    convention at all.
                  </p>
                  <p>
                    And the counts here are recomputed from the data files rather than taken from
                    the project&rsquo;s own README, which reported 1,303 lines where the files
                    hold 1,298. That one is now fixed upstream. A number on a résumé should be
                    one you can reproduce on demand; this is what that check looks like when it
                    turns something up.
                  </p>
                </div>
              </div>
            </div>

            <CaseStudyFooter current="transitAtlas" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default TransitAtlasCaseStudy;
