import { ArrowRight, FileText, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonClasses } from "@/components/ui/button";

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
          srcSet="/hero-photo-750.webp 750w, /hero-photo.webp 1400w"
          sizes="100vw"
          alt="Zach Scheffler's home studio: guitars and a bass on the wall, studio monitors, and a workstation running a DAW"
          width={1400}
          height={1050}
          className="h-full w-full object-cover"
          {...{ fetchpriority: "high" }}
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.35)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 container mx-auto py-28 md:py-32">
        <div className="max-w-2xl space-y-7">
          {/* The availability pill sits in the first screenful on purpose: a
              hiring visitor decides whether to keep reading in seconds, and
              nothing else on the page says this person is a candidate. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.34em] text-white/60">
              San Francisco Bay Area
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Open to new roles
            </span>
          </div>

          <div className="space-y-5">
            {/* "ML" rather than "Machine Learning": the postings title the role
                that way, and the long form is a 42-character unbroken phrase at
                text-5xl, which mobile-layout.spec.ts guards against at 375px. */}
            <h1 className="text-5xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl [text-shadow:_0_2px_20px_rgba(0,0,0,0.6)]">
              Data Scientist &amp; ML Engineer
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              Seven years of applied data work — the World Bank, NORC, and the data
              strategy practice I grew from an informal group at Rios Partners — and a
              decade in audio. I take models from experiment to production, and my proving
              ground is the hardest real-time target there is: sound.
            </p>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-white/55">
            UCLA M.P.P. → World Bank → NORC at the University of Chicago → Rios Partners
            data strategy → MIT Applied Data Science → Berklee M.M., Music Production,
            Technology &amp; Innovation.
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-white/75">
            Currently open to full-time and contract roles in data science and machine
            learning engineering, Bay Area or remote —{" "}
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
              className={buttonClasses({ variant: "onImage", size: "lg" })}
            >
              <FileText size={16} /> View CV
            </Link>
            {/* Slot two sends a hiring reader at the evidence rather than the
                contact form: "get in touch" already exists as an inline link one
                paragraph up, so spending a button on it was duplication. */}
            <a
              href="#evidence"
              className={buttonClasses({ variant: "onImageGhost", size: "lg" })}
            >
              See the evidence <ArrowRight size={16} />
            </a>
            <a
              href="#portfolio"
              className={buttonClasses({ variant: "ghost", size: "lg" }, "text-white/80 hover:bg-white/10 hover:text-white")}
            >
              <Headphones size={16} /> Hear the audio work
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
