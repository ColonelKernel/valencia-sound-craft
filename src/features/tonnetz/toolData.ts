import { createToolStructuredData } from "@/components/seo/structuredData";
import type { RouteMetaConfig } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";

export const tonnetzToolMeta: RouteMetaConfig = {
  ...ROUTE_META.tonnetz,
  canonicalPath: ROUTE_META.tonnetz.path,
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Tonnetz",
    description:
      "A Tonnetz harmonic space explorer that plays in the same key and tempo as the rest of the music tools.",
    canonicalPath: ROUTE_META.tonnetz.path,
    educationalUse: ["harmony analysis", "neo-riemannian theory", "composition"],
  }),
};

