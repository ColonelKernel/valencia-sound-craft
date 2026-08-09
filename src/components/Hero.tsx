import { ArrowRight, FileText, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

// Decorative waveform: deterministic pseudo-random heights so the hero never
// re-randomizes on re-render (and screenshots stay stable).
const WAVEFORM_HEIGHTS = Array.from(
  { length: 80 },
  (_, i) => Math.sin(i * 0.2) * 40 + ((i * 7919) % 30) + 10,
);

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0">
        <img
          src="/hero-photo.webp"
          srcSet="/hero-photo-750.webp 750w, /hero-photo.webp 1050w"
          sizes="100vw"
          alt="Music production studio"
          width={1050}
          height={1400}
          className="h-full w-full object-cover"
          {...{ fetchpriority: "high" }}
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.35)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-28 md:py-32">
        <div className="max-w-2xl space-y-7">
          {/* The availability pill sits in the first screenful on purpose: a
              hiring visitor decides whether to keep reading in seconds, and
              nothing else on the page says this person is a candidate. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.34em] text-white/60">
              Based in Valencia, Spain
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Open to new roles
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl [text-shadow:_0_2px_20px_rgba(0,0,0,0.6)]">
              Music Producer &amp; Creative Technologist
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              I produce records, engineer sessions, and build the software and data tools
              behind them — from studio work in Valencia to interactive instruments that
              run in your browser.
            </p>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-white/55">
            East West Studios → World Bank and NORC data science → Rios Partners data
            strategy → Berklee M.M., Music Production, Technology &amp; Innovation.
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-white/75">
            Currently open to full-time and contract roles in audio software engineering
            and creative technology —{" "}
            <Link to="/cv" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
              see my CV
            </Link>{" "}
            or{" "}
            <a href="#contact" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
              get in touch
            </a>
            .
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/cv"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_18px_40px_-24px_rgba(255,255,255,0.55)] hover:bg-white/90"
            >
              <FileText size={16} /> View CV
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Get in Touch <ArrowRight size={16} />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Headphones size={16} /> Listen to Work
            </a>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 flex h-24 items-end justify-center gap-[2px] overflow-hidden opacity-25"
        aria-hidden="true"
      >
        {WAVEFORM_HEIGHTS.map((height, index) => (
          <div
            key={index}
            className="w-[3px] rounded-t-full bg-white/55"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
