import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const mapToolMeta: RouteMetaConfig = {
  title: "Rhythm Map | Valencia Sound Craft",
  description:
    "Explore a world rhythm atlas by country and tradition, and hear each groove play as you browse.",
  canonicalPath: "/tools/map",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Map",
    description:
      "A geographic rhythm browser that links countries, cultural groove structures, and playable sequencer state.",
    canonicalPath: "/tools/map",
    educationalUse: ["geographic music exploration", "rhythm study"],
  }),
};

