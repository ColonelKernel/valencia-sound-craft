import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const tonnetzToolMeta: RouteMetaConfig = {
  title: "Tonnetz | Valencia Sound Craft",
  description:
    "Interactive Tonnetz with shared key, mode, tempo, transport, and harmony context across the music tools.",
  canonicalPath: "/tools/tonnetz",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Tonnetz",
    description:
      "A Tonnetz harmonic space explorer that shares key, tempo, and transport with the rest of the music application.",
    canonicalPath: "/tools/tonnetz",
    educationalUse: ["harmony analysis", "neo-riemannian theory", "composition"],
  }),
};

