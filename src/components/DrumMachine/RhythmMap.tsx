import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Globe, Play, ChevronRight, X, Music, Users, Zap } from "lucide-react";
import {
  DRUM_PRESETS,
  getCountryMapData,
  formatPulseGrouping,
  type PatternPreset,
  type CountryMapData,
} from "../DrumMachine/drumPresets";
import { getInstrument } from "../DrumMachine/drumSoundEngine";

interface RhythmMapProps {
  onLoadPreset?: (preset: PatternPreset) => void;
}

// Simple world map outline as SVG path (simplified continents)
const WORLD_OUTLINE = `
M 8,28 Q 12,20 18,22 L 25,18 Q 30,16 35,20 L 38,22 Q 35,28 30,30 L 24,35 Q 18,38 15,35 Z
M 22,32 L 28,38 Q 32,42 28,48 L 25,52 Q 22,58 24,62 L 28,68 Q 30,74 26,78 L 22,75 Q 18,68 20,60 L 18,52 Q 20,45 22,40 Z
M 30,55 Q 38,50 42,55 L 40,65 Q 36,72 32,68 L 30,60 Z
M 42,20 L 55,18 Q 58,20 56,26 L 52,30 Q 48,34 44,36 L 40,38 Q 38,34 42,28 Z
M 44,36 Q 48,34 55,36 L 60,42 Q 62,48 58,52 L 54,56 Q 50,60 46,58 L 44,52 Q 42,46 44,40 Z
M 52,58 Q 56,56 60,58 L 62,66 Q 60,74 56,76 L 52,72 Q 50,66 52,62 Z
M 58,22 Q 65,18 72,20 L 78,24 Q 82,28 80,34 L 76,38 Q 72,42 68,44 L 62,46 Q 58,42 56,36 L 55,30 Q 56,26 58,24 Z
M 68,44 Q 74,40 80,42 L 82,48 Q 78,52 74,50 L 70,48 Z
M 78,60 Q 84,56 90,58 L 92,64 Q 90,70 86,72 L 80,70 Q 76,66 78,62 Z
`;

