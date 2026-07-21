import { createToolStructuredData } from "@/components/seo/structuredData";
import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export const rhythmToolMeta: RouteMetaConfig = {
  ...ROUTE_META.rhythm,
  canonicalPath: ROUTE_META.rhythm.path,
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Rhythm Engine",
    description:
      "A rhythm sequencing and exploration workspace for global groove structures, cultural rhythm identity, and real-time playback.",
    canonicalPath: ROUTE_META.rhythm.path,
    educationalUse: ["rhythm training", "world music study", "composition"],
  }),
};

