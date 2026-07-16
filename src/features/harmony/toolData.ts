import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export const harmonyToolMeta: RouteMetaConfig = {
  ...ROUTE_META.harmony,
  canonicalPath: ROUTE_META.harmony.path,
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Harmony Lab",
    description:
      "A harmony workspace combining mode visualization, progression building, theory references, and timing tools.",
    canonicalPath: ROUTE_META.harmony.path,
    educationalUse: ["music theory", "practice", "composition"],
  }),
};

