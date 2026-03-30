import heroImage from "@/assets/hero-studio.jpg";
import { ArrowRight, Headphones } from "lucide-react";

const Hero = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Music production studio"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-2xl space-y-6">
          <p className="text-primary-foreground/60 font-body text-sm tracking-widest uppercase">
            Based in Valencia, Spain
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] text-primary-foreground">
            Music Producer, Guitarist &amp; Creative Technologist
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 font-body leading-relaxed max-w-lg">
            I help artists turn ideas into finished records — blending live instruments, modern production, and global influences.
          </p>

          <p className="text-sm text-primary-foreground/50 font-body">
            Based in Valencia, working with artists locally and worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 bg-primary-foreground text-primary px-6 py-3 text-sm font-medium rounded-sm hover:bg-primary-foreground/90 transition-colors"
            >
              Start a Project <ArrowRight size={16} />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 border border-primary-foreground/30 text-primary-foreground px-6 py-3 text-sm font-medium rounded-sm hover:bg-primary-foreground/10 transition-colors"
            >
              <Headphones size={16} /> Listen to Work
            </a>
          </div>
        </div>
      </div>

      {/* Waveform decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-[2px] opacity-20 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="bg-primary-foreground/50 w-[3px] rounded-t-full"
            style={{
              height: `${Math.sin(i * 0.2) * 40 + Math.random() * 30 + 10}%`,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
