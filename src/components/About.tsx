import { useFadeIn } from "@/hooks/useFadeIn";

// Timeline and education live in the CV model so this section, the /cv page,
// and the generated PDF can never drift apart.
import { CAREER_TIMELINE, EDUCATION } from "@/content/cv";

const About = () => {
  const ref = useFadeIn();

  return (
    <section id="about" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="fade-up">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">About</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
              Sound, Performance &amp; Production
            </h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                I didn't come up through a conservatory or a computer-science program. I came
                up through music production and public policy. I've been producing since
                2013 — first in college Latin ensembles and rock bands, then as an audio
                engineering intern at East West Studios in LA — and I spent the better part
                of a decade in data: a Master of Public Policy at UCLA, field research for
                the World Bank in Peru, computational social science at NORC, and building a
                data strategy team at Rios Partners.
              </p>
              <p>
                In 2024 I moved to Valencia for an M.M. in Music Production, Technology &amp;
                Innovation at Berklee. That path continues to inform how I work: I produce
                records the way I build software — iteratively, under version control, with
                the data close at hand.
              </p>
              <p>
                At Berklee, I completed{" "}
                <span className="text-foreground font-semibold">Global Pulse</span> — a
                multi-genre debut EP weaving Neo Soul/R&amp;B, experimental electronic, rock,
                and 1970s influences into a unified statement. The project integrates field
                recordings, modular synthesis, creative vocal processing, and modern amp
                emulations to forge distinctive sonic landscapes.
              </p>
              <p>
                I work with artists to take ideas from early sketches to fully realized,
                release-ready tracks, combining live instruments with digital tools and
                data-driven production workflows. I also build interactive music tools —
                like fretboard visualizers, metronomes, and chord progression builders —
                to help musicians learn, practice, and create more effectively.
              </p>
              <p className="text-foreground font-medium">
                I'm especially interested in projects that sit between genres — where
                traditional instruments meet modern production and technology.
              </p>
              <p>
                Outside of client work, I write and produce original music under the name{" "}
                <span className="text-foreground font-semibold">Streetcar Scandal</span> — a
                project I've been producing since 2013, blending indie rock, electronic
                textures, and raw songwriting. It's where I experiment freely and push ideas
                that don't fit neatly into any single genre.
              </p>
            </div>
          </div>

          <div className="fade-up" style={{ transitionDelay: "150ms" }}>
            <div className="border border-border rounded-sm p-8 space-y-6">
              {EDUCATION.map((entry, index) => (
                <div
                  key={entry.institution}
                  className={index === 0 ? undefined : "border-t border-border pt-6"}
                >
                  {index === 0 && (
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Education</p>
                  )}
                  <p className="font-display font-semibold">{entry.institution}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.credential} · {entry.location} · {entry.years}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{entry.detail}</p>
                </div>
              ))}
              <div className="border-t border-border pt-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {["Rock", "Electronic", "Jazz", "Latin", "Pop", "Indie"].map((g) => (
                    <span
                      key={g}
                      className="text-xs border border-border px-3 py-1.5 rounded-sm text-muted-foreground"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Location</p>
                <p className="font-display font-semibold">Valencia, Spain</p>
                <p className="text-sm text-muted-foreground">
                  Available for sessions in Valencia and remote work worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="fade-up mt-16" style={{ transitionDelay: "250ms" }}>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">The Path</p>
          <ol className="border border-border rounded-sm divide-y divide-border">
            {CAREER_TIMELINE.map((entry) => (
              <li key={`${entry.years}-${entry.role}`} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 py-3.5">
                <span className="text-xs text-muted-foreground font-mono w-28 shrink-0">{entry.years}</span>
                <span className="font-display font-semibold text-sm">{entry.role}</span>
                <span className="text-sm text-muted-foreground">{entry.note}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default About;
