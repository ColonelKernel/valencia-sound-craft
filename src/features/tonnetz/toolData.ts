import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const tonnetzToolMeta: RouteMetaConfig = {
  title: "Tonnetz | Valencia Sound Craft",
  description:
    "An interactive Tonnetz for exploring harmonic space, playing in the same key and tempo as the rest of the music tools.",
  canonicalPath: "/tools/tonnetz",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Tonnetz",
    description:
      "A Tonnetz harmonic space explorer that plays in the same key and tempo as the rest of the music tools.",
    canonicalPath: "/tools/tonnetz",
    educationalUse: ["harmony analysis", "neo-riemannian theory", "composition"],
  }),
};

