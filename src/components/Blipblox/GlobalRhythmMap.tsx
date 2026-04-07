import { useEffect, useMemo, useState } from "react";
import { Globe2, MapPinned, MousePointerClick } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { cn } from "@/lib/utils";

import {
  GLOBAL_RHYTHM_ATLAS,
  type Rhythm,
  type RhythmContinent,
} from "./globalRhythmAtlas";

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

type PositionedRhythm = Rhythm & RegionAnchor;

const CONTINENT_ANCHORS: Record<RhythmContinent, RegionAnchor> = {
  "North America": { lat: 38, lng: -100 },
  "South America": { lat: -16, lng: -62 },
  Europe: { lat: 50, lng: 15 },
  Africa: { lat: 7, lng: 20 },
  Asia: { lat: 31, lng: 85 },
  Oceania: { lat: -16, lng: 150 },
};

const REGION_ANCHORS: Record<string, RegionAnchor> = {
  Anatolia: { lat: 39, lng: 35 },
  Andes: { lat: -13, lng: -73 },
  "Arabian Peninsula": { lat: 22, lng: 45 },
  "Australia and New Zealand": { lat: -28, lng: 145 },
  Balkans: { lat: 42, lng: 22 },
  Caribbean: { lat: 20, lng: -74 },
  Caucasus: { lat: 42, lng: 44 },
  "Central Africa": { lat: 1, lng: 20 },
  "Central America": { lat: 14, lng: -90 },
  "Central Asia": { lat: 43, lng: 68 },
  "Central Europe": { lat: 48, lng: 14 },
  "East Africa": { lat: 2, lng: 37 },
  "East Asia": { lat: 35, lng: 104 },
  "Eastern Europe": { lat: 49, lng: 31 },
  "Eastern Mediterranean": { lat: 35, lng: 35 },
  Guianas: { lat: 5, lng: -58 },
  "Indian Ocean": { lat: -19, lng: 57 },
  Melanesia: { lat: -8, lng: 158 },
  Micronesia: { lat: 7, lng: 154 },
  "Middle East": { lat: 31, lng: 45 },
  "North Africa": { lat: 27, lng: 10 },
  "North America": { lat: 44, lng: -103 },
  "Northern Europe": { lat: 59, lng: 15 },
  "Northern South America": { lat: 7, lng: -66 },
  Polynesia: { lat: -17, lng: -150 },
  "South America": { lat: -18, lng: -60 },
  "South Asia": { lat: 21, lng: 78 },
  "Southeast Asia": { lat: 12, lng: 105 },
  "Southern Africa": { lat: -24, lng: 26 },
  "Southern Cone": { lat: -33, lng: -64 },
  "Southern Europe": { lat: 41, lng: 14 },
  "West Africa": { lat: 9, lng: -7 },
  "West Asia": { lat: 37, lng: 58 },
  "Western Europe": { lat: 47, lng: 2 },
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

const CONTINENT_SPACING: Record<RhythmContinent, { lat: number; lng: number }> = {
  "North America": { lat: 3.1, lng: 4.5 },
  "South America": { lat: 3.1, lng: 4.3 },
  Europe: { lat: 2.0, lng: 3.2 },
  Africa: { lat: 2.8, lng: 4.0 },
  Asia: { lat: 2.6, lng: 4.2 },
  Oceania: { lat: 3.2, lng: 4.8 },
};

const MARKER_RADIUS: Record<Rhythm["classification"], number> = {
  documented: 5.6,
  regional: 5,
  proxy: 4.5,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeLongitude(value: number) {
  if (value > 180) {
    return value - 360;
  }

  if (value < -180) {
    return value + 360;
  }

  return value;
}

function buildAtlasPositionMap() {
  const groupedByRegion = GLOBAL_RHYTHM_ATLAS.reduce<Record<string, Rhythm[]>>((accumulator, rhythm) => {
    if (!accumulator[rhythm.region]) {
      accumulator[rhythm.region] = [];
    }

    accumulator[rhythm.region].push(rhythm);
    return accumulator;
  }, {});

  return Object.fromEntries(
    Object.entries(groupedByRegion).flatMap(([region, regionRhythms]) => {
      const sortedRhythms = [...regionRhythms].sort((left, right) => left.country.localeCompare(right.country));
      const baseAnchor =
        REGION_ANCHORS[region] ?? CONTINENT_ANCHORS[sortedRhythms[0]?.continent as RhythmContinent];
      const spacing = CONTINENT_SPACING[sortedRhythms[0]?.continent as RhythmContinent];
      const columns = Math.max(1, Math.ceil(Math.sqrt(sortedRhythms.length)));
      const rows = Math.ceil(sortedRhythms.length / columns);

      return sortedRhythms.map((rhythm, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const lngOffset = (column - (columns - 1) / 2) * spacing.lng + (row % 2 === 0 ? 0 : spacing.lng * 0.2);
        const latOffset = (row - (rows - 1) / 2) * spacing.lat;

        return [
          rhythm.country,
          {
            lat: clamp(baseAnchor.lat - latOffset, -55, 72),
            lng: normalizeLongitude(baseAnchor.lng + lngOffset),
          },
        ];
      });
    }),
  ) as Record<string, RegionAnchor>;
}

const ATLAS_POSITION_MAP = buildAtlasPositionMap();

function getPreviewRhythm(hovered: Rhythm | null, selectedCountry: string | undefined, rhythms: Rhythm[]) {
  if (hovered) {
    return hovered;
  }

  if (!selectedCountry) {
    return rhythms[0] || null;
  }

  return rhythms.find((rhythm) => rhythm.country === selectedCountry) || null;
}

const FocusSelectedCountry = ({ rhythm }: { rhythm: PositionedRhythm | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!rhythm) {
      return;
    }

    map.flyTo([rhythm.lat, rhythm.lng], Math.max(map.getZoom(), rhythm.continent === "Oceania" ? 3 : 4), {
      duration: 0.6,
    });
  }, [map, rhythm]);

  return null;
};

