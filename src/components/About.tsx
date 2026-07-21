import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * Career timeline — every entry is verified against at least two independent
 * sources (resumes, LinkedIn, cover letters, the Global Pulse CE paper).
 * Add nothing here that can't be traced the same way.
 */
const TIMELINE = [
  { years: "2009–2013", role: "Grinnell College", note: "B.A. — Latin ensembles, jazz and rock bands alongside coursework" },
  { years: "2013", role: "Streetcar Scandal", note: "Started producing original music" },
  { years: "2014–2015", role: "East West Studios, LA", note: "Audio engineering intern — sessions incl. Frank Ocean and Stephen Stills" },
  { years: "2015", role: "UCLA Extension", note: "Professional Certificate in Music Production" },
  { years: "2016–2018", role: "UCLA", note: "Master of Public Policy — thesis prepared for the World Bank" },
  { years: "2016–2019", role: "World Bank", note: "Consultant — led wellbeing data-collection fieldwork across Peru" },
  { years: "2018–2023", role: "7DrumCity", note: "Mentor & workshop leader" },
  { years: "2020–2022", role: "NORC at the University of Chicago", note: "Research associate — NLP, GIS, and web-scraping at national scale" },
  { years: "2022", role: "MIT Professional Education", note: "Applied Data Science certificate" },
  { years: "2022–2023", role: "Rios Partners", note: "Consultant — founded the firm's data strategy team" },
  { years: "2024–2025", role: "Berklee College of Music, Valencia", note: "M.M. Music Production, Technology & Innovation" },
  { years: "2025–present", role: "Valencia, Spain", note: "Producing records, recording sessions, and building music software" },
];

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
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Education</p>
                <p className="font-display font-semibold">Berklee College of Music</p>
                <p className="text-sm text-muted-foreground">M.M. Music Production, Technology &amp; Innovation · Valencia, Spain · 2024–2025</p>
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

        <div className="fade-up mt-16" style={{ transitionDelay: "250ms" }}>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">The Path</p>
          <ol className="border border-border rounded-sm divide-y divide-border">
            {TIMELINE.map((entry) => (
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
