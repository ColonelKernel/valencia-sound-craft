import { ArrowRight, BarChart3, Headphones, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden scroll-mt-24"
    >
      {/* Abstract background — network/graph motif */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-28 md:py-32">
        <div className="max-w-3xl space-y-8">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-muted-foreground">
            Creative Technologist
          </p>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-[1.08] text-foreground md:text-5xl lg:text-6xl">
              Music, Data, and
              <br />
              Interactive Systems
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              I design and build systems for understanding, generating, and interacting
              with music — from intelligent recommendation engines to playable
              audiovisual instruments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              <Wrench size={15} /> Explore Tools
            </Link>
            <Link
              to="/music-analytics"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <BarChart3 size={15} /> View Analytics
            </Link>
            <a
              href="#audio"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Headphones size={15} /> Listen
            </a>
          </div>
        </div>
      </div>

      {/* Subtle bottom waveform */}
      <div className="absolute bottom-0 left-0 right-0 flex h-16 items-end justify-center gap-[2px] overflow-hidden opacity-10">
        {Array.from({ length: 80 }).map((_, index) => (
          <div
            key={index}
            className="w-[2px] rounded-t-full bg-foreground"
            style={{
              height: `${Math.sin(index * 0.15) * 50 + 20}%`,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
