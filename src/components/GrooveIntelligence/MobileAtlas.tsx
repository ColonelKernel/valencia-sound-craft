import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Music2, Sparkles } from "lucide-react";
import type { NormalizedGroove } from "./types";
import type { GrooveScene } from "./index";
import GrooveDNA from "./GrooveDNA";

const GrooveListCard = memo(function GrooveListCard({
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
});

interface Props {
  scene: GrooveScene | null;
  selected: NormalizedGroove | null;
  selectedId: string | null;
  isLoading: boolean;
  loadError: string | null;
  onSelect: (groove: NormalizedGroove) => void;
}

/**
 * The touch-friendly mobile variant: hero, curated groove list, DNA panel.
 * The full canvas lab (pan/zoom field, sculptor, view modes) is desktop-only —
 * its interactions are pointer-based.
 */
export default function MobileAtlas({
  scene,
  selected,
  selectedId,
  isLoading,
  loadError,
  onSelect,
}: Props) {
  const mobileGrooves = scene?.mobileGrooves ?? [];

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
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:items-end">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Groove Intelligence</p>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                    A pocket atlas of the groove field, tuned for touch.
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Browse a curated sample of the full groove lab, tap into a groove, and
                    inspect its feel, step pattern, AI narrative, and nearest neighbors. The
                    full pan-and-zoom field opens on desktop screens.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Music2 className="h-4 w-4 text-primary" />
                    {mobileGrooves.length || "—"} grooves
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Curated sample of the {scene?.grooves.length ?? "—"}-node lab
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
                    AI narratives stream in per selected groove.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
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
                  A {mobileGrooves.length}-groove sample with tap-to-select details. Every
                  neighbor link resolves against the full lab set.
                </p>
              </div>

              <div className="grid gap-3">
                {mobileGrooves.map(groove => (
                  <GrooveListCard
                    key={groove.id}
                    groove={groove}
                    selected={selectedId === groove.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>

            <section className="xl:sticky xl:top-6 self-start">
              <GrooveDNA
                groove={selected}
                grooveMap={scene.grooveMap}
                onSelectGroove={onSelect}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
