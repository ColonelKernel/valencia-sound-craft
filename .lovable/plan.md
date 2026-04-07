

## Blipblox Integration Engine — Implementation Plan

### Overview
Add a modular Blipblox MIDI integration that connects to MyTracks, SK2, and After Dark devices via Web MIDI (with SysEx). It translates existing rhythm presets and harmony data into device-specific sequences. Available both as a standalone tool tab and embedded in the Rhythm Engine.

### Architecture

```text
src/components/Blipblox/
├── blipbloxEngine.ts        ← Core MIDI engine (connect, clock, pattern send, SysEx)
├── rhythmTranslator.ts      ← Meter normalization, groove mapping, polyrhythm splitting
├── deviceProfiles.ts         ← Device-specific logic (MyTracks/SK2/AfterDark)
├── BlipbloxConnector.tsx     ← Main UI component
├── StepSequencer.tsx         ← Visual step grid with velocity
└── PatternMorpher.tsx        ← Morph/fuse UI between two patterns
```

### File Changes

**1. `src/components/Blipblox/blipbloxEngine.ts`** — Core engine class
- Wraps existing `webMidiOut.ts` patterns but requests SysEx access (`sysex: true`)
- Device detection with name-matching for Blipblox variants
- MIDI clock send/stop (0xF8 / 0xFC) synced to BPM
- `sendPattern()` — loops a step pattern with velocity + microtiming on a given channel
- `sendSysex()` — raw SysEx passthrough for preset switching / .syx loading
- `sendCC()` — for After Dark modulation triggers
- Internal scheduler using `AudioContext` timing (not `setInterval`) for sub-ms accuracy

**2. `src/components/Blipblox/deviceProfiles.ts`** — Device-specific translators
- `MyTracksProfile`: Converts rhythm → 16/32 step note-on sequences (drum MIDI notes)
- `SK2Profile`: Maps rhythm + scale/key → melodic arpeggiated patterns; accepts chord progression injection from ChordProgressionBuilder
- `AfterDarkProfile`: Maps rhythm accents → MIDI CC messages for modulation/expression; supports evolving pattern generation

**3. `src/components/Blipblox/rhythmTranslator.ts`** — Translation layer
- `normalizeMeter()`: Converts any meter to step grid (7/8→14, 6/8→12, 12-beat→16 approx)
- `mapGroove()`: Accents→velocity (100-120 high, 30-60 ghost), subdivision→step placement, optional swing/humanize
- `splitPolyrhythm()`: Splits polyrhythmic layers into separate MIDI channels (3:2, 4:3, etc.)
- `morphPatterns()` / `fuseRhythms()`: Cross-blend two patterns

**4. `src/components/Blipblox/BlipbloxConnector.tsx`** — Main UI
- Device selector dropdown (auto-populated from Web MIDI outputs)
- Device type picker (MyTracks / SK2 / After Dark)
- MIDI channel selector (1-16)
- Connection status indicator (disconnected/connected/sending)
- BPM control (synced with global BPM from DrumMachine)
- Pattern preview (mini step sequencer view, read-only)
- "Send to Device" / "Start Loop" / "Stop" buttons
- .syx file upload for SysEx presets
- Hover info cards for selected rhythms (origin, meter, groove breakdown)

**5. `src/components/Blipblox/StepSequencer.tsx`** — Editable step grid
- 16/32 step toggle
- Click to toggle steps, drag for velocity
- Visual velocity gradient per step

**6. `src/components/Blipblox/PatternMorpher.tsx`** — Pattern blend UI
- Select two rhythms, blend slider, preview result

**7. Integrate into existing tools:**

- **`src/components/ModeVisualizer/index.tsx`**: Add `'blipblox'` to `activeTab` union; add tab entry in dropdown; render `<BlipbloxConnector />` with current `root`/`mode` passed for SK2 scale awareness
- **`src/components/DrumMachine/index.tsx`**: Add "Send to Blipblox" button in the MIDI panel that passes the current preset/tracks to BlipbloxConnector as an embedded mini-panel

### Key Technical Decisions

- **Reuse `webMidiOut.ts` patterns** but create a separate engine instance since Blipblox needs SysEx access and device-specific logic
- **AudioContext-based scheduling** (like existing DrumMachine scheduler) instead of `setInterval` for accurate timing
- **Lazy loading**: `BlipbloxConnector` dynamically imported to avoid loading MIDI code on every page visit
- **Pattern caching**: LRU cache (Map with max 20 entries) for recently translated patterns
- **No backend needed** — all MIDI communication is client-side via Web MIDI API

### Validation
- `validateGroove()` from `drumPresets.ts` reused before sending any pattern
- Additional check: ensure step count matches device's supported grid sizes

