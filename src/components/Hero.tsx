import heroImage from "@/assets/hero-photo.jpg";
import { ArrowRight, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

import HeroRhythmPreview from "@/components/HeroRhythmPreview";

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Music production studio"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.78)_45%,rgba(10,10,10,0.38)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-28 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,420px)] lg:gap-14">
          <div className="max-w-3xl space-y-7">
            <p className="text-sm font-medium uppercase tracking-[0.34em] text-foreground/60">
              Valencia, Spain • Music • Systems • Production
            </p>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-bold leading-[0.98] text-foreground md:text-6xl lg:text-7xl">
                Music producer, guitarist, and creative technologist for records that move.
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-foreground/70 md:text-lg">
                I build finished records, live session workflows, and playable music systems that
                make rhythm, harmony, and experimentation feel immediate.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-[0_18px_40px_-24px_rgba(255,255,255,0.55)] hover:bg-foreground/90"
              >
                Start a Project <ArrowRight size={16} />
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-foreground/28 px-6 py-3.5 text-sm font-medium text-foreground hover:bg-foreground/10"
              >
                <Headphones size={16} /> Listen to Work
              </a>
              <Link
                to="/tools/rhythm"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-foreground/12 bg-foreground/6 px-6 py-3.5 text-sm font-medium text-foreground/82 hover:bg-foreground/12 hover:text-foreground"
              >
                Try the Rhythm Engine
              </Link>
            </div>

            <p className="max-w-xl text-sm text-foreground/52">
              Based in Valencia and working with artists locally and worldwide across production,
              live instrumentation, and interactive tool design.
            </p>
          </div>

          <div className="lg:justify-self-end">
            <HeroRhythmPreview />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-24 items-end justify-center gap-[2px] overflow-hidden opacity-25">
        {Array.from({ length: 80 }).map((_, index) => (
          <div
            key={index}
            className="w-[3px] rounded-t-full bg-foreground/55"
            style={{
              height: `${Math.sin(index * 0.2) * 40 + Math.random() * 30 + 10}%`,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
