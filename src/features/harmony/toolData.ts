import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const harmonyToolMeta: RouteMetaConfig = {
  title: "Harmony Lab | Valencia Sound Craft",
  description:
    "Visualize modes, build chord progressions, and practice with a metronome and theory references in one connected workspace.",
  canonicalPath: "/tools/harmony",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Harmony Lab",
    description:
      "A harmony workspace combining mode visualization, progression building, theory references, and timing tools.",
    canonicalPath: "/tools/harmony",
    educationalUse: ["music theory", "practice", "composition"],
  }),
};