const RhythmMap = ({ onLoadPreset }: RhythmMapProps) => {
  const [hoveredCountry, setHoveredCountry] = useState<CountryMapData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryMapData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [previewingPreset, setPreviewingPreset] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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

  const regionColors: Record<string, string> = {
    'Caribbean': 'hsl(var(--primary))',
    'Latin America': 'hsl(30, 90%, 55%)',
    'Europe': 'hsl(220, 70%, 60%)',
    'Africa': 'hsl(45, 90%, 55%)',
    'Middle East': 'hsl(350, 70%, 55%)',
    'South Asia': 'hsl(280, 60%, 55%)',
    'Universal': 'hsl(0, 0%, 60%)',
  };

  const getColor = (region: string) => regionColors[region] || 'hsl(var(--primary))';

  const handleMouseMove = (e: React.MouseEvent, country: CountryMapData) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
    });
    setHoveredCountry(country);
  };

  // Quick preview: play first beat of first rhythm
  const previewRhythm = useCallback((preset: PatternPreset) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    setPreviewingPreset(preset.name);
    const stepDuration = 60 / preset.bpm / 4;

    // Play first 8 steps
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
    <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Global Rhythm Map
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Explore rhythmic traditions from around the world. Hover to preview, click to explore, load into the generator.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['Caribbean'] }} /> Caribbean
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['Latin America'] }} /> Latin America
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['Africa'] }} /> Africa
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['Europe'] }} /> Europe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['Middle East'] }} /> Middle East
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: regionColors['South Asia'] }} /> South Asia
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 100 85"
          className="w-full h-auto rounded-lg bg-secondary/30 border border-border"
          style={{ maxHeight: 420 }}
        >
          {/* Grid lines */}
          {[20, 40, 60, 80].map(x => (
            <line key={`vg-${x}`} x1={x} y1={0} x2={x} y2={85} stroke="hsl(var(--border))" strokeWidth="0.15" strokeDasharray="0.5,1" />
          ))}
          {[20, 40, 60].map(y => (
            <line key={`hg-${y}`} x1={0} y1={y} x2={100} y2={y} stroke="hsl(var(--border))" strokeWidth="0.15" strokeDasharray="0.5,1" />
          ))}

          {/* Simplified world outline */}
          <path d={WORLD_OUTLINE} fill="hsl(var(--muted))" fillOpacity="0.15" stroke="hsl(var(--border))" strokeWidth="0.2" />

          {/* Country markers */}
          {countries.map(country => {
            const isHovered = hoveredCountry?.code === country.code;
            const isSelected = selectedCountry?.code === country.code;
            const baseSize = Math.min(2.5, 1 + country.rhythmCount * 0.4);
            const size = isHovered || isSelected ? baseSize * 1.4 : baseSize;
            const color = getColor(country.region);

            return (
              <g key={country.code}>
                {/* Pulse ring */}
                {(isHovered || isSelected) && (
                  <circle
                    cx={country.x}
                    cy={country.y}
                    r={size + 1.5}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.2"
                    opacity="0.4"
                  >
                    <animate attributeName="r" from={size + 0.5} to={size + 3} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Marker */}
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={size}
                  fill={color}
                  fillOpacity={isHovered || isSelected ? 0.9 : 0.7}
                  stroke={isSelected ? 'hsl(var(--foreground))' : color}
                  strokeWidth={isSelected ? 0.4 : 0.2}
                  className="cursor-pointer transition-all"
                  style={{ filter: isHovered ? 'brightness(1.3)' : undefined }}
                  onMouseMove={(e) => handleMouseMove(e, country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(
                    selectedCountry?.code === country.code ? null : country
                  )}
                />
                {/* Label for larger markers */}
                {(isHovered || isSelected || country.rhythmCount >= 3) && (
                  <text
                    x={country.x}
                    y={country.y - size - 1}
                    textAnchor="middle"
                    fontSize="2"
                    fill="hsl(var(--foreground))"
                    fontWeight={isHovered || isSelected ? 'bold' : 'normal'}
                    opacity={isHovered || isSelected ? 1 : 0.6}
                    className="pointer-events-none select-none"
                  >
                    {country.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredCountry && !selectedCountry && (
          <div
            className="absolute pointer-events-none z-20 bg-card border border-border rounded-lg px-3 py-2 shadow-xl"
            style={{
              left: Math.min(tooltipPos.x, (svgRef.current?.clientWidth || 600) - 180),
              top: tooltipPos.y - 60,
              minWidth: 150,
            }}
          >
            <p className="text-xs font-bold text-foreground">{hoveredCountry.name}</p>
            <p className="text-[10px] text-muted-foreground">{hoveredCountry.region}</p>
            <p className="text-[10px] text-primary font-medium mt-1">
              {hoveredCountry.rhythmCount} rhythm{hoveredCountry.rhythmCount > 1 ? 's' : ''} available
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Click to explore →</p>
          </div>
        )}
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

          <div className="grid gap-2">
            {countryPresets.map(preset => (
              <div
                key={preset.name}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold truncate">{preset.name}</h5>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {preset.timeSignature[0]}/{preset.timeSignature[1]}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        preset.complexity === 'beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                        preset.complexity === 'intermediate' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {preset.complexity}
                      </span>
                    </div>

                    {/* Pulse grouping visual */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {preset.pulseGrouping.map((count, i) => (
                        <div key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-[8px] text-muted-foreground/50 mx-0.5">+</span>}
                          <div className="flex gap-[2px]">
                            {Array.from({ length: count }).map((_, j) => (
                              <span
                                key={j}
                                className={`w-1.5 h-1.5 rounded-full ${j === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <span className="text-[9px] text-muted-foreground ml-1.5 font-mono">
                        ({formatPulseGrouping(preset.pulseGrouping)})
                      </span>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{preset.description}</p>

                    {/* Artists */}
                    {preset.artists && preset.artists.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users size={9} className="text-muted-foreground/50 shrink-0" />
                        <p className="text-[9px] text-muted-foreground truncate">
                          {preset.artists.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => previewRhythm(preset)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-medium transition-all ${
                        previewingPreset === preset.name
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <Play size={10} />
                      {previewingPreset === preset.name ? 'Playing...' : 'Preview'}
                    </button>

                    {onLoadPreset && (
                      <button
                        onClick={() => onLoadPreset(preset)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Zap size={10} /> Open in Generator
                      </button>
                    )}
                  </div>
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
