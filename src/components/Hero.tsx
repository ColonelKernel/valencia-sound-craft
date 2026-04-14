import heroImage from "@/assets/hero-photo.jpg";
import { ArrowRight, Headphones } from "lucide-react";

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
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,5,5,0.97)_0%,rgba(5,5,5,0.88)_45%,rgba(5,5,5,0.55)_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-28 md:py-32">
        <div className="max-w-2xl space-y-7">
          <p className="text-sm font-medium uppercase tracking-[0.34em] text-primary-foreground/60">
            Based in Valencia, Spain
          </p>

          <div className="space-y-5">
            <h1 className="text-5xl font-bold leading-[1.05] text-primary-foreground md:text-6xl lg:text-7xl">
              Music Producer, Guitarist &amp; Creative Technologist
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-primary-foreground/72 md:text-lg">
              I help artists turn ideas into finished records — blending live instruments,
              modern production, and global influences.
            </p>
          </div>

          <p className="text-sm text-primary-foreground/50">
            Based in Valencia, working with artists locally and worldwide.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-24px_rgba(255,255,255,0.55)] hover:bg-primary/90"
            >
              Start a Project <ArrowRight size={16} />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-foreground/28 px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Headphones size={16} /> Listen to Work
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-24 items-end justify-center gap-[2px] overflow-hidden opacity-25">
        {Array.from({ length: 80 }).map((_, index) => (
          <div
            key={index}
            className="w-[3px] rounded-t-full bg-primary-foreground/55"
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
