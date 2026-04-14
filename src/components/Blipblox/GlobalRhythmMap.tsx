import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Globe2, MapPinned, MousePointerClick, Volume2 } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { cn } from "@/lib/utils";

import { ATLAS_COUNTRY_CENTROIDS } from "./atlasCountryCentroids";
import { type Rhythm, type RhythmContinent, getPlaybackVelocityPattern } from "./globalRhythmAtlas";

interface GlobalRhythmMapProps {
  rhythms: Rhythm[];
  selectedCountry?: string;
  onCountrySelect?: (rhythm: Rhythm) => void;
  onCountryHover?: (rhythm: Rhythm | null) => void;
}

type RegionAnchor = {
  lat: number;
  lng: number;
};

type CountryRhythmMarker = RegionAnchor & {
  country: string;
  continent: RhythmContinent;
  rhythmCount: number;
  rhythm: Rhythm;
};

const CONTINENT_ANCHORS: Record<RhythmContinent, RegionAnchor> = {
  "North America": { lat: 38, lng: -100 },
  "South America": { lat: -16, lng: -62 },
  Europe: { lat: 50, lng: 15 },
  Africa: { lat: 7, lng: 20 },
  Asia: { lat: 31, lng: 85 },
  Oceania: { lat: -16, lng: 150 },
};

const CONTINENT_FILL_COLORS: Record<RhythmContinent, string> = {
  "North America": "#22d3ee",
  "South America": "#84cc16",
  Europe: "#8b5cf6",
  Africa: "#f59e0b",
  Asia: "#fb7185",
  Oceania: "#14b8a6",
};

const CONTINENT_PANEL_COLORS: Record<RhythmContinent, string> = {
  "North America": "bg-cyan-500/10 text-cyan-100 border-cyan-500/30",
  "South America": "bg-lime-500/10 text-lime-100 border-lime-500/30",
  Europe: "bg-violet-500/10 text-violet-100 border-violet-500/30",
  Africa: "bg-amber-500/10 text-amber-100 border-amber-500/30",
  Asia: "bg-rose-500/10 text-rose-100 border-rose-500/30",
  Oceania: "bg-teal-500/10 text-teal-100 border-teal-500/30",
};

const CLASSIFICATION_BORDER_COLORS: Record<Rhythm["classification"], string> = {
  documented: "#34d399",
  regional: "#fbbf24",
  proxy: "#94a3b8",
};

const CLASSIFICATION_BADGES: Record<Rhythm["classification"], string> = {
  documented: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  regional: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  proxy: "border-slate-500/40 bg-slate-500/10 text-slate-100",
};

const CLASSIFICATION_PRIORITY: Record<Rhythm["classification"], number> = {
  documented: 0,
  regional: 1,
  proxy: 2,
};

const CONFIDENCE_PRIORITY: Record<Rhythm["confidence"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getPreviewRhythm(hovered: Rhythm | null, selectedCountry: string | undefined, rhythms: Rhythm[]) {
  if (hovered) {
    return hovered;
  }

  if (!selectedCountry) {
    return rhythms[0] || null;
  }

  return rhythms.find((rhythm) => rhythm.country === selectedCountry) || null;
}

function getRepresentativeRhythm(rhythms: Rhythm[]) {
  return [...rhythms].sort((left, right) => {
    const classificationDelta =
      CLASSIFICATION_PRIORITY[left.classification] - CLASSIFICATION_PRIORITY[right.classification];

    if (classificationDelta !== 0) {
      return classificationDelta;
    }

    const confidenceDelta = CONFIDENCE_PRIORITY[left.confidence] - CONFIDENCE_PRIORITY[right.confidence];

    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.name.localeCompare(right.name);
  })[0];
}

function getMarkerRadius(rhythmCount: number, maxRhythmCount: number, isSelected: boolean) {
  const minRadius = 5;
  const maxRadius = 12;
  const scaledCount = Math.sqrt(Math.max(1, rhythmCount));
  const scaledMax = Math.sqrt(Math.max(1, maxRhythmCount));
  const normalized = scaledMax === 1 ? 0.5 : (scaledCount - 1) / (scaledMax - 1);
  const baseRadius = minRadius + normalized * (maxRadius - minRadius);

  return isSelected ? baseRadius + 1.5 : baseRadius;
}

const FocusSelectedCountry = ({ marker }: { marker: CountryRhythmMarker | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!marker) {
      return;
    }

    map.flyTo([marker.lat, marker.lng], Math.max(map.getZoom(), marker.continent === "Oceania" ? 3 : 4), {
      duration: 0.6,
    });
  }, [map, marker]);

  return null;
};

