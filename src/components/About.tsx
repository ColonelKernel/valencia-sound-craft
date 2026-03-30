import { useFadeIn } from "@/hooks/useFadeIn";

const About = () => {
  const ref = useFadeIn();

  return (
    <section id="about" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="fade-up">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">About</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              Sound, Performance &amp; Production
            </h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                I'm a music producer, guitarist, and creative technologist working at the
                intersection of live performance and modern production.
              </p>
              <p>
                My background spans rock, jazz, electronic, and Latin music, shaped by years
                of playing, recording, and studying across different musical environments.
              </p>
              <p>
                At Berklee College of Music in Valencia, I focused on production, technology,
                and innovative workflows — combining live instruments with digital tools.
              </p>
              <p>
                I work with artists to take ideas from early sketches to fully realized,
                release-ready tracks.
              </p>
              <p className="text-foreground font-medium">
                I'm especially interested in projects that sit between genres — where
                traditional instruments meet modern production.
              </p>
            </div>
          </div>

          <div className="fade-up" style={{ transitionDelay: "150ms" }}>
            <div className="border border-border rounded-sm p-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Education</p>
                <p className="font-display font-semibold">Berklee College of Music</p>
                <p className="text-sm text-muted-foreground">Valencia, Spain</p>
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
