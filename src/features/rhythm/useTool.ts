import { useRhythmSelection } from "@/features/shared/useRhythmSelection";

export function useTool() {
  const selection = useRhythmSelection("rhythm-tool");

  return {
    ...selection,
    summaryLabel: selection.activeDefinition
      ? `${selection.activeDefinition.name} from ${selection.activeDefinition.country}`
      : "Global rhythm engine",
    canonicalSource: selection.canonicalRhythm?.source || selection.activeDefinition?.sources[0]?.detail || "",
  };
}
