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
                text-5xl, which mobile-layout.spec.ts guards against at 375px.
                "Transportation" is the longest single word here at 14 characters,
                so the mobile step starts below text-5xl and the measured width
                at 375px is checked rather than assumed. */}
            <h1 className="text-[2.6rem] font-bold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-[4rem] [text-shadow:_0_2px_20px_rgba(0,0,0,0.6)]">
              Transportation Data Scientist &amp; ML Engineer
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
              A UCLA master&rsquo;s in transportation policy, and applied data work from
              2016 to 2023 — the World Bank, NORC, and the data strategy practice I grew
              from an informal group at Rios Partners. I built the World Transit Atlas: 201
              rail systems assembled from OpenStreetMap and open agency data, and a
              ridership audit that took apart my own headline finding instead of
              publishing it.
            </p>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-white/55">
            UCLA M.P.P., transportation policy → World Bank → NORC at the University of
            Chicago → Rios Partners data strategy → MIT Applied Data Science → Berklee
            M.M., Music Production, Technology &amp; Innovation.
          </p>

          {/* The audio decade stays on the page and stays subordinate: it is
              the reason the real-time engineering claims are credible, not the
              role being applied for. A late buffer is audible, which makes it
              the least forgiving place to have learned production deadlines. */}
          <p className="max-w-xl text-sm leading-relaxed text-white/55">
            A decade in audio underneath all of it — where a missed deadline is not a
            slow response, it is a click you can hear.
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-white/75">
            Open to full-time and contract roles across mobility and autonomy, transit
            agencies, and transportation consulting. Bay Area or remote —{" "}
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
