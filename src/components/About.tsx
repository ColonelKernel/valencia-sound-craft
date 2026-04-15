import { useFadeIn } from "@/hooks/useFadeIn";

const About = () => {
  const ref = useFadeIn();

  return (
    <section id="about" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto max-w-3xl">
        <div className="fade-up space-y-12">
          {/* Approach */}
          <div className="space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Approach</p>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              My work focuses on music as a system — something that can be modeled,
              transformed, and reimagined through computation. I build tools that bridge
              artistic intuition with data-driven structure, creating new ways to explore
              and interact with sound.
            </p>
          </div>

          {/* Current Direction */}
          <div className="border-t border-border pt-10 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Current Direction</p>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              Currently developing systems at the intersection of music technology,
              data infrastructure, and creative tooling — with a focus on scalable,
              interactive applications.
            </p>
          </div>

          {/* Education — compact */}
          <div className="border-t border-border pt-10 space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Background</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="font-display font-semibold text-sm">Berklee College of Music</p>
                <p className="text-xs text-muted-foreground mt-1">M.A. Music Production, Technology & Innovation</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">UCLA Luskin School</p>
                <p className="text-xs text-muted-foreground mt-1">Master of Public Policy</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">MIT Professional Education</p>
                <p className="text-xs text-muted-foreground mt-1">Applied Data Science Program</p>
              </div>
              <div>
                <p className="font-display font-semibold text-sm">Grinnell College</p>
                <p className="text-xs text-muted-foreground mt-1">Bachelor of Arts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
