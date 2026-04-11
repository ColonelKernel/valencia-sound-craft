import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const mapToolMeta: RouteMetaConfig = {
  title: "Rhythm Map | Valencia Sound Craft",
  description:
    "Explore the global rhythm atlas by route, country, and cultural rhythm structure with shared playback state.",
  canonicalPath: "/tools/map",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Map",
    description:
      "A geographic rhythm browser that links countries, cultural groove structures, and playable sequencer state.",
    canonicalPath: "/tools/map",
    educationalUse: ["geographic music exploration", "rhythm study"],
  }),
};

