

## Global Rhythm Engine + AI Mode — Enhancement Plan

### What We're Building

Enhance the Blipblox integration with three new capabilities:

1. **AI Rhythm Generation Engine** — rule-based generative system that creates rhythms from cultural parameters (region, density, complexity, swing)
2. **Adaptive Groove Engine** — reacts to user edits in real-time, adding ghost notes, syncopation, and variations
3. **Integrated GlobalRhythmEngine component** — unified UI combining the sequencer, generation controls, adaptive mode, region selector, and Blipblox hardware output

### Architecture

```text
src/components/Blipblox/
├── (existing files unchanged)
├── rhythmGenerator.ts       ← Rule-based rhythm generation by region
├── adaptiveEngine.ts        ← Tracks user behavior, suggests variations
├── harmonicEngine.ts        ← Maps rhythm to pitched MIDI (for SK2/After Dark)
└── GlobalRhythmEngine.tsx   ← Unified UI component
```

### File Changes

**1. `src/components/Blipblox/rhythmGenerator.ts`** — New file

Rule-based generator with region-specific logic:
- `generateRhythm(options)` — takes `{ region, meter, density (0-1), complexity (0-1), swing (0-1) }` and returns a `{ midiPattern, velocityPattern, subdivision }` 
- Region rules:
  - **African**: 3:2 polyrhythmic layering, interlocking patterns
  - **Balkan**: Asymmetric groupings (2+2+3, 3+2+2), irregular accents
  - **Flamenco**: 12-beat compas cycle, accents on 3/6/8/10/12
  - **Indian**: Subdivision logic (ta-ki-ta, ta-ka-di-mi), tala-aware
  - **Latin**: Clave-based, son/rumba structures
  - **General**: Density-weighted step placement with accent shaping
- Output is a valid pattern compatible with existing `StepPattern` type

**2. `src/components/Blipblox/adaptiveEngine.ts`** — New file

Tracks user interaction and applies intelligent variations:
- `AdaptiveEngine` class with:
  - `trackEdit(oldPattern, newPattern)` — records density/accent changes
  - `suggestVariation(pattern, velocity)` — returns modified pattern based on behavior
  - Rules: if density increases → add ghost notes; if tempo slows → increase subdivision complexity; if pattern repeated 4+ times → introduce syncopation
  - `applyVariation(pattern, type)` — type = 'ghost-notes' | 'syncopation' | 'accent-shift' | 'fill'

**3. `src/components/Blipblox/harmonicEngine.ts`** — New file

Links rhythm to pitched output for SK2/After Dark:
- `generateHarmonic(pattern, velocity, key, mode)` — maps strong beats to chord tones, weak beats to passing tones, dense patterns to arpeggiation
- Uses existing `SCALE_INTERVALS` from `deviceProfiles.ts`
- Returns `{ notes: number[], velocities: number[] }` for MIDI output

**4. `src/components/Blipblox/GlobalRhythmEngine.tsx`** — New file

Unified component that combines everything:
- **Region selector** (dropdown with all regions from drumPresets)
- **Generate button** + density/complexity/swing sliders
- **Integrated StepSequencer** (live-editable while playing)
- **Morph slider** between current pattern and a secondary/generated one
- **Adaptive Mode toggle** — when on, pattern auto-evolves after each loop
- **Country-click hook**: `loadRhythmByCountry(country)` — pulls matching presets from `DRUM_PRESETS`
- **Export section**: MIDI export button (reuses existing `generateMidiFile`), JSON export
- **Blipblox send** section — embeds connection controls when a device is available
- Wraps the existing `BlipbloxConnector` for hardware output

**5. Integration updates:**

- **`src/components/ModeVisualizer/index.tsx`**: Replace the Blipblox tab render — show `<GlobalRhythmEngine />` instead of bare `<BlipbloxConnector />`, passing `root` and `mode`
- **`src/components/DrumMachine/index.tsx`**: In the blipblox panel, render `<GlobalRhythmEngine embeddedPreset={currentPreset} />` instead of bare `<BlipbloxConnector />`

**6. `src/components/Blipblox/blipbloxEngine.ts`** — Minor update

Add `updatePattern(pattern)` method that hot-swaps the current pattern mid-loop without restarting (for live editing and adaptive mode):
```typescript
updatePattern(pattern: StepPattern) {
  this.currentPattern = pattern; // takes effect on next scheduler tick
}
```

### Key Design Decisions

- **Rule-based, not ML** — all generation runs client-side in <50ms with deterministic seeded randomness
- **Live editing** — pattern updates propagate to engine mid-loop via `updatePattern()`
- **Reuses existing infrastructure** — `DRUM_PRESETS` for country/region data, `generateMidiFile` for export, `blipbloxEngine` for playback
- **No new dependencies** needed

