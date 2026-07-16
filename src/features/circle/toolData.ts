import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const circleToolMeta: RouteMetaConfig = {
  title: "Circle of Fifths | Valencia Sound Craft",
  description:
    "An interactive circle of fifths for exploring key relationships, connected to the full music tool system.",
  canonicalPath: "/tools/circle",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Circle of Fifths",
    description:
      "An interactive circle of fifths that keeps key and mode in step with the harmony and Tonnetz tools.",
    canonicalPath: "/tools/circle",
    educationalUse: ["music theory", "key relationships", "harmony practice"],
  }),
};

