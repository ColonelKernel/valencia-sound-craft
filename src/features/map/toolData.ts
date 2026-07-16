import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export const mapToolMeta: RouteMetaConfig = {
  ...ROUTE_META.map,
  canonicalPath: ROUTE_META.map.path,
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Map",
    description:
      "A geographic rhythm browser that links countries, cultural groove structures, and playable sequencer state.",
    canonicalPath: ROUTE_META.map.path,
    educationalUse: ["geographic music exploration", "rhythm study"],
  }),
};

