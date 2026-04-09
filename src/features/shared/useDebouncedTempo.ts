import { useEffect, useState } from "react";

export function useDebouncedTempo(
  sharedTempo: number,
  onTempoCommit: (tempo: number) => void,
  delay = 140,
) {
  const [tempo, setTempo] = useState(sharedTempo);

  useEffect(() => {
    setTempo(sharedTempo);
  }, [sharedTempo]);

  useEffect(() => {
    if (tempo === sharedTempo) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onTempoCommit(tempo);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, onTempoCommit, sharedTempo, tempo]);

  return {
    tempo,
    setTempo,
  };
}