const TIMBRE_FREQS: Record<string, { freq: number; type: OscillatorType }> = {
  djembe: { freq: 180, type: "triangle" },
  "conga/clave": { freq: 800, type: "square" },
  surdo: { freq: 100, type: "sine" },
  "cajón": { freq: 220, type: "triangle" },
  tupan: { freq: 140, type: "sine" },
  tabla: { freq: 260, type: "triangle" },
  darbuka: { freq: 340, type: "triangle" },
  taiko: { freq: 90, type: "sine" },
  "log drum": { freq: 400, type: "square" },
  "neutral kit": { freq: 150, type: "sine" },
};

function useRhythmPreview() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdsRef = useRef<number[]>([]);

  const stopPreview = useCallback(() => {
    timerIdsRef.current.forEach((id) => clearTimeout(id));
    timerIdsRef.current = [];
  }, []);

  const playPreview = useCallback((rhythm: Rhythm) => {
    stopPreview();

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const velocity = getPlaybackVelocityPattern(rhythm);
    const bpm = (rhythm.bpmRange[0] + rhythm.bpmRange[1]) / 2;
    const stepDuration = (60 / bpm / 4); // 16th notes
    const timbre = TIMBRE_FREQS[rhythm.timbreProfile] || TIMBRE_FREQS["neutral kit"];
    const stepsToPlay = Math.min(rhythm.midiPattern.length, 16);

    for (let i = 0; i < stepsToPlay; i++) {
      if (!rhythm.midiPattern[i]) continue;

      const timerId = window.setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const vol = Math.max(0.05, (velocity[i] / 127) * 0.25);

        osc.type = timbre.type;
        osc.frequency.setValueAtTime(timbre.freq * (rhythm.accents[i] ? 1.2 : 1), now);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }, i * stepDuration * 1000);

      timerIdsRef.current.push(timerId);
    }
  }, [stopPreview]);

  useEffect(() => {
    return () => stopPreview();
  }, [stopPreview]);

  return { playPreview, stopPreview };
}

