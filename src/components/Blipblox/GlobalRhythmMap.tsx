import { useMemo, useState } from "react";
import { Globe2, MapPinned, MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Rhythm, RhythmContinent } from "./globalRhythmAtlas";

interface GlobalRhythmMapProps {
  rhythms: Rhythm[];
  selectedCountry?: string;
  onCountrySelect?: (rhythm: Rhythm) => void;
  onCountryHover?: (rhythm: Rhythm | null) => void;
}

const CONTINENT_ORDER: RhythmContinent[] = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
];

const CLASSIFICATION_STYLES: Record<Rhythm["classification"], string> = {
  documented: "border-emerald-500/50 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
  regional: "border-amber-500/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20",
  proxy: "border-slate-500/50 bg-slate-500/10 text-slate-100 hover:bg-slate-500/20",
};

const CONTINENT_COLORS: Record<RhythmContinent, string> = {
  "North America": "from-cyan-500/20 to-sky-500/10",
  "South America": "from-lime-500/20 to-emerald-500/10",
  Europe: "from-violet-500/20 to-indigo-500/10",
  Africa: "from-amber-500/20 to-orange-500/10",
  Asia: "from-rose-500/20 to-fuchsia-500/10",
  Oceania: "from-teal-500/20 to-cyan-500/10",
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

const GlobalRhythmMap = ({
  rhythms,
  selectedCountry,
  onCountryHover,
  onCountrySelect,
}: GlobalRhythmMapProps) => {
  const [hoveredRhythm, setHoveredRhythm] = useState<Rhythm | null>(null);

  const groupedRhythms = useMemo(() => {
    return CONTINENT_ORDER.map((continent) => ({
      continent,
      rhythms: rhythms
        .filter((rhythm) => rhythm.continent === continent)
        .sort((left, right) => left.country.localeCompare(right.country)),
    }));
  }, [rhythms]);

  const previewRhythm = getPreviewRhythm(hoveredRhythm, selectedCountry, rhythms);

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Globe2 className="w-4 h-4 text-primary" />
            Global Rhythm Map
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-2xl">
            Hover a country for a rhythm preview, then click to load its atlas entry into the sequencer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
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
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {previewRhythm.continent} · {previewRhythm.region}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {previewRhythm.meter}
                </span>
              </div>
              <p className="text-[11px] text-foreground mt-1">
                {previewRhythm.name} · {previewRhythm.tradition}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {previewRhythm.classification} · {previewRhythm.confidence} confidence · {previewRhythm.timbreProfile}
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

      <div className="grid gap-3 xl:grid-cols-3 md:grid-cols-2">
        {groupedRhythms.map(({ continent, rhythms: continentRhythms }) => (
          <section
            key={continent}
            className={cn(
              "rounded-xl border border-border bg-gradient-to-br p-3",
              CONTINENT_COLORS[continent],
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h5 className="text-sm font-semibold text-foreground">{continent}</h5>
                <p className="text-[10px] text-muted-foreground">{continentRhythms.length} countries</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 px-2 py-1 text-[10px] text-muted-foreground">
                <MousePointerClick className="w-3 h-3" />
                Load
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {continentRhythms.map((rhythm) => {
                const isSelected = selectedCountry === rhythm.country;

                return (
                  <button
                    key={rhythm.country}
                    type="button"
                    onMouseEnter={() => {
                      setHoveredRhythm(rhythm);
                      onCountryHover?.(rhythm);
                    }}
                    onMouseLeave={() => {
                      setHoveredRhythm(null);
                      onCountryHover?.(null);
                    }}
                    onClick={() => onCountrySelect?.(rhythm)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left text-[10px] transition-all",
                      CLASSIFICATION_STYLES[rhythm.classification],
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-[1.02]",
                    )}
                    title={`${rhythm.country} · ${rhythm.name} · ${rhythm.meter}`}
                  >
                    <span className="font-medium">{rhythm.country}</span>
                    <span className="opacity-75">{rhythm.meter}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default GlobalRhythmMap;
