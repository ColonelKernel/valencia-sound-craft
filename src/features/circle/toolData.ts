import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export const circleToolMeta: RouteMetaConfig = {
  ...ROUTE_META.circle,
  canonicalPath: ROUTE_META.circle.path,
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Circle of Fifths",
    description:
      "An interactive circle of fifths that keeps key and mode in step with the harmony and Tonnetz tools.",
    canonicalPath: ROUTE_META.circle.path,
    educationalUse: ["music theory", "key relationships", "harmony practice"],
  }),
};