const GlobalRhythmMap = ({
  rhythms,
  selectedCountry,
  onCountryHover,
  onCountrySelect,
}: GlobalRhythmMapProps) => {
  const [hoveredRhythm, setHoveredRhythm] = useState<Rhythm | null>(null);

  const positionedRhythms = useMemo(() => {
    return rhythms
      .map((rhythm) => ({
        ...rhythm,
        ...(ATLAS_POSITION_MAP[rhythm.country] ?? CONTINENT_ANCHORS[rhythm.continent]),
      }))
      .sort((left, right) => left.country.localeCompare(right.country));
  }, [rhythms]);
  const selectedRhythm = useMemo(
    () => positionedRhythms.find((rhythm) => rhythm.country === selectedCountry) || null,
    [positionedRhythms, selectedCountry],
  );

  const previewRhythm = getPreviewRhythm(hoveredRhythm, selectedCountry, positionedRhythms);

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
            {positionedRhythms.length} visible countries
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
          <FocusSelectedCountry rhythm={selectedRhythm} />
          {positionedRhythms.map((rhythm) => {
            const isSelected = selectedCountry === rhythm.country;

            return (
              <CircleMarker
                key={rhythm.country}
                center={[rhythm.lat, rhythm.lng]}
                radius={isSelected ? 7.5 : MARKER_RADIUS[rhythm.classification]}
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
                    <p className="font-semibold text-slate-900">{rhythm.country}</p>
                    <p className="text-slate-600">{rhythm.name}</p>
                    <p className="mt-1 text-slate-500">
                      {rhythm.continent} · {rhythm.region}
                    </p>
                    <p className="text-slate-500">
                      {rhythm.meter} · {rhythm.classification} · {rhythm.confidence}
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
