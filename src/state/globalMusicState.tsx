import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { ProgressionChord } from "@/components/ModeVisualizer/chordProgressionUtils";
import {
  cloneProgression,
  equalProgressions,
} from "@/features/shared/chordProgressionModel";

export interface GlobalMusicState {
  key: string;
  mode: string;
  tempo: number;
  rhythmId: string;
  region: string;
  chordProgression: ProgressionChord[];
  playing: boolean;
}

type Listener = () => void;

interface GlobalMusicSnapshot {
  state: GlobalMusicState;
  activeTransportId: string | null;
}

type GlobalMusicStore = ReturnType<typeof createGlobalMusicStore>;

const DEFAULT_STATE: GlobalMusicState = {
  key: "C",
  mode: "Ionian",
  tempo: 110,
  rhythmId: "flamenco_buleria",
  region: "flamenco",
  chordProgression: [],
  playing: false,
};

function createGlobalMusicStore(initialState?: Partial<GlobalMusicState>) {
  let snapshot: GlobalMusicSnapshot = {
    state: {
      ...DEFAULT_STATE,
      ...initialState,
    },
    activeTransportId: null,
  };

  const listeners = new Set<Listener>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const setSnapshot = (nextSnapshot: GlobalMusicSnapshot) => {
    const sameTransport = snapshot.activeTransportId === nextSnapshot.activeTransportId;
    const sameState =
      snapshot.state.key === nextSnapshot.state.key &&
      snapshot.state.mode === nextSnapshot.state.mode &&
      snapshot.state.tempo === nextSnapshot.state.tempo &&
      snapshot.state.rhythmId === nextSnapshot.state.rhythmId &&
      snapshot.state.region === nextSnapshot.state.region &&
      snapshot.state.playing === nextSnapshot.state.playing &&
      equalProgressions(snapshot.state.chordProgression, nextSnapshot.state.chordProgression);

    if (sameTransport && sameState) {
      return;
    }

    snapshot = nextSnapshot;
    emit();
  };

  const updateState = (updater: (currentState: GlobalMusicState) => GlobalMusicState) => {
    setSnapshot({
      ...snapshot,
      state: updater(snapshot.state),
    });
  };

  return {
    getState: () => snapshot.state,
    getSnapshot: () => snapshot,
    getActiveTransportId: () => snapshot.activeTransportId,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setKey(key: string) {
      updateState((current) => (current.key === key ? current : { ...current, key }));
    },
    setMode(mode: string) {
      updateState((current) => (current.mode === mode ? current : { ...current, mode }));
    },
    setTempo(tempo: number) {
      updateState((current) => (current.tempo === tempo ? current : { ...current, tempo }));
    },
    setRhythm(rhythmId: string, region?: string) {
      updateState((current) => {
        if (current.rhythmId === rhythmId && (!region || current.region === region)) {
          return current;
        }

        return {
          ...current,
          rhythmId,
          region: region ?? current.region,
        };
      });
    },
    setRegion(region: string) {
      updateState((current) => (current.region === region ? current : { ...current, region }));
    },
    setChordProgression(chordProgression: ProgressionChord[]) {
      updateState((current) =>
        equalProgressions(current.chordProgression, chordProgression)
          ? current
          : { ...current, chordProgression: cloneProgression(chordProgression) },
      );
    },
    setPlaying(playing: boolean) {
      setSnapshot({
        ...snapshot,
        state: snapshot.state.playing === playing ? snapshot.state : { ...snapshot.state, playing },
        activeTransportId: playing ? snapshot.activeTransportId : null,
      });
    },
    requestTransport(owner: string) {
      performance.mark(`${owner}:transport:start`);
      setSnapshot({
        state: {
          ...snapshot.state,
          playing: true,
        },
        activeTransportId: owner,
      });
      performance.mark(`${owner}:transport:committed`);
      performance.measure(
        `${owner}:transport:start-latency`,
        `${owner}:transport:start`,
        `${owner}:transport:committed`,
      );
    },
    releaseTransport(owner?: string) {
      const shouldRelease = !owner || snapshot.activeTransportId === owner;

      if (!shouldRelease) {
        return;
      }

      setSnapshot({
        state: {
          ...snapshot.state,
          playing: false,
        },
        activeTransportId: null,
      });
    },
    resetTransport() {
      setSnapshot({
        state: {
          ...snapshot.state,
          playing: false,
        },
        activeTransportId: null,
      });
    },
  };
}

const GlobalMusicContext = createContext<GlobalMusicStore | null>(null);

export function GlobalMusicProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<GlobalMusicState>;
}) {
  const storeRef = useRef<GlobalMusicStore>();

  if (!storeRef.current) {
    storeRef.current = createGlobalMusicStore(initialState);
  }

  return (
    <GlobalMusicContext.Provider value={storeRef.current}>
      {children}
    </GlobalMusicContext.Provider>
  );
}

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
