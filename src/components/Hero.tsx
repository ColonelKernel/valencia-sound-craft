import heroImage from "@/assets/hero-photo.jpg";
import { BarChart3, Headphones, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden scroll-mt-24"
    >
      {/* Photo background with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Zach Scheffler"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-28 md:py-32">
        <div className="max-w-3xl space-y-8">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-white/60">
            Creative Technologist
          </p>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-[1.08] text-white md:text-5xl lg:text-6xl [text-shadow:_0_2px_20px_rgba(0,0,0,0.6)]">
              Music, Data, and
              <br />
              Interactive Systems
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              I design and build systems for understanding, generating, and interacting
              with music — from intelligent recommendation engines to playable
              audiovisual instruments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/tools"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_18px_40px_-24px_rgba(255,255,255,0.55)] hover:bg-white/90 transition-colors"
            >
              <Wrench size={15} /> Explore Tools
            </Link>
            <Link
              to="/music-analytics"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <BarChart3 size={15} /> View Analytics
            </Link>
            <a
              href="#audio"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
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
