import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Music2, Sparkles } from "lucide-react";
import type { GrooveDatasetPayload, GrooveNormalizationRanges, NormalizedGroove, RawGroove } from "./types";
import { normalizeGrooves, sampleGrooveSet } from "./utils";
import { buildSimilarityCache } from "./clustering";
import { stopPlayback } from "./audioEngine";
import GrooveField from "./GrooveField";
import GrooveDNA from "./GrooveDNA";

const MOBILE_LIMIT = 24;
const DESKTOP_LIMIT = 48;
const FIELD_LIMIT = 80;
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

interface GrooveScene {
  mobileGrooves: NormalizedGroove[];
  desktopGrooves: NormalizedGroove[];
  fieldGrooves: NormalizedGroove[];
  fieldGrooveMap: Map<string, NormalizedGroove>;
  totalCount: number;
  genreCount: number;
}

function prepareSample(raw: RawGroove[], reference: RawGroove[] | GrooveNormalizationRanges) {
  const normalized = normalizeGrooves(raw, reference);
  const similarity = buildSimilarityCache(normalized, 5);
  return normalized.map(groove => ({
    ...groove,
    similar: similarity.neighbors.get(groove.id) ?? [],
  }));
}

function useDesktopFieldAvailability() {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_MEDIA_QUERY).matches : false
  ));

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function GrooveListCard({
  groove,
  selected,
  onSelect,
}: {
  groove: NormalizedGroove;
  selected: boolean;
  onSelect: (groove: NormalizedGroove) => void;
}) {
  const chips = [
    { label: "Energy", value: groove.norm_density, color: "hsl(30, 90%, 55%)" },
    { label: "Swing", value: groove.norm_swing, color: "hsl(180, 70%, 50%)" },
    { label: "Sync", value: groove.norm_syncopation, color: "hsl(280, 70%, 60%)" },
  ];

  return (
    <button
      onClick={() => onSelect(groove)}
      className={`w-full rounded-[1.25rem] border p-4 text-left transition-all ${
        selected
          ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_22px_45px_-30px_rgba(16,185,129,0.45)]"
          : "border-border/70 bg-card/80 hover:border-foreground/20 hover:bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: groove.color }}
            />
            <span className="truncate text-sm font-semibold capitalize text-foreground">{groove.genre}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {groove.substyle || groove.beat_type || groove.time_signature || "Curated groove study"}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-mono text-muted-foreground">{groove.bpm} BPM</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span className="rounded-full border border-border/70 px-2.5 py-1">
          {groove.duration.toFixed(1)}s
        </span>
        {groove.time_signature && (
          <span className="rounded-full border border-border/70 px-2.5 py-1">
            {groove.time_signature}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {chips.map(chip => (
          <div key={chip.label} className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{chip.label}</div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${chip.value * 100}%`, backgroundColor: chip.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function GrooveIntelligenceLab() {
  const [scene, setScene] = useState<GrooveScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isDesktop = useDesktopFieldAvailability();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetch("/data/groove-intelligence.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load groove dataset (${response.status})`);
        }

        return response.json();
      })
      .then((payload: GrooveDatasetPayload) => {
        if (cancelled) return;

        const fieldRaw = sampleGrooveSet(payload.grooves, FIELD_LIMIT);
        const desktopRaw = sampleGrooveSet(fieldRaw, DESKTOP_LIMIT);
        const mobileRaw = sampleGrooveSet(desktopRaw, MOBILE_LIMIT);

        const fieldGrooves = prepareSample(fieldRaw, payload.referenceRanges);
        const desktopGrooves = prepareSample(desktopRaw, payload.referenceRanges);
        const mobileGrooves = prepareSample(mobileRaw, payload.referenceRanges);

        setScene({
          mobileGrooves,
          desktopGrooves,
          fieldGrooves,
          fieldGrooveMap: new Map(fieldGrooves.map(groove => [groove.id, groove])),
          totalCount: payload.totalCount,
          genreCount: new Set(fieldGrooves.map(groove => groove.genre)).size,
        });
      })
      .catch(error => {
        console.error("Failed to load groove data:", error);
        if (!cancelled) setLoadError("Unable to load the groove atlas right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => stopPlayback(), []);

  useEffect(() => {
    if (isDesktop) return;
    setFieldOpen(false);
  }, [isDesktop]);

  const listGrooves = useMemo(() => {
    if (!scene) return [];
    return isDesktop ? scene.desktopGrooves : scene.mobileGrooves;
  }, [isDesktop, scene]);

  const listGrooveMap = useMemo(() => (
    new Map(listGrooves.map(groove => [groove.id, groove]))
  ), [listGrooves]);

  useEffect(() => {
    if (!scene) return;

    const fallbackId = listGrooves[0]?.id ?? null;
    if (!selectedId || !scene.fieldGrooveMap.has(selectedId)) {
      setSelectedId(fallbackId);
      return;
    }

    if (!fieldOpen && fallbackId && !listGrooveMap.has(selectedId)) {
      setSelectedId(fallbackId);
    }
  }, [fieldOpen, listGrooveMap, listGrooves, scene, selectedId]);

  const selected = useMemo(() => {
    if (!scene || !selectedId) return null;
    if (fieldOpen) return scene.fieldGrooveMap.get(selectedId) ?? null;
    return listGrooveMap.get(selectedId) ?? scene.fieldGrooveMap.get(selectedId) ?? null;
  }, [fieldOpen, listGrooveMap, scene, selectedId]);

  const relatedGrooveMap = useMemo(() => {
    if (!scene) return new Map<string, NormalizedGroove>();
    return fieldOpen ? scene.fieldGrooveMap : listGrooveMap;
  }, [fieldOpen, listGrooveMap, scene]);

  const handleSelect = useCallback((groove: NormalizedGroove) => {
    stopPlayback();
    setSelectedId(groove.id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-secondary/35">
        <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Link>
              {isDesktop && (
                <button
                  onClick={() => setFieldOpen(open => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-mono uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/15"
                >
                  <Compass className="h-3.5 w-3.5" />
                  {fieldOpen ? "Hide Field View" : "Open Field View"}
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:items-end">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Groove Intelligence</p>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                    Responsive groove atlas with quick feel previews and an optional desktop field.
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Browse a lightweight sample of the rhythm dataset, tap or click into a groove,
                    and inspect its feel, step pattern, and nearest neighbors without booting a
                    heavyweight experimental scene.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Music2 className="h-4 w-4 text-primary" />
                    {listGrooves.length || (isDesktop ? DESKTOP_LIMIT : MOBILE_LIMIT)} grooves
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isDesktop ? "Desktop list sample" : "Mobile list sample"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    {scene?.genreCount ?? "—"} genres
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Balanced across the sampled field
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                  <div className="text-sm font-semibold text-foreground">{scene?.totalCount ?? "—"} source grooves</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Manual playback only. No AI narrative fetches on this route.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
        {isDesktop && (
          <section className="mb-8 rounded-[1.5rem] border border-border/70 bg-card/70 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Optional Field View</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Open a stripped-down desktop map of {FIELD_LIMIT} sampled grooves. It stays static,
                  mounts only on demand, and supports click-to-select with simple zoom controls.
                </p>
              </div>
              <button
                onClick={() => setFieldOpen(open => !open)}
                className="inline-flex items-center justify-center rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {fieldOpen ? "Hide Field View" : "Open Field View"}
              </button>
            </div>

            {fieldOpen && scene && (
              <div className="mt-6">
                <GrooveField
                  grooves={scene.fieldGrooves}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </div>
            )}
          </section>
        )}

        {!scene && isLoading && (
          <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
            Loading the groove atlas…
          </div>
        )}

        {!scene && !isLoading && (
          <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
            {loadError ?? "No groove data available."}
          </div>
        )}

        {scene && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Sampled Grooves</h2>
                <p className="text-sm text-muted-foreground">
                  {isDesktop
                    ? "Desktop keeps a 48-groove list for fast scanning, while the optional field expands to 80 points."
                    : "Mobile stays focused on a 24-groove sample with tap-to-select details and no field renderer."}
                </p>
              </div>

              <div className="grid gap-3">
                {listGrooves.map(groove => (
                  <GrooveListCard
                    key={groove.id}
                    groove={groove}
                    selected={selectedId === groove.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>

            <section className="xl:sticky xl:top-6 self-start">
              <GrooveDNA
                groove={selected}
                grooveMap={relatedGrooveMap}
                onSelectGroove={handleSelect}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
