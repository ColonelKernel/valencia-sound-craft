import { useEffect, useMemo } from "react";

import {
  getRhythmDefinitionById,
  RHYTHM_LIBRARY,
  type RhythmBrowserRegion,
} from "@/components/Blipblox/rhythmEngineModel";
import { useDebouncedTempo } from "@/features/shared/useDebouncedTempo";
import { getMusicRhythmById } from "@/music-core/rhythmCatalog";
import {
  useGlobalMusic,
  useGlobalMusicActions,
  useGlobalTransport,
} from "@/state/globalMusicState";

export function useRhythmSelection(toolId: string) {
  const rhythmId = useGlobalMusic((state) => state.rhythmId);
  const region = useGlobalMusic((state) => state.region);
  const sharedTempo = useGlobalMusic((state) => state.tempo);
  const actions = useGlobalMusicActions();
  const transport = useGlobalTransport(toolId);
  const tempoBridge = useDebouncedTempo(sharedTempo, actions.setTempo);

  const activeDefinition = useMemo(
    () => getRhythmDefinitionById(rhythmId) || RHYTHM_LIBRARY[0],
    [rhythmId],
  );
  const canonicalRhythm = useMemo(
    () => (activeDefinition ? getMusicRhythmById(activeDefinition.id) : null),
    [activeDefinition],
  );

  useEffect(() => {
    if (!activeDefinition) {
      return;
    }

    if (activeDefinition.id !== rhythmId || activeDefinition.region !== region) {
      actions.setRhythm(activeDefinition.id, activeDefinition.region);
    }
  }, [actions, activeDefinition, region, rhythmId]);

  return {
    rhythmId: activeDefinition?.id ?? rhythmId,
    region: (activeDefinition?.region ?? region) as RhythmBrowserRegion,
    tempo: tempoBridge.tempo,
    sharedTempo,
    setTempo: tempoBridge.setTempo,
    activeDefinition,
    playing: transport.playing,
    setPlaying: transport.setPlaying,
    setRhythm: actions.setRhythm,
    setRegion: actions.setRegion,
    canonicalRhythm,
  };
}
