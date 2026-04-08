import { useFadeIn } from "@/hooks/useFadeIn";

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
                I'm a music producer, guitarist, and creative technologist with a background
                spanning policy analysis and music production. I hold a Master of Public
                Policy from UCLA and a Master of Music in Music Production, Technology, and
                Innovation from Berklee College of Music (Valencia).
              </p>
              <p>
                My musical background spans rock, R&amp;B, electronic, jazz, and Latin music,
                shaped by years of playing, recording, and studying across different
                environments — from field research in Peru to studio sessions in Spain.
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
                personal project blending indie rock, electronic textures, and raw songwriting.
                It's where I experiment freely and push ideas that don't fit neatly into any
                single genre.
              </p>
            </div>
          </div>

          <div className="fade-up" style={{ transitionDelay: "150ms" }}>
            <div className="border border-border rounded-sm p-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Education</p>
                <p className="font-display font-semibold">Berklee College of Music</p>
                <p className="text-sm text-muted-foreground">M.A. Music Technology · Valencia, Spain · 2024–2025</p>
                <p className="text-xs text-muted-foreground mt-1">Focus: music production workflows, audio technology integration, and studio systems. Mentor: Pablo Munguía.</p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-display font-semibold">UCLA Luskin School of Public Affairs</p>
                <p className="text-sm text-muted-foreground">Master of Public Policy (Transportation &amp; Urban Development) · Los Angeles, CA · 2016–2018</p>
                <p className="text-xs text-muted-foreground mt-1">Thesis: Results-Based Financing for Hospitals — The Case of the Kyrgyz Republic (prepared for the World Bank).</p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-display font-semibold">MIT Professional Education</p>
                <p className="text-sm text-muted-foreground">Applied Data Science Program Certificate · 2022</p>
                <p className="text-xs text-muted-foreground mt-1">Practical applied data science training.</p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-display font-semibold">Grinnell College</p>
                <p className="text-sm text-muted-foreground">Bachelor of Arts · Grinnell, IA · 2009–2013</p>
                <p className="text-xs text-muted-foreground mt-1">Interdisciplinary coursework in economics, mathematics, and political science. Composed and performed original music.</p>
              </div>
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
      </div>
    </section>
  );
};

export default About;
