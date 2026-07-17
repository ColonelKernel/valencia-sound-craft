import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedTempo } from "./useDebouncedTempo";

describe("useDebouncedTempo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("initializes local tempo from the shared tempo without committing", () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedTempo(120, commit));
    expect(result.current.tempo).toBe(120);
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits a local change once after the debounce delay, not before", () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedTempo(120, commit));

    act(() => result.current.setTempo(140));
    expect(result.current.tempo).toBe(140);

    act(() => vi.advanceTimersByTime(139));
    expect(commit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(140);
  });

  it("collapses rapid successive changes into a single trailing commit", () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedTempo(120, commit));

    act(() => result.current.setTempo(130));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.setTempo(150));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.setTempo(160));
    act(() => vi.advanceTimersByTime(140));

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(160);
  });

  it("syncs local tempo from a shared-tempo change without committing", () => {
    const commit = vi.fn();
    const { result, rerender } = renderHook(
      ({ shared }: { shared: number }) => useDebouncedTempo(shared, commit),
      { initialProps: { shared: 120 } },
    );

    rerender({ shared: 90 });
    expect(result.current.tempo).toBe(90);

    act(() => vi.advanceTimersByTime(200));
    expect(commit).not.toHaveBeenCalled();
  });
});
