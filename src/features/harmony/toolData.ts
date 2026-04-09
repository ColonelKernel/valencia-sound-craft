import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const harmonyToolMeta: RouteMetaConfig = {
  title: "Harmony Lab | Valencia Sound Craft",
  description:
    "Mode visualization, chord progression building, metronome control, and reference tools on a shared harmonic state model.",
  canonicalPath: "/tools/harmony",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Harmony Lab",
    description:
      "A harmony workspace combining mode visualization, progression building, theory references, and timing tools.",
    canonicalPath: "/tools/harmony",
    educationalUse: ["music theory", "practice", "composition"],
  }),
};

