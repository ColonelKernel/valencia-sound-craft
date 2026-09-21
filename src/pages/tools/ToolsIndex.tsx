import { Link } from "react-router-dom";
import { Compass, Globe2, Hexagon, Music2, Waves } from "lucide-react";

import { cardClasses } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import RouteHead from "@/components/seo/RouteHead";
import ToolSubnav from "@/components/tools/ToolSubnav";
import { ROUTE_META } from "@/app/routeMeta";
import { TOOLS_INDEX_JSONLD } from "@/app/routeStructuredData";

const toolCards = [
  {
    to: "/tools/rhythm",
    icon: Globe2,
    title: "Rhythm Engine",
    description: "Play, browse, and sequence rhythms from around the world.",
  },
  {
    to: "/tools/harmony",
    icon: Music2,
    title: "Harmony Lab",
    description: "Visualize scales, build progressions, and practice in time with the whole system.",
  },
  {
    to: "/tools/circle",
    icon: Waves,
    title: "Circle of Fifths",
    description: "Explore related keys — your key choice follows you into every other tool.",
  },
  {
    to: "/tools/tonnetz",
    icon: Hexagon,
    title: "Tonnetz",
    description: "Navigate harmonic space with the same key, tempo, and transport as the rest of the app.",
  },
];

const ToolsIndex = () => (
  <>
    <RouteHead
      title={ROUTE_META.toolsIndex.title}
      description={ROUTE_META.toolsIndex.description}
      canonicalPath={ROUTE_META.toolsIndex.path}
      jsonLd={TOOLS_INDEX_JSONLD}
    />

    <main className="min-h-screen bg-background pt-16">
      <section className="border-b border-border/70 bg-secondary/30 py-10">
        <div className="container mx-auto space-y-6">
          <p className="eyebrow">Tools</p>
          <div className="max-w-4xl space-y-4">
            <h1 className="type-h1">
              One Music System, Four Connected Tools
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Open any tool directly and start playing. Key, rhythm, tempo, and playback stay in sync across all of them, so you can move between tools without losing your place.
            </p>
          </div>
          <ToolSubnav />
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto">
          <article className={cardClasses({}, "text-sm leading-7 text-muted-foreground")}>
            <p>
              Each tool lives on its own page, so you can bookmark it, share a link to it, or jump straight into it. Whatever you set in one tool — key, rhythm, tempo — carries over to the rest, whether you are exploring world rhythms in the atlas or building progressions in the harmony lab.
            </p>
          </article>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {toolCards.map((card) => (
            <article
              key={card.to}
              className={cardClasses({}, "flex flex-col")}
            >
              <card.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 mb-5 text-sm leading-6 text-muted-foreground">{card.description}</p>
              <Link
                to={card.to}
                className={buttonClasses({ variant: "secondary", size: "sm" }, "mt-auto self-start")}
              >
                <Compass className="h-4 w-4" />
                Open tool
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* The engineering behind these tools was only legible to someone who
          found the repo. For a technical reader it is the most interesting
          thing on the page, so it says so here. */}
      <section className="pb-24">
        <div className="container mx-auto">
          <article className={cardClasses({ padding: "md" }, "max-w-3xl")}>
            <h2 className="text-xl font-semibold text-foreground">How it&rsquo;s built</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              All four tools share one global transport and a single{" "}
              <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">AudioContext</code> —
              set a tempo on the atlas and the sequencer is already holding it. They are
              written in TypeScript and React over the Web Audio and Web MIDI APIs, with the
              route table, rhythm catalog, and page content modelled as typed data whose
              invariants are enforced by tests rather than by convention.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Nothing reaches this page without passing the gate: typecheck, a zero-warning
              lint, the unit suites, a production build, an end-to-end Playwright run, a
              150&nbsp;KB gzip budget on the initial graph, and Lighthouse CI holding an
              accessibility score of 1.0 across all fourteen routes. Every one of those runs in
              GitHub Actions on each push and pull request —{" "}
              <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">
                .github/workflows/ci.yml
              </code>
              , if you want to check rather than take my word for it.
            </p>
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

export default ToolsIndex;

