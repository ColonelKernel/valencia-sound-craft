import { useRef, type ReactNode } from "react";

import { GlobalMusicContext } from "./globalMusicHooks";
import type { ProgressionChord } from "@/components/ModeVisualizer/chordProgressionUtils";
import {
  cloneProgression,
  equalProgressions,
} from "@/features/shared/chordProgressionModel";
import { normalizeMode } from "@/music-core/modeAliases";

export interface GlobalMusicState {
  key: string;
  mode: string;
  tempo: number;
  /**
   * True once the user has explicitly set a tempo this session. Rhythm
   * selection may only *suggest* a tempo (via suggestTempo) — a suggestion
   * is ignored once the user has touched tempo anywhere.
   */
  tempoTouched: boolean;
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

export type GlobalMusicStore = ReturnType<typeof createGlobalMusicStore>;

const DEFAULT_STATE: GlobalMusicState = {
  key: "C",
  mode: "Ionian",
  tempo: 110,
  tempoTouched: false,
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
      snapshot.state.tempoTouched === nextSnapshot.state.tempoTouched &&
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
      // The store holds canonical mode names; normalize every entry point
      // ("major" → "Ionian", etc.) so tools never compare aliases.
      const canonical = normalizeMode(mode);
      updateState((current) => (current.mode === canonical ? current : { ...current, mode: canonical }));
    },
    setTempo(tempo: number) {
      updateState((current) =>
        current.tempo === tempo && current.tempoTouched
          ? current
          : { ...current, tempo, tempoTouched: true },
      );
    },
    suggestTempo(tempo: number) {
      updateState((current) =>
        current.tempoTouched || current.tempo === tempo ? current : { ...current, tempo },
      );
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

