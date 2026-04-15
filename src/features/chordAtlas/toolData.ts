import { createToolStructuredData, type RouteMetaConfig } from "@/components/seo/RouteHead";

export const chordAtlasToolMeta: RouteMetaConfig = {
  title: "Chord Atlas | Valencia Sound Craft",
  description:
    "Interactive guitar chord mapping engine. Explore diatonic chords, voicings, and harmonic functions across every key and mode.",
  canonicalPath: "/tools/chord-atlas",
  jsonLd: createToolStructuredData({
    name: "Valencia Sound Craft Chord Atlas",
    description:
      "A chord mapping engine for guitar with fretboard visualization, voicing explorer, and harmonic function analysis.",
    canonicalPath: "/tools/chord-atlas",
    educationalUse: ["music theory", "guitar", "harmony", "composition"],
  }),
};
