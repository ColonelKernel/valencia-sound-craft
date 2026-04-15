import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  CircleDot,
  GitBranch,
  Move3D,
  Play,
  Route,
  Square,
  TrainFront,
  Volume2,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RouteHead, { createToolStructuredData } from "@/components/seo/RouteHead";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { transitSynthAudio, TRANSIT_WAVEFORM_OPTIONS, type TransitAudioSettings, type TransitWaveform } from "@/lib/transitSynthAudio";
import { defaultTransitNetworkId, getTransitNetworkById, transitNetworks, type TransitLine, type TransitNetwork, type TransitStyleMode } from "@/lib/transitSynthData";
import {
  buildTransitInsightCopy,
  buildTransitLinePaths,
  generateTransitSequence,
  getStationSoundProfile,
  getTransitNetworkMetrics,
  getTransitSonicProfile,
  projectTransitNetwork,
  TRANSIT_SCALE_OPTIONS,
  TRANSIT_SEQUENCE_OPTIONS,
  TRANSIT_STYLE_PRESETS,
  type TransitEngineControls,
  type TransitProjectionPoint,
  type TransitScaleMode,
  type TransitSequenceMode,
} from "@/lib/transitSynthEngine";

const MAP_WIDTH = 920;
const MAP_HEIGHT = 620;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function StatChip({ label, value }: { label: string; value: string }) {
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
  helper,
  value,
  min,
  max,
  onChange,
  footer,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-foreground">{Math.round(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(next) => onChange(next[0] ?? value)} />
      {footer}
    </div>
  );
}

