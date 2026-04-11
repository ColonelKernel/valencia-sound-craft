import { useEffect, useRef } from "react";

export function useToolPerformance(toolId: string) {
  const startRef = useRef(performance.now());

  useEffect(() => {
    const startMark = `${toolId}:init:start`;
    const readyMark = `${toolId}:init:ready`;

    performance.mark(startMark, {
      startTime: startRef.current,
    });

    const frame = window.requestAnimationFrame(() => {
      performance.mark(readyMark);
      performance.measure(`${toolId}:init`, startMark, readyMark);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [toolId]);
}

