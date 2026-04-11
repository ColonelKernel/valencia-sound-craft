import { useMemo } from "react";

import { getChordSpellings, getScaleNotes } from "@/components/ModeVisualizer/scaleData";
import { useDebouncedTempo } from "@/features/shared/useDebouncedTempo";
import {
  useGlobalMusic,
  useGlobalMusicActions,
  useGlobalTransport,
} from "@/state/globalMusicState";

export function useHarmonySelection(toolId: string) {
  const key = useGlobalMusic((state) => state.key);
  const mode = useGlobalMusic((state) => state.mode);
  const sharedTempo = useGlobalMusic((state) => state.tempo);
  const chordProgression = useGlobalMusic((state) => state.chordProgression);
  const actions = useGlobalMusicActions();
  const transport = useGlobalTransport(toolId);
  const tempoBridge = useDebouncedTempo(sharedTempo, actions.setTempo);

  const scaleNotes = useMemo(() => getScaleNotes(key, mode), [key, mode]);
  const chordSpellings = useMemo(() => getChordSpellings(scaleNotes, mode), [mode, scaleNotes]);

  return {
    key,
    mode,
    tempo: tempoBridge.tempo,
    sharedTempo,
    setTempo: tempoBridge.setTempo,
    scaleNotes,
    chordSpellings,
    chordProgression,
    playing: transport.playing,
    setPlaying: transport.setPlaying,
    setKey: actions.setKey,
    setMode: actions.setMode,
    setChordProgression: actions.setChordProgression,
  };
}

