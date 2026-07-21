import { Link } from "react-router-dom";
import { Compass, Globe2, Hexagon, Music2, RadioTower, Waves } from "lucide-react";

import RouteHead from "@/components/seo/RouteHead";
import { createToolStructuredData } from "@/components/seo/structuredData";
import ToolSubnav from "@/components/tools/ToolSubnav";
import { ROUTE_META } from "@/app/routeMeta";

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
    to: "/tools/map",
    icon: RadioTower,
    title: "Rhythm Map",
    description: "Jump straight into the atlas and keep region, rhythm, and playback aligned.",
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
      jsonLd={createToolStructuredData({
        name: "Valencia Sound Craft Tools",
        description:
          "A routed collection of interactive music tools for rhythm, harmony, theory, and composition.",
        canonicalPath: ROUTE_META.toolsIndex.path,
        educationalUse: ["music theory", "practice", "composition", "rhythm training"],
      })}
    />

    <main className="min-h-screen bg-background pt-24">
      <section className="border-b border-border/70 bg-secondary/30 px-6 py-10">
        <div className="container mx-auto space-y-6">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Tools</p>
          <div className="max-w-4xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              One Music System, Five Connected Tools
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Open any tool directly and start playing. Key, rhythm, tempo, and playback stay in sync across all of them, so you can move between tools without losing your place.
            </p>
          </div>
          <ToolSubnav />
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="container mx-auto">
          <article className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5 text-sm leading-7 text-muted-foreground shadow-[0_20px_50px_-40px_rgba(0,0,0,0.75)]">
            <p>
              Each tool lives on its own page, so you can bookmark it, share a link to it, or jump straight into it. Whatever you set in one tool — key, rhythm, tempo — carries over to the rest, whether you are exploring world rhythms on the map or building progressions in the harmony lab.
            </p>
          </article>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="container mx-auto grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {toolCards.map((card) => (
            <article
              key={card.to}
              className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_18px_45px_-34px_rgba(0,0,0,0.8)]"
            >
              <card.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
              <Link
                to={card.to}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Compass className="h-4 w-4" />
                Open tool
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  </>
);

export default ToolsIndex;

