import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const rhythmToolMeta: RouteMetaConfig = {
  title: "Rhythm Engine | Valencia Sound Craft",
  description:
    "Play and sequence rhythms from around the world — a rhythm atlas, browser, and step sequencer that stay in sync.",
  canonicalPath: "/tools/rhythm",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Engine",
    description:
      "A rhythm sequencing and exploration workspace for global groove structures, cultural rhythm identity, and real-time playback.",
    canonicalPath: "/tools/rhythm",
    educationalUse: ["rhythm training", "world music study", "composition"],
  }),
};

