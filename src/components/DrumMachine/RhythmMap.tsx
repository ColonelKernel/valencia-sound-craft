import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Globe, Play, X, Zap } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  DRUM_PRESETS,
  getCountryMapData,
  type PatternPreset,
  type CountryMapData,
} from "../DrumMachine/drumPresets";
import { getInstrument } from "../DrumMachine/drumSoundEngine";

interface RhythmMapProps {
  onLoadPreset?: (preset: PatternPreset) => void;
}

const regionColors: Record<string, string> = {
  'Caribbean': '#f59e0b',
  'Latin America': '#f97316',
  'Europe': '#3b82f6',
  'Africa': '#eab308',
  'Middle East': '#ef4444',
  'South Asia': '#a855f7',
  'Universal': '#6b7280',
};

const getColor = (region: string) => regionColors[region] || '#f59e0b';

// Sub-component to fit bounds
const FitBounds = ({ countries }: { countries: CountryMapData[] }) => {
  const map = useMap();
  useEffect(() => {
    if (countries.length > 0) {
      const bounds = countries.map(c => [c.lat, c.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
    }
  }, []);
  return null;
};

const RhythmMap = ({ onLoadPreset }: RhythmMapProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryMapData | null>(null);
  const [previewingPreset, setPreviewingPreset] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const countries = useMemo(() => getCountryMapData(), []);
  const presetsByCountry = useMemo(() => {
    const map: Record<string, PatternPreset[]> = {};
    DRUM_PRESETS.forEach(p => {
      if (p.countryCode === 'UN') return;
      if (!map[p.countryCode]) map[p.countryCode] = [];
      map[p.countryCode].push(p);
    });
    return map;
  }, []);

  const previewRhythm = useCallback((preset: PatternPreset) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    setPreviewingPreset(preset.name);
    const stepDuration = 60 / preset.bpm / 4;

    preset.tracks.forEach(track => {
      const inst = getInstrument(track.instrumentId);
      if (!inst) return;
      const stepsToPlay = Math.min(8, track.steps.length);
      for (let i = 0; i < stepsToPlay; i++) {
        const vel = track.steps[i];
        if (vel > 0) {
          inst.play(ctx, ctx.currentTime + i * stepDuration, vel * 0.7, 1, 0.3);
        }
      }
    });

    setTimeout(() => setPreviewingPreset(null), 8 * stepDuration * 1000);
  }, []);

  const countryPresets = selectedCountry ? (presetsByCountry[selectedCountry.code] || []) : [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Map
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Explore rhythmic traditions from around the world. Click a marker to explore, load into the generator.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          {Object.entries(regionColors).filter(([k]) => k !== 'Universal').map(([region, color]) => (
            <span key={region} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {region}
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border" style={{ height: 420 }}>
        <MapContainer
          center={[20, 10]}
          zoom={2}
          minZoom={2}
          maxZoom={8}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: 'hsl(var(--secondary))' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds countries={countries} />
          {countries.map(country => {
            const isSelected = selectedCountry?.code === country.code;
            const radius = Math.min(14, 6 + country.rhythmCount * 2);
            const color = getColor(country.region);

            return (
              <CircleMarker
                key={country.code}
                center={[country.lat, country.lng]}
                radius={isSelected ? radius * 1.3 : radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: isSelected ? 0.9 : 0.7,
                  color: isSelected ? '#fff' : color,
                  weight: isSelected ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => setSelectedCountry(
                    selectedCountry?.code === country.code ? null : country
                  ),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 120 }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{country.name}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{country.region}</p>
                    <p style={{ fontSize: 11, color: color, margin: '4px 0 0' }}>
                      {country.rhythmCount} rhythm{country.rhythmCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Country Panel */}
      {selectedCountry && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: getColor(selectedCountry.region) }} />
                {selectedCountry.name}
              </h4>
              <p className="text-[10px] text-muted-foreground">{selectedCountry.region} · {countryPresets.length} rhythms</p>
            </div>
            <button
              onClick={() => setSelectedCountry(null)}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-1.5">
            {countryPresets.map(preset => (
              <div
                key={preset.name}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{preset.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {preset.timeSignature[0]}/{preset.timeSignature[1]}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      preset.complexity === 'beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                      preset.complexity === 'intermediate' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>{preset.complexity}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{preset.bpm} BPM · {preset.timeFeel}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => previewRhythm(preset)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      previewingPreset === preset.name
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Play size={9} />
                    {previewingPreset === preset.name ? '…' : '▸'}
                  </button>
                  {onLoadPreset && (
                    <button
                      onClick={() => onLoadPreset(preset)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Zap size={9} /> Load
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border">
        <span>{countries.length} countries</span>
        <span>{DRUM_PRESETS.filter(p => p.countryCode !== 'UN').length} rhythms</span>
        <span>{new Set(DRUM_PRESETS.map(p => p.region)).size} regions</span>
        <span className="ml-auto text-muted-foreground/50">Data expanding · Contributions welcome</span>
      </div>
    </div>
  );
};

export default RhythmMap;