function MappingCard({
  icon,
  title,
  description,
  value,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-primary">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function TransitMapCanvas({
  network,
  selectedLineId,
  projection,
  activeStationId,
  hoveredStationId,
  selectedStationId,
  linePaths,
  onStationHover,
  onStationLeave,
  onStationSelect,
}: {
  network: TransitNetwork;
  selectedLineId: string;
  projection: Record<string, TransitProjectionPoint>;
  activeStationId: string | null;
  hoveredStationId: string | null;
  selectedStationId: string | null;
  linePaths: Array<TransitLine & { path: string }>;
  onStationHover: (stationId: string) => void;
  onStationLeave: () => void;
  onStationSelect: (stationId: string) => void;
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  const transformedTranslateX = transform.x + (1 - transform.scale) * (MAP_WIDTH / 2);
  const transformedTranslateY = transform.y + (1 - transform.scale) * (MAP_HEIGHT / 2);

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setTransform((current) => ({
      ...current,
      scale: clamp(current.scale * (event.deltaY > 0 ? 0.92 : 1.08), 0.82, 2.6),
    }));
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    setTransform((current) => ({
      ...current,
      x: dragRef.current!.originX + (event.clientX - dragRef.current!.startX),
      y: dragRef.current!.originY + (event.clientY - dragRef.current!.startY),
    }));
  };

  const releasePointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const zoom = (direction: "in" | "out") => {
    setTransform((current) => ({
      ...current,
      scale: clamp(current.scale * (direction === "in" ? 1.14 : 0.88), 0.82, 2.6),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Playable Network Map</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => zoom("out")}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => zoom("in")}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
          >
            <Move3D className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(36,182,146,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))]">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="h-[520px] w-full touch-none bg-transparent"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={releasePointer}
          onPointerLeave={(event) => {
            releasePointer(event);
            onStationLeave();
          }}
        >
          <defs>
            <pattern id="transit-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </pattern>
            <filter id="station-glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#transit-grid)" />

          <g transform={`translate(${transformedTranslateX} ${transformedTranslateY}) scale(${transform.scale})`}>
            {linePaths.map((line) => {
              const active = line.id === selectedLineId || line.id === network.stations.find((station) => station.id === activeStationId)?.lines[0];
              return (
                <polyline
                  key={line.id}
                  points={line.path}
                  fill="none"
                  stroke={line.color}
                  strokeOpacity={active ? 0.96 : 0.34}
                  strokeWidth={active ? 10 : 6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {network.stations.map((station) => {
              const point = projection[station.id];
              const active = station.id === activeStationId;
              const hovered = station.id === hoveredStationId;
              const selected = station.id === selectedStationId;
              const radius = 7 + station.degree * 1.8;
              const primaryLine = network.lines.find((line) => station.lines.includes(line.id)) ?? network.lines[0];

              return (
                <g
                  key={station.id}
                  transform={`translate(${point.x} ${point.y})`}
                  onMouseEnter={() => onStationHover(station.id)}
                  onMouseLeave={onStationLeave}
                  onClick={() => onStationSelect(station.id)}
                  className="cursor-pointer"
                >
                  {(active || hovered || selected) && (
                    <circle
                      r={radius + 12}
                      fill={primaryLine.color}
                      opacity={active ? 0.22 : 0.12}
                      filter="url(#station-glow)"
                    />
                  )}
                  <circle
                    r={radius + (active ? 3 : selected ? 2 : 0)}
                    fill={primaryLine.color}
                    fillOpacity={active ? 0.98 : hovered || selected ? 0.88 : 0.72}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={active || selected ? 3 : 1.4}
                  />
                  <text
                    x={radius + 10}
                    y={4}
                    fontSize="12"
                    fill="rgba(255,255,255,0.88)"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {station.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function TransitSynthPage() {
  const [networkId, setNetworkId] = useState(defaultTransitNetworkId);
  const [scaleMode, setScaleMode] = useState<TransitScaleMode>("dorian");
  const [waveform, setWaveform] = useState<TransitWaveform>("wavetable");
  const [sequenceMode, setSequenceMode] = useState<TransitSequenceMode>("route-solo");
  const [tempo, setTempo] = useState(112);
  const [urbanDensity, setUrbanDensity] = useState(58);
  const [order, setOrder] = useState(54);
  const [styleMode, setStyleMode] = useState<TransitStyleMode>("cartographic");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [audioArmed, setAudioArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hoverPreviewRef = useRef<{ stationId: string | null; timestamp: number }>({ stationId: null, timestamp: 0 });

  const network = useMemo(() => getTransitNetworkById(networkId), [networkId]);

  useEffect(() => {
    setSelectedLineId(network.lines[0]?.id ?? "");
    setSelectedStationId(network.stations[0]?.id ?? null);
    setHoveredStationId(null);
    setActiveStationId(null);
    setStyleMode(network.defaultStyleMode);
  }, [network]);

  useEffect(() => {
    return () => {
      transitSynthAudio.stop();
    };
  }, []);

  const controls: TransitEngineControls = useMemo(
    () => ({
      scaleMode,
      styleMode,
      sequenceMode,
      selectedLineId: selectedLineId || network.lines[0]?.id || "",
      tempo,
      urbanDensity,
      order,
    }),
    [network, order, scaleMode, selectedLineId, sequenceMode, styleMode, tempo, urbanDensity],
  );

  const metrics = useMemo(() => getTransitNetworkMetrics(network), [network]);
  const sonicProfile = useMemo(() => getTransitSonicProfile(network, controls), [network, controls]);
  const projection = useMemo(() => projectTransitNetwork(network, MAP_WIDTH, MAP_HEIGHT, 78), [network]);
  const linePaths = useMemo(() => buildTransitLinePaths(network), [network]);
  const sequence = useMemo(() => generateTransitSequence(network, controls), [network, controls]);

  const audioSettings: TransitAudioSettings = {
    ...sonicProfile,
    waveform,
    tempo,
    masterGain: 0.66,
  };

  const selectedLine = network.lines.find((line) => line.id === controls.selectedLineId) ?? network.lines[0];
  const selectedStation =
    network.stations.find((station) => station.id === (hoveredStationId ?? selectedStationId ?? network.stations[0]?.id)) ??
    network.stations[0];
  const stationSound = selectedStation ? getStationSoundProfile(network, selectedStation.id, controls) : null;
  const routeSummary = buildTransitInsightCopy(network, controls);
  const datasetPreview = useMemo(
    () =>
      JSON.stringify(
        {
          city: network.city,
          network: network.network,
          stations: network.stations.slice(0, 3).map((station) => ({
            name: station.name,
            lat: station.lat,
            lon: station.lon,
            lines: station.lines,
            degree: station.degree,
            connections: station.connections,
          })),
          lines: network.lines.slice(0, 2),
        },
        null,
        2,
      ),
    [network],
  );

  const handleArmAudio = async () => {
    await transitSynthAudio.arm(audioSettings);
    setAudioArmed(true);
  };

  const handleStopPlayback = () => {
    transitSynthAudio.stop();
    setPlaying(false);
    setActiveStationId(null);
  };

  const handlePlaySequence = async () => {
    await transitSynthAudio.playSequence(sequence, audioSettings, {
      onEventStart: (event) => {
        setActiveStationId(event.stationId);
      },
      onSequenceEnd: () => {
        setPlaying(false);
        setActiveStationId(null);
      },
    });
    setPlaying(true);
    setAudioArmed(true);
  };

  const triggerStationPreview = async (stationId: string, previewOnly = false) => {
    const profile = getStationSoundProfile(network, stationId, controls);
    if (!audioArmed) {
      await transitSynthAudio.arm(audioSettings);
      setAudioArmed(true);
    }

    await transitSynthAudio.playStation(profile, audioSettings, previewOnly ? 0.28 : undefined);
    setSelectedStationId(stationId);
  };

  const handleStationHover = (stationId: string) => {
    setHoveredStationId(stationId);

    const now = Date.now();
    if (!audioArmed) {
      return;
    }

    if (hoverPreviewRef.current.stationId === stationId && now - hoverPreviewRef.current.timestamp < 180) {
      return;
    }

    hoverPreviewRef.current = { stationId, timestamp: now };
    void transitSynthAudio.playStation(getStationSoundProfile(network, stationId, controls), audioSettings, 0.22);
  };

  useEffect(() => {
    handleStopPlayback();
    hoverPreviewRef.current = { stationId: null, timestamp: 0 };
  }, [networkId, selectedLineId, sequenceMode, scaleMode, styleMode]);

  return (
    <div className="min-h-screen bg-background">
      <RouteHead
        title="TransitSynth: Playable Cities Engine – Valencia Sound Craft"
        description="A graph-driven music system that turns transit networks into playable synthesizer presets with real-time route sequencing."
        canonicalPath="/transit-synth"
        jsonLd={createToolStructuredData({
          name: "TransitSynth: Playable Cities Engine",
          description:
            "An interactive web application that maps transit networks to notes, rhythmic traversal, and real-time synthesis.",
          canonicalPath: "/transit-synth",
          educationalUse: ["music technology", "graph theory", "creative coding"],
        })}
      />
      <Navbar />

      <main className="pt-20">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,188,154,0.18),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
          <div className="container relative z-10 mx-auto grid gap-10 px-6 py-14 md:py-20 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-300/80">
                  TransitSynth: Playable Cities Engine
                </p>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  A graph-native synth that turns subway maps into playable cities.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  Each transit system becomes a musical instrument. Stations map to pitch and velocity,
                  connections shape duration, lines become sequencers, and network density controls the
                  space around the sound. It is urban topology translated into generative music.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatChip label="Default Instrument" value="BART" />
                <StatChip label="Preset Library" value={`${transitNetworks.length} cities`} />
                <StatChip label="Core Method" value="Graph traversal + Web Audio" />
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Employer-Legible Framing</p>
                <p className="mt-3 text-base leading-8 text-foreground">
                  This project shows how graph structure, spatial data, and synthesis can become one
                  system. Dense interchanges create chord pressure, long routes become evolving melodic
                  runs, and each city behaves like a distinct sonic preset.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_26px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current Preset</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">
                    {network.city} — {network.network}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{network.description}</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">Style Mode</p>
                  <p className="text-sm font-semibold text-emerald-300">{TRANSIT_STYLE_PRESETS[styleMode].label}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Stations</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{metrics.stationCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{metrics.transferCount} transfer nodes</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Density Signal</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{Math.round(sonicProfile.densitySignal * 100)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sonicProfile.traversalBias} traversal</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sound Field</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{Math.round(sonicProfile.filterCutoffHz)} Hz</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sonicProfile.lineLayerCount} active line layer{sonicProfile.lineLayerCount > 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Graph-to-Sound Snapshot</p>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">{routeSummary}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding border-b border-border/40 bg-secondary/40">
          <div className="container mx-auto space-y-8">
            <SectionHeading
              eyebrow="Live Engine"
              title="Click stations, sequence routes, and steer the city like an instrument."
              description="The map is the sequencer. Hover previews stations after audio is armed, click to trigger notes directly, then switch between route solo and network jam to hear how graph traversal changes the phrase."
            />

            <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
              <div className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground">
                      <TrainFront className="h-4 w-4 text-emerald-300" />
                      <select
                        value={networkId}
                        onChange={(event) => setNetworkId(event.target.value)}
                        className="bg-transparent text-sm outline-none"
                      >
                        {transitNetworks.map((item) => (
                          <option key={item.id} value={item.id} className="bg-background">
                            {item.city} — {item.shortLabel}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground">
                      <Route className="h-4 w-4 text-emerald-300" />
                      <select
                        value={selectedLineId}
                        onChange={(event) => setSelectedLineId(event.target.value)}
                        className="bg-transparent text-sm outline-none"
                      >
                        {network.lines.map((line) => (
                          <option key={line.id} value={line.id} className="bg-background">
                            {line.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleArmAudio}>
                      <Volume2 className="h-4 w-4" />
                      {audioArmed ? "Audio Armed" : "Arm Audio"}
                    </Button>
                    <Button type="button" onClick={playing ? handleStopPlayback : handlePlaySequence}>
                      {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {playing ? "Stop Network" : "Play Network"}
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <TransitMapCanvas
                    network={network}
                    selectedLineId={selectedLineId}
                    projection={projection}
                    activeStationId={activeStationId}
                    hoveredStationId={hoveredStationId}
                    selectedStationId={selectedStationId}
                    linePaths={linePaths}
                    onStationHover={handleStationHover}
                    onStationLeave={() => setHoveredStationId(null)}
                    onStationSelect={(stationId) => {
                      void triggerStationPreview(stationId);
                    }}
                  />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Selected Station</p>
                    {stationSound ? (
                      <>
                        <h3 className="mt-2 text-xl font-semibold text-foreground">{selectedStation.name}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{stationSound.reason}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <StatChip label="Pitch" value={stationSound.noteLabel} />
                          <StatChip label="Velocity" value={`${Math.round(stationSound.velocity * 127)}`} />
                          <StatChip label="Duration" value={`${stationSound.durationBeats.toFixed(2)} beats`} />
                          <StatChip label="Pan" value={stationSound.pan.toFixed(2)} />
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Generated Sequence</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sequence.slice(0, 10).map((event) => (
                        <span
                          key={event.eventId}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs",
                            activeStationId === event.stationId
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-muted-foreground",
                          )}
                        >
                          {event.stationName} · {event.noteLabel}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {sequenceMode === "route-solo"
                        ? `Route solo follows ${selectedLine.name} in order, treating each connection as a melodic step.`
                        : `Network jam layers ${sonicProfile.lineLayerCount} line groups, so transfers become chord pivots and inter-line offsets create groove. `}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.85)]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Transport + Synthesis</p>
                  <h3 className="text-2xl font-semibold text-foreground">Control rack</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Adjust the graph reading and the synth response together. Urban Density changes layering and ambience,
                    while Chaos vs Order shifts the traversal between faithful route-reading and intersection drift.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Sequence mode</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TRANSIT_SEQUENCE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSequenceMode(option.id)}
                        className={cn(
                          "rounded-[1.1rem] border px-4 py-3 text-left",
                          sequenceMode === option.id
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-border/70 bg-background/45",
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Style mode</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.values(TRANSIT_STYLE_PRESETS).map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setStyleMode(style.id)}
                        className={cn(
                          "rounded-[1.1rem] border px-4 py-3 text-left",
                          styleMode === style.id
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-border/70 bg-background/45",
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{style.label}</p>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Scale mode</span>
                    <select
                      value={scaleMode}
                      onChange={(event) => setScaleMode(event.target.value as TransitScaleMode)}
                      className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      {TRANSIT_SCALE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Waveform</span>
                    <select
                      value={waveform}
                      onChange={(event) => setWaveform(event.target.value as TransitWaveform)}
                      className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      {TRANSIT_WAVEFORM_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-5 rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                  <SliderControl
                    label="Tempo"
                    helper="Playback speed for route traversal."
                    value={tempo}
                    min={72}
                    max={150}
                    onChange={setTempo}
                  />

                  <SliderControl
                    label="Urban Density"
                    helper="More density means more layered lines, wider ambience, and stronger modulation."
                    value={urbanDensity}
                    min={0}
                    max={100}
                    onChange={setUrbanDensity}
                  />

                  <SliderControl
                    label="Chaos vs Order"
                    helper="Left side favors transfer jumps, right side favors route-faithful traversal."
                    value={order}
                    min={0}
                    max={100}
                    onChange={setOrder}
                    footer={
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span>Chaos</span>
                        <span>Order</span>
                      </div>
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <StatChip label="Filter Cutoff" value={`${Math.round(sonicProfile.filterCutoffHz)} Hz`} />
                  <StatChip label="Mod Depth" value={`${Math.round(sonicProfile.modulationDepth * 100)}%`} />
                  <StatChip label="Reverb" value={`${Math.round(sonicProfile.reverbMix * 100)}%`} />
                  <StatChip label="Delay" value={`${Math.round(sonicProfile.delayMix * 100)}%`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding border-b border-border/40">
          <div className="container mx-auto space-y-8">
            <SectionHeading
              eyebrow="System Mapping"
              title="Readable enough for recruiters, interesting enough for musicians."
              description="The design is intentionally explicit: graph topology becomes musical behavior through a few legible transformations. That makes the project easier to demo, easier to explain, and easier to extend."
            />

            <div className="grid gap-4 lg:grid-cols-4">
              <MappingCard
                icon={<CircleDot className="h-5 w-5" />}
                title="Node -> Pitch"
                value={stationSound ? `${selectedStation.name} = ${stationSound.noteLabel}` : "Station -> note"}
                description="Latitude maps to pitch height, then the result is quantized to a musical scale. Degree centrality nudges velocity upward so busier stations feel more assertive."
              />
              <MappingCard
                icon={<GitBranch className="h-5 w-5" />}
                title="Edge -> Duration"
                value={`${metrics.averageConnectionDistanceKm.toFixed(1)} km avg edge`}
                description="Longer geographic connections expand note length and envelope time, so broad network spans feel more legato than dense central corridors."
              />
              <MappingCard
                icon={<Route className="h-5 w-5" />}
                title="Line -> Sequence"
                value={`${selectedLine?.name ?? "Line"} focus`}
                description="Each route acts like an arpeggiator. Ordered mode follows line memory directly, while chaos pushes the traversal into transfer-heavy graph exploration."
              />
              <MappingCard
                icon={<Waves className="h-5 w-5" />}
                title="Density -> Space"
                value={`${Math.round(sonicProfile.densitySignal * 100)}% density signal`}
                description="Network density controls filter cutoff, modulation depth, layering, and wet effects, so dense cities naturally sound more harmonically saturated and spatially alive."
              />
            </div>
          </div>
        </section>

        <section className="section-padding bg-secondary/40">
          <div className="container mx-auto grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Structured Data"
                title="The preset library is dataset-first, not hand-wavy."
                description="Each city is stored as a graph-ready dataset with stations, coordinates, line memberships, degree centrality, and neighbor connections. That keeps the sonification layer honest and extensible."
              />

              <div className="rounded-[1.75rem] border border-border/70 bg-card/75 p-5 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current Dataset Excerpt</p>
                <pre className="mt-4 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-200">
                  <code>{datasetPreview}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-card/75 p-6 shadow-[0_20px_45px_-34px_rgba(0,0,0,0.8)]">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Why This Plays Well In Interviews</p>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p>
                  “I represented each transit system as a graph, then used adjacency and centrality to drive a real-time synthesis layer.”
                </p>
                <p>
                  “I separated dataset design, graph traversal, musical mapping, and audio rendering so the system could scale to more cities or live transit feeds.”
                </p>
                <p>
                  “The UI is a control surface, not just a visualization. Users can audition stations directly, solo routes, or jam the whole network with explainable mappings.”
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
