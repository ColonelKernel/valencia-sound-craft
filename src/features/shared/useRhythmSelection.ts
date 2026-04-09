import { useEffect, useMemo, useRef } from "react";

import {
  getRhythmDefinitionById,
  RHYTHM_LIBRARY,
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
  const syncedRef = useRef(false);

  const activeDefinition = useMemo(
    () => getRhythmDefinitionById(rhythmId) || RHYTHM_LIBRARY[0],
    [rhythmId],
  );
  const canonicalRhythm = useMemo(
    () => (activeDefinition ? getMusicRhythmById(activeDefinition.id) : null),
    [activeDefinition],
  );

  // Sync global state only once on mount when the stored rhythmId doesn't
  // resolve to a valid definition (fallback case).
  useEffect(() => {
    if (syncedRef.current || !activeDefinition) {
      return;
    }

    if (activeDefinition.id !== rhythmId) {
      actions.setRhythm(activeDefinition.id, activeDefinition.region);
    }
    syncedRef.current = true;
  }, [actions, activeDefinition, region, rhythmId]);

  return {
    rhythmId: activeDefinition?.id ?? rhythmId,
    region: activeDefinition?.region ?? region,
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