const GlobalRhythmMap = ({
  rhythms,
  selectedCountry,
  onCountryHover,
  onCountrySelect,
}: GlobalRhythmMapProps) => {
  const [hoveredRhythm, setHoveredRhythm] = useState<Rhythm | null>(null);
  const { playPreview, stopPreview } = useRhythmPreview();

  const countryMarkers = useMemo(() => {
    const rhythmsByCountry = rhythms.reduce<Map<string, Rhythm[]>>((countryMap, rhythm) => {
      const countryRhythms = countryMap.get(rhythm.country);

      if (countryRhythms) {
        countryRhythms.push(rhythm);
      } else {
        countryMap.set(rhythm.country, [rhythm]);
      }

      return countryMap;
    }, new Map());

    return [...rhythmsByCountry.entries()]
      .map(([country, countryRhythms]) => {
        const representativeRhythm = getRepresentativeRhythm(countryRhythms);
        const { continent } = representativeRhythm;
        const anchor = ATLAS_COUNTRY_CENTROIDS[country] ?? CONTINENT_ANCHORS[continent];

        return {
          country,
          continent,
          lat: anchor.lat,
          lng: anchor.lng,
          rhythmCount: countryRhythms.length,
          rhythm: representativeRhythm,
        };
      })
      .sort((left, right) => left.country.localeCompare(right.country));
  }, [rhythms]);
  const representativeRhythms = useMemo(
    () => countryMarkers.map((marker) => marker.rhythm),
    [countryMarkers],
  );
  const selectedMarker = useMemo(
    () => countryMarkers.find((marker) => marker.country === selectedCountry) || null,
    [countryMarkers, selectedCountry],
  );
  const previewRhythm = getPreviewRhythm(hoveredRhythm, selectedCountry, representativeRhythms);
  const previewMarker = useMemo(
    () => countryMarkers.find((marker) => marker.country === previewRhythm?.country) || null,
    [countryMarkers, previewRhythm],
  );
  const maxRhythmCount = useMemo(
    () => countryMarkers.reduce((maxCount, marker) => Math.max(maxCount, marker.rhythmCount), 1),
    [countryMarkers],
  );


  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Globe2 className="w-4 h-4 text-primary" />
            Rhythm Atlas Map
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-2xl">
            Click any marker to load that country's atlas rhythm directly into the sequencer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 text-muted-foreground">
            <MousePointerClick className="w-3 h-3" />
            {countryMarkers.length} visible countries
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 text-muted-foreground">
            Marker size = rhythm count
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-100">
            Documented
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-100">
            Regional
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/40 bg-slate-500/10 px-2 py-1 text-slate-100">
            Proxy
          </span>
        </div>
      </div>

      {previewRhythm && (
        <div className="rounded-xl border border-border bg-secondary/20 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{previewRhythm.country}</span>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px]",
                  CONTINENT_PANEL_COLORS[previewRhythm.continent],
                )}>
                  {previewRhythm.continent} · {previewRhythm.region}
                </span>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px]",
                  CLASSIFICATION_BADGES[previewRhythm.classification],
                )}>
                  {previewRhythm.classification}
                </span>
                {previewMarker && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {previewMarker.rhythmCount} rhythm{previewMarker.rhythmCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {previewRhythm.meter}
                </span>
              </div>
              <p className="text-[11px] text-foreground mt-1">
                {previewRhythm.name} · {previewRhythm.tradition}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {previewRhythm.confidence} confidence · {previewRhythm.timbreProfile} · {previewRhythm.instruments.join(" · ")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-[10px] text-muted-foreground max-w-xs">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <MapPinned className="w-3.5 h-3.5 text-primary" />
                Source
              </div>
              <div className="mt-1">{previewRhythm.source.title}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[18, 10]}
          zoom={2}
          minZoom={2}
          maxZoom={6}
          scrollWheelZoom={true}
          worldCopyJump={true}
          style={{ height: 430, width: "100%", background: "hsl(var(--secondary))" }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <FocusSelectedCountry marker={selectedMarker} />
          {countryMarkers.map((marker) => {
            const { rhythm } = marker;
            const isSelected = selectedCountry === marker.country;

            return (
              <CircleMarker
                key={marker.country}
                center={[marker.lat, marker.lng]}
                radius={getMarkerRadius(marker.rhythmCount, maxRhythmCount, isSelected)}
                pathOptions={{
                  fillColor: CONTINENT_FILL_COLORS[rhythm.continent],
                  fillOpacity: isSelected ? 0.96 : 0.82,
                  color: isSelected ? "#f8fafc" : CLASSIFICATION_BORDER_COLORS[rhythm.classification],
                  weight: isSelected ? 2.8 : 1.4,
                }}
                eventHandlers={{
                  click: () => onCountrySelect?.(rhythm),
                  mouseover: () => {
                    setHoveredRhythm(rhythm);
                    onCountryHover?.(rhythm);
                  },
                  mouseout: () => {
                    setHoveredRhythm(null);
                    onCountryHover?.(null);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[180px] text-[11px]">
                    <p className="font-semibold text-slate-900">{marker.country}</p>
                    <p className="text-slate-600">{rhythm.name}</p>
                    <p className="mt-1 text-slate-500">
                      {rhythm.continent} · {rhythm.region}
                    </p>
                    <p className="text-slate-500">
                      {rhythm.meter} · {rhythm.classification} · {rhythm.confidence}
                    </p>
                    <p className="text-slate-500">
                      {marker.rhythmCount} rhythm{marker.rhythmCount === 1 ? "" : "s"} in dataset
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {(["North America", "South America", "Europe", "Africa", "Asia", "Oceania"] as RhythmContinent[]).map(
          (continent) => (
            <span
              key={continent}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1",
                CONTINENT_PANEL_COLORS[continent],
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CONTINENT_FILL_COLORS[continent] }}
              />
              {continent}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

export default GlobalRhythmMap;
