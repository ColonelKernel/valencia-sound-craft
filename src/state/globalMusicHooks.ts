import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import type { GlobalMusicState, GlobalMusicStore } from "./globalMusicState";

/**
 * Context and hooks for the shared music store.
 *
 * These live apart from globalMusicState.tsx so that module can export only
 * the GlobalMusicProvider component — a module mixing a component with plain
 * hooks defeats React Fast Refresh. The type import above is erased at build
 * time, so there is no runtime cycle between the two modules.
 */

export const GlobalMusicContext = createContext<GlobalMusicStore | null>(null);

function useGlobalMusicStore() {
  const store = useContext(GlobalMusicContext);

  if (!store) {
    throw new Error("GlobalMusicProvider is missing from the tree.");
  }

  return store;
}

export function useGlobalMusic<T>(selector: (state: GlobalMusicState) => T) {
  const store = useGlobalMusicStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));
}

export function useGlobalMusicActions() {
  const store = useGlobalMusicStore();

  return useMemo(
    () => ({
      setKey: store.setKey,
      setMode: store.setMode,
      setTempo: store.setTempo,
      suggestTempo: store.suggestTempo,
      setRhythm: store.setRhythm,
      setRegion: store.setRegion,
      setChordProgression: store.setChordProgression,
      setPlaying: store.setPlaying,
      resetTransport: store.resetTransport,
      requestTransport: store.requestTransport,
      releaseTransport: store.releaseTransport,
    }),
    [store],
  );
}

export function useGlobalTransport(owner: string) {
  const store = useGlobalMusicStore();
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const isPlaying = snapshot.state.playing && snapshot.activeTransportId === owner;

  const setPlaying = useCallback(
    (nextPlaying: boolean) => {
      if (nextPlaying) {
        store.requestTransport(owner);
        return;
      }

      store.releaseTransport(owner);
    },
    [owner, store],
  );

  return {
    playing: isPlaying,
    activeTransportId: snapshot.activeTransportId,
    setPlaying,
  };
}
