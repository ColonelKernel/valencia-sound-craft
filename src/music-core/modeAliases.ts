// Mode-name normalization shared across tools.
//
// The global music store speaks in canonical mode names ("Ionian",
// "Aeolian", ...), while some components default to scale-style names
// ("major", "minor"). Normalizing at the consumption boundary keeps the
// two vocabularies interchangeable.

const MODE_ALIASES: Record<string, string> = {
  major: "Ionian",
  minor: "Aeolian",
};

/**
 * Normalize a mode name to the canonical vocabulary used by the global
 * music state: "major" -> "Ionian", "minor" -> "Aeolian". Matching is
 * case-insensitive; any other value passes through unchanged.
 */
export function normalizeMode(mode: string): string {
  return MODE_ALIASES[mode.toLowerCase()] ?? mode;
}
