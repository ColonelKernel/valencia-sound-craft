

## Blipblox Global Rhythm Engine — Advanced Enhancement Plan

### What We're Adding

1. **Ableton Link sync indicator + external clock fallback** (UI-only — true Link requires native bridge, so we implement MIDI clock sync with Link-style UX)
2. **Enhanced Adaptive Mode** with micro-timing shifts and region-aware variation constraints
3. **Improved regional generators** with more authentic subdivision logic
4. **UI polish**: Link status indicator, sync source toggle, validation step indicators

### Architecture

No new files needed. All changes go into existing Blipblox modules.

---

### File Changes

**1. `src/components/Blipblox/blipbloxEngine.ts`** — Sync infrastructure

- Add `SyncMode` type: `'internal' | 'midi-clock' | 'link'`
- Add `setSyncMode(mode)` — switches between internal scheduler, incoming MIDI clock, and Link placeholder
- Add `onTempoChange` callback for bidirectional BPM propagation
- Add `setExternalTempo(bpm)` for receiving tempo from MIDI clock input
- Add MIDI clock *input* listener: when `midiAccess.inputs` receives 0xF8 messages, derive BPM and sync step position
- Add `getSyncStatus()` returning `{ mode, isLocked, drift, peerCount }` for UI display
- Link mode: show "Link not available in browser" with fallback to MIDI clock; prepare the interface so a future WebSocket bridge can plug in

**2. `src/components/Blipblox/adaptiveEngine.ts`** — Smarter evolution

- Add `regionConstraints` parameter to `suggestVariation()` so variations respect the source region's rhythmic rules (e.g., never remove compás accents in Flamenco, preserve clave in Latin)
- Add `'micro-timing'` variation type: shifts velocity timing feel (laid-back/ahead) by adjusting velocity emphasis on even vs odd steps
- Add `'subdivision-swap'` variation type: replaces a beat group with a different subdivision (e.g., swap straight 4s for triplet feel within one beat)
- Add `maxVariationStrength` parameter (0-1) to control how far variations can deviate from the original
- Track loop count internally; increase variation subtlety on first 2 loops, allow more on loops 4+

**3. `src/components/Blipblox/rhythmGenerator.ts`** — Improved regional accuracy

- **African**: Add explicit 3:2 cross-rhythm using Euclidean distribution (E(3, 8) over E(2, 8)); add call-and-response layer where second half echoes first with offset
- **Balkan**: Add specific grouping presets for 5/8 (2+3), 7/8 (2+2+3 and 3+2+2), 9/8 (2+2+2+3), 11/8 (2+2+3+2+2); select based on meter input
- **Flamenco**: Differentiate Bulería (accents 3,6,8,10,12) vs Soleá (accents 3,6,8,10,12 but slower, sparser); add `subStyle` option
- **Indian**: Implement proper tala structures — Teentaal (4+4+4+4), Jhaptaal (2+3+2+3), Rupak (3+2+2); map subdivisions to syllabic density
- **Latin**: Differentiate 2-3 vs 3-2 clave; add rumba clave variant; add tumbao bass pattern layer

**4. `src/components/Blipblox/GlobalRhythmEngine.tsx`** — UI enhancements

- Add **Sync section** at top of transport bar:
  - Sync mode selector: Internal / MIDI Clock / Link
  - Status indicator: green dot = locked, amber = syncing, red = no sync
  - "LINK ACTIVE" / "CLOCK IN" / "INTERNAL" label
  - Tempo source label (shows "External: 120 BPM" when receiving clock)
- Add **region sub-style selector** (e.g., Bulería vs Soleá for Flamenco)
- Add **variation strength slider** (subtle → aggressive) for Adaptive Mode
- Show **variation type badge** when adaptive mode applies a change (e.g., "Ghost Notes", "Syncopation")
- Add **9/8 and 11/8** to meter options

**5. `src/components/Blipblox/rhythmGenerator.ts`** — New meter options

- Add `[9, 8]` and `[11, 8]` to `METER_OPTIONS`
- Add `[5, 8]` for completeness

### Key Design Decisions

- **Ableton Link**: Browser JS cannot natively run Link protocol. We implement MIDI clock input sync (which works with any DAW including Ableton) and add a Link UI placeholder that shows "requires Link bridge" — the architecture is ready for a future WebSocket-to-Link bridge.
- **Region constraints in adaptive mode**: Stored as simple arrays of "protected step indices" per region, ensuring the adaptive engine never removes structurally critical hits.
- **No new dependencies**: All changes use existing Web MIDI API and AudioContext.

### Validation Points

The implementation should be verified by:
1. Opening Interactive Tools → Blipblox → confirming the sync mode selector and status indicator render
2. Generating rhythms from each region and confirming distinct character
3. Playing with Adaptive Mode on for 4+ loops and confirming subtle, musical evolution
4. Switching sync mode to MIDI Clock and confirming the UI updates accordingly

