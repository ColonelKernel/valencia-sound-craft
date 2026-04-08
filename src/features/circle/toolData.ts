import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const circleToolMeta: RouteMetaConfig = {
  title: "Circle of Fifths | Valencia Sound Craft",
  description:
    "Interactive circle of fifths with shared key, mode, and harmony state across the full music tool system.",
  canonicalPath: "/tools/circle",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Circle of Fifths",
    description:
      "An interactive circle of fifths that shares key and mode state with harmony and Tonnetz tools.",
    canonicalPath: "/tools/circle",
    educationalUse: ["music theory", "key relationships", "harmony practice"],
  }),
};

