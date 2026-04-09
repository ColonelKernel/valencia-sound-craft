import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const rhythmToolMeta: RouteMetaConfig = {
  title: "Rhythm Engine | Valencia Sound Craft",
  description:
    "Playable global rhythm sequencing with atlas-backed rhythm identity, shared transport, and unified tempo state.",
  canonicalPath: "/tools/rhythm",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Engine",
    description:
      "A rhythm sequencing and exploration workspace for global groove structures, cultural rhythm identity, and real-time playback.",
    canonicalPath: "/tools/rhythm",
    educationalUse: ["rhythm training", "world music study", "composition"],
  }),
};

