
-- ═══════════════════════════════════════════════════════════
-- 1. MUSICAL SCALES & MODES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  intervals INTEGER[] NOT NULL,
  interval_names TEXT[] NOT NULL,
  chords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 2. TUNING PRESETS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.tuning_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  instrument_type TEXT NOT NULL, -- guitar, guitar7, guitar8, bass, bass5, bass6
  tuning JSONB NOT NULL, -- array of {note, octave}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 3. FRETTED INSTRUMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.fretted_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  tuning JSONB NOT NULL,
  frets INTEGER DEFAULT 22,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 4. DRUM INSTRUMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.drum_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_velocity NUMERIC NOT NULL DEFAULT 0.8,
  default_pitch NUMERIC NOT NULL DEFAULT 1,
  default_decay NUMERIC NOT NULL DEFAULT 0.3,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 5. DRUM PRESETS (RHYTHM LIBRARY)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.drum_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  bpm INTEGER NOT NULL DEFAULT 120,
  swing INTEGER NOT NULL DEFAULT 0,
  time_signature INTEGER[] NOT NULL DEFAULT '{4,4}',
  clave_pattern TEXT,
  time_feel TEXT NOT NULL DEFAULT 'straight',
  pulse_grouping INTEGER[] NOT NULL DEFAULT '{2,2,2,2}',
  tempo_range INTEGER[] NOT NULL DEFAULT '{80,160}',
  instrument_roles JSONB,
  cultural_description TEXT,
  artists TEXT[] DEFAULT '{}',
  complexity TEXT NOT NULL DEFAULT 'intermediate',
  subdivision_type TEXT,
  rhythm_type TEXT,
  konnakol BOOLEAN DEFAULT FALSE,
  tala_structure JSONB,
  tracks JSONB NOT NULL DEFAULT '[]',
  variation_tracks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 6. CHORD PROGRESSION TEMPLATES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.progression_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  degrees INTEGER[] NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- 7. HARMONIC STYLE PRESETS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  preferred_modes TEXT[] NOT NULL DEFAULT '{}',
  chord_tendencies TEXT NOT NULL DEFAULT '',
  rhythm_feel TEXT NOT NULL DEFAULT 'straight',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- RLS: All tables are PUBLIC READ (reference data)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuning_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fretted_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drum_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drum_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progression_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read scales" ON public.scales FOR SELECT USING (true);
CREATE POLICY "Public read tuning_presets" ON public.tuning_presets FOR SELECT USING (true);
CREATE POLICY "Public read fretted_instruments" ON public.fretted_instruments FOR SELECT USING (true);
CREATE POLICY "Public read drum_instruments" ON public.drum_instruments FOR SELECT USING (true);
CREATE POLICY "Public read drum_presets" ON public.drum_presets FOR SELECT USING (true);
CREATE POLICY "Public read progression_templates" ON public.progression_templates FOR SELECT USING (true);
CREATE POLICY "Public read style_presets" ON public.style_presets FOR SELECT USING (true);
