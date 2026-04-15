import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Database,
  Guitar,
  Layers3,
  LayoutDashboard,
  MapPinned,
  MoveRight,
  RadioTower,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RouteHead, { createToolStructuredData } from "@/components/seo/RouteHead";
import { Slider } from "@/components/ui/slider";
import {
  defaultAmieState,
  moodPresets,
  sampleTracks,
  styleBlendProfiles,
  chordProgressionPresets,
} from "@/lib/musicIntelligenceData";
import {
  describeListenerOverlap,
  getMusicIntelligenceBundle,
} from "@/lib/musicIntelligenceEngine";

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
      <h2 className="max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{description}</p>
    </div>
  );
}

function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  helper,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  helper: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-foreground">{Math.round(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(nextValue) => onChange(nextValue[0] ?? value)}
      />
    </div>
  );
}

function InsightCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-primary">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-4 text-sm leading-7 text-muted-foreground">{children}</div>
    </div>
  );
}

export default function MusicIntelligencePage() {
  const [seedTrackId, setSeedTrackId] = useState(defaultAmieState.seedTrackId);
  const [moodId, setMoodId] = useState(defaultAmieState.moodId);
  const [blendArtistId, setBlendArtistId] = useState<string | null>(defaultAmieState.blendArtistId);
  const [chordProgressionId, setChordProgressionId] = useState(defaultAmieState.chordProgressionId);
  const [energy, setEnergy] = useState(defaultAmieState.energy);
  const [tempo, setTempo] = useState(defaultAmieState.tempo);
  const [danceability, setDanceability] = useState(defaultAmieState.danceability);
  const [electronic, setElectronic] = useState(defaultAmieState.electronic);
  const [familiarity, setFamiliarity] = useState(defaultAmieState.familiarity);
  const [guitaristMode, setGuitaristMode] = useState(defaultAmieState.guitaristMode);
  const [globalPulse, setGlobalPulse] = useState(defaultAmieState.globalPulse);

  const bundle = getMusicIntelligenceBundle({
    seedTrackId,
    moodId,
    blendArtistId,
    chordProgressionId,
    energy,
    tempo,
    danceability,
    electronic,
    familiarity,
    guitaristMode,
    globalPulse,
    limit: 5,
  });

  const topRecommendation = bundle.recommendations[0];
  const highlightedIds = new Set(bundle.recommendations.map((result) => result.track.id));
  const backgroundPoints = bundle.embedding.filter(
    (point) => point.id !== bundle.seedTrack.id && !highlightedIds.has(point.id),
  );
  const highlightedPoints = bundle.embedding.filter((point) => highlightedIds.has(point.id));
  const seedPoint = bundle.embedding.find((point) => point.id === bundle.seedTrack.id);

  return (
    <div className="min-h-screen bg-background">
      <RouteHead
        title="Adaptive Music Intelligence Engine – Valencia Sound Craft"
        description="A hybrid music recommendation system blending audio features, collaborative signals, stylistic prompts, and explainable outputs."
        canonicalPath="/music-intelligence"
        jsonLd={createToolStructuredData({
          name: "Adaptive Music Intelligence Engine",
          description:
            "A hybrid music recommendation prototype combining content similarity, listening-behavior signals, and explainable recommendation logic.",
          canonicalPath: "/music-intelligence",
          educationalUse: ["music recommendation systems", "creative AI prototyping", "product design"],
        })}
      />
      <Navbar />

      <main className="pt-20">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(24,190,152,0.18),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.1),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="container relative z-10 mx-auto grid gap-10 px-6 py-14 md:py-20 xl:grid-cols-[1.15fr_0.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">
                  Adaptive Music Intelligence Engine
                </p>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  A mini-Spotify brain for music discovery, creative direction, and explainable taste.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  AMIE combines content-based similarity, collaborative listener signals, and stylistic
                  prompts to generate recommendations you can actually talk through. It is designed as
                  an interview-ready system: product-first, music-native, and deployable inside
                  zachscheffler.com.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <MetricPill label="Hybrid Core" value="0.6 content + 0.4 collaborative" />
                <MetricPill label="Explainability" value="Every rec ships with reasoning" />
                <MetricPill label="Identity Layer" value="Guitarist + Global Pulse modes" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#amie-demo"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 font-semibold text-emerald-300 hover:bg-emerald-400/15"
                >
                  Open Live Demo
                  <MoveRight className="h-4 w-4" />
                </a>
                <a
                  href="#amie-architecture"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-foreground hover:bg-white/10"
                >
                  See System Design
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_26px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Live System Snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">
                    {topRecommendation.track.title} by {topRecommendation.track.artist}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {topRecommendation.track.narrative}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">Latency</p>
                  <p className="text-xl font-semibold text-emerald-300">{bundle.latencyMs.toFixed(2)} ms</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Seed Track</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{bundle.seedTrack.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bundle.seedTrack.genre}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Primary Mode</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{bundle.primaryMode}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bundle.progression.chords}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Regional Arc</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{bundle.narrativeArc}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bundle.usedCache ? "Warm cache" : "Fresh pass"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Explainable Recommendation</p>
                <p className="mt-3 text-base leading-8 text-foreground">
                  Because you are targeting a {tempo} BPM pocket with {energy}% energy and {danceability}%
                  danceability, <span className="font-semibold">{topRecommendation.track.title}</span> lands at{" "}
                  <span className="font-semibold">{Math.round(topRecommendation.contentScore * 100)}%</span> content
                  similarity and <span className="font-semibold">{Math.round(topRecommendation.collaborativeScore * 100)}%</span>{" "}
                  listener-graph alignment.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topRecommendation.explanation.slice(0, 3).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="amie-demo" className="section-padding border-b border-border/40 bg-secondary/40">
          <div className="container mx-auto space-y-8">
            <SectionHeading
              eyebrow="Live Demo"
              title="Interactive recommendation controls with identity-native logic."
              description="Instead of a static list, this prototype lets the user steer the recommender like a product. Slide toward discovery, bend the signal toward acoustic or electronic, then bias the engine with a chord progression and an artist blend."
            />

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Input Layer</p>
                    <h3 className="mt-2 text-2xl font-semibold text-foreground">Seed taste, then steer the engine</h3>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Seed track</span>
                    <select
                      value={seedTrackId}
                      onChange={(event) => setSeedTrackId(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      {sampleTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.title} — {track.artist}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Style blend</span>
                    <select
                      value={blendArtistId ?? "none"}
                      onChange={(event) => setBlendArtistId(event.target.value === "none" ? null : event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      <option value="none">No blend</option>
                      {styleBlendProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                    {bundle.blend && <p className="text-xs leading-6 text-muted-foreground">{bundle.blend.note}</p>}
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-foreground">Chord progression</span>
                    <select
                      value={chordProgressionId}
                      onChange={(event) => setChordProgressionId(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      {chordProgressionPresets.map((progression) => (
                        <option key={progression.id} value={progression.id}>
                          {progression.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs leading-6 text-muted-foreground">{bundle.progression.explanation}</p>
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Mood target</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {moodPresets.map((preset) => {
                      const active = moodId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setMoodId(preset.id)}
                          className={`rounded-[1.25rem] border p-4 text-left ${
                            active
                              ? "border-emerald-400/40 bg-emerald-400/10"
                              : "border-border/70 bg-background/50 hover:border-border hover:bg-background/70"
                          }`}
                        >
                          <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">{preset.blurb}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                  <SliderControl
                    label="Energy"
                    value={energy}
                    onChange={setEnergy}
                    helper="How hard the recommendation should push."
                  />
                  <SliderControl
                    label="Tempo"
                    value={tempo}
                    min={80}
                    max={140}
                    onChange={setTempo}
                    helper="Bias toward slower pocket or more kinetic motion."
                  />
                  <SliderControl
                    label="Danceability"
                    value={danceability}
                    onChange={setDanceability}
                    helper="From head-nod detail to full-body movement."
                  />
                  <SliderControl
                    label="Acoustic vs electronic"
                    value={electronic}
                    onChange={setElectronic}
                    helper="0 is organic and intimate, 100 is synthetic and club-forward."
                  />
                  <SliderControl
                    label="Familiar vs discovery"
                    value={familiarity}
                    onChange={setFamiliarity}
                    helper="Higher values stay closer to the seed taste graph."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setGuitaristMode((value) => !value)}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left ${
                      guitaristMode
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-border/70 bg-background/50"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Guitar className="h-4 w-4" />
                      Guitarist Intelligence
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      Boost tracks with clear solo lanes, modal hints, and phrase-friendly harmony.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGlobalPulse((value) => !value)}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left ${
                      globalPulse
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-border/70 bg-background/50"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapPinned className="h-4 w-4" />
                      Global Pulse
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      Favor cross-cultural recommendations and regional transitions without losing groove continuity.
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">System Readout</p>
                      <h3 className="text-2xl font-semibold text-foreground">
                        {bundle.recommendations.length} ranked recommendations in {bundle.latencyMs.toFixed(2)} ms
                      </h3>
                      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                        {bundle.explainabilitySummary}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricPill label="Top Match" value={`${Math.round(topRecommendation.hybridScore * 100)} / 100`} />
                      <MetricPill label="Mode" value={topRecommendation.modeRecommendation} />
                      <MetricPill label="Cache" value={bundle.usedCache ? "Warm" : "Fresh"} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Top Explanation</p>
                      <h4 className="mt-2 text-xl font-semibold text-foreground">
                        {topRecommendation.track.title} — {topRecommendation.track.artist}
                      </h4>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {topRecommendation.track.region} • {topRecommendation.track.genre}
                      </p>
                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Content similarity</span>
                            <span>{Math.round(topRecommendation.contentScore * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-emerald-300"
                              style={{ width: `${Math.round(topRecommendation.contentScore * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Collaborative signal</span>
                            <span>{Math.round(topRecommendation.collaborativeScore * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-sky-300"
                              style={{ width: `${Math.round(topRecommendation.collaborativeScore * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Discovery alignment</span>
                            <span>{Math.round(topRecommendation.familiarityAlignment * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-fuchsia-300"
                              style={{ width: `${Math.round(topRecommendation.familiarityAlignment * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Embedding Plot</p>
                      <h4 className="mt-2 text-lg font-semibold text-foreground">
                        Style latitude vs kinetic drive
                      </h4>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Grey points are the sample catalog, green points are active recommendations, and white marks the seed track.
                      </p>

                      <div className="mt-4 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                            <XAxis
                              type="number"
                              dataKey="x"
                              domain={[20, 100]}
                              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              name="Style latitude"
                            />
                            <YAxis
                              type="number"
                              dataKey="y"
                              domain={[20, 100]}
                              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              name="Kinetic drive"
                            />
                            <RechartsTooltip
                              cursor={{ strokeDasharray: "4 4", stroke: "rgba(255,255,255,0.2)" }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) {
                                  return null;
                                }

                                const point = payload[0]?.payload as
                                  | { label: string; artist: string; genre: string; region: string; hybridScore: number | null }
                                  | undefined;

                                if (!point) {
                                  return null;
                                }

                                return (
                                  <div className="rounded-2xl border border-white/10 bg-background/95 p-3 shadow-xl">
                                    <p className="text-sm font-semibold text-foreground">{point.label}</p>
                                    <p className="text-xs text-muted-foreground">{point.artist}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{point.genre}</p>
                                    <p className="text-xs text-muted-foreground">{point.region}</p>
                                    {point.hybridScore !== null && (
                                      <p className="mt-2 text-xs font-medium text-emerald-300">
                                        AMIE score {Math.round(point.hybridScore * 100)}
                                      </p>
                                    )}
                                  </div>
                                );
                              }}
                            />
                            <Scatter data={backgroundPoints} fill="rgba(255,255,255,0.28)" />
                            <Scatter data={highlightedPoints} fill="rgba(52,211,153,0.9)" />
                            {seedPoint ? <Scatter data={[seedPoint]} fill="rgba(255,255,255,0.95)" /> : null}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {bundle.recommendations.map((result, index) => (
                    <motion.article
                      key={result.track.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                              {Math.round(result.hybridScore * 100)} / 100
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                              {result.modeRecommendation}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-semibold text-foreground">
                              {result.track.title} <span className="text-muted-foreground">— {result.track.artist}</span>
                            </h4>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">
                              {result.track.region} • {result.track.genre} • {result.track.bpm} BPM
                            </p>
                          </div>
                          <p className="text-sm leading-7 text-muted-foreground">{result.track.narrative}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:w-[330px]">
                          <MetricPill label="Content" value={`${Math.round(result.contentScore * 100)}%`} />
                          <MetricPill label="Collaborative" value={`${Math.round(result.collaborativeScore * 100)}%`} />
                          <MetricPill label="Rhythm" value={`${Math.round(result.rhythmicSimilarity * 100)}%`} />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-2">
                          {result.explanation.map((reason) => (
                            <p key={reason} className="text-sm leading-7 text-muted-foreground">
                              {reason}
                            </p>
                          ))}
                        </div>
                        <div className="rounded-[1.25rem] border border-border/70 bg-background/45 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Talk Track</p>
                          <p className="mt-2 text-sm leading-7 text-foreground">
                            Listener overlap: {describeListenerOverlap(result.track).join(" + ")}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">
                            Guitar cue: {result.track.soloCue}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="amie-architecture" className="section-padding border-b border-border/40">
          <div className="container mx-auto space-y-8">
            <SectionHeading
              eyebrow="Architecture"
              title="A layered system recruiters can understand in thirty seconds."
              description="AMIE is framed like a production recommender, not a notebook. The current site ships a fast interactive prototype, but the architecture maps directly to a FastAPI plus PostgreSQL plus model-service deployment."
            />

            <div className="grid gap-4 lg:grid-cols-5">
              <InsightCard icon={<Database className="h-5 w-5" />} title="Data Layer">
                Spotify, Last.fm, curated metadata, and regional context create the raw substrate. This prototype uses a structured demo catalog so the UI is deployable immediately.
              </InsightCard>
              <InsightCard icon={<SlidersHorizontal className="h-5 w-5" />} title="Feature Engine">
                Audio signals like BPM, energy, danceability, texture, and groove are normalized into track vectors. Metadata and stylistic tags feed explainability.
              </InsightCard>
              <InsightCard icon={<BrainCircuit className="h-5 w-5" />} title="Model Layer">
                Content similarity handles cold start. Collaborative vectors mimic listener graph behavior. Progression, guitarist, and global pulse signals act as product-level priors.
              </InsightCard>
              <InsightCard icon={<Workflow className="h-5 w-5" />} title="API Layer">
                Natural next step: FastAPI routes for `/recommend`, `/explain`, and `/blend`, backed by caching and a LightFM service for real user-behavior training.
              </InsightCard>
              <InsightCard icon={<LayoutDashboard className="h-5 w-5" />} title="Frontend Layer">
                The UI turns the recommender into something touchable: sliders, embedding views, explainability chips, and identity-driven modes tied to music practice.
              </InsightCard>
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/40">
          <div className="container mx-auto grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Interview Story"
                title="How to talk about AMIE like a real product system."
                description="This is the part that makes the project memorable. The work is not just recommending songs; it is demonstrating systems thinking, product judgment, and music-native modeling."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InsightCard icon={<Layers3 className="h-5 w-5" />} title="Why it feels real">
                  The demo exposes tradeoffs users actually care about: discovery versus familiarity, acoustic versus electronic, stylistic blending, and transparent reasoning.
                </InsightCard>
                <InsightCard icon={<Sparkles className="h-5 w-5" />} title="Why it feels like you">
                  Guitarist Intelligence Mode and Global Pulse connect the system to your actual artistic point of view, which makes the project differentiated instead of generic.
                </InsightCard>
                <InsightCard icon={<RadioTower className="h-5 w-5" />} title="Why it feels scalable">
                  The prototype is front-end deployable today, but the architecture already points toward API-backed embeddings, batch scoring, caching, and sequence-aware recommendations.
                </InsightCard>
                <InsightCard icon={<BrainCircuit className="h-5 w-5" />} title="Why it is strong in interviews">
                  You can speak to model choice, cold-start mitigation, explainability, latency budgets, UX controls, and domain-specific product framing in one project.
                </InsightCard>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What You Can Say</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  “I built a hybrid recommender that combines content similarity and collaborative signals,
                  then layered on explainability so users can see why a track surfaced instead of trusting a black box.”
                </p>
                <p>
                  “I treated the UI like a control surface, not a dashboard. The sliders expose product tradeoffs,
                  while Guitarist Mode and Global Pulse turn the recommender into a creative discovery tool.”
                </p>
                <p>
                  “The current version is deployable as a high-fidelity product prototype, and the next step is moving the
                  scoring service into FastAPI with real Spotify and Last.fm ingestion plus LightFM or sequence-aware ranking.”
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
