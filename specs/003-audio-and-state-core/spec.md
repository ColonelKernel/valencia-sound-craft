# Spec 003 — Audio & state core consolidation

## Goal

One audio engine, one clock, one source of truth. Every tool reads and writes
the global music store; no leaf component keeps a shadow copy of shared state.

## Requirements

1. **Single AudioContext**: exactly one `new AudioContext(...)` site in `src/`
   — a lazily-created service in `src/music-core/` that resumes on user
   gesture. Every tool and utility obtains the context (and a shared
   scheduler/clock) from this service. `activeTransportId` semantics are
   preserved: one transport owner at a time; stopping a tool releases it.
2. **Fully controlled tools**: collapse remaining local shadows of shared
   state onto the store. Known offenders: `GlobalRhythmEngine`
   (`previousControlled*Ref` / `skipInitial*CallbackRef` scaffolding and its
   ~25 `useState`s), `Tonnetz`, `Metronome`, `ModeVisualizer` locals. Leaf
   components receive value + onChange; the store is the only owner of
   key/mode/tempo/rhythmId/region/chordProgression/playing.
3. **Canonical mode names** in the store; `normalizeMode` (see
   `src/music-core/modeAliases.ts`) applied at every external boundary
   (rhythm data, URL/query params, presets, embedded widgets).
4. **Tempo policy**: selecting a rhythm sets a suggested tempo ONLY if the
   user has not manually adjusted tempo this session. Promote the existing
   `userTempoTouchedRef` approach into a store-level flag so all tools honor
   it.

## Acceptance criteria

- [ ] `grep -rn "new AudioContext\|webkitAudioContext" src` matches exactly
      one implementation file.
- [ ] No `previousControlled*` / `skipInitial*` refs remain; changed files
      listed in `ralph_history.md`.
- [ ] e2e shared-state suite covers and passes: circle→harmony key/mode sync;
      circle→tonnetz sync; map rhythm selection→rhythm engine; metronome tempo
      persists across navigation; rhythm selection does NOT clobber a
      user-set tempo (and DOES set tempo when untouched); zero console
      messages during all interactions.
- [ ] Playback still works: with the dev server or preview, start the
      metronome and one tool's playback and verify the shared context reaches
      `state === "running"` with nodes scheduled (headless-verifiable), and
      note the check in `ralph_history.md`.
- [ ] All gates green; tails in `specs/003-audio-and-state-core/gate-logs/`.

**Output when complete:** `<promise>DONE</promise>`
