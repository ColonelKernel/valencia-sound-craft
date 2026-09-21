import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useFadeIn } from "@/hooks/useFadeIn";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * The narrative section, and deliberately only the narrative.
 *
 * This used to re-render EDUCATION and CAREER_TIMELINE — the same two arrays
 * /cv maps — so a reader who saw both pages read the whole résumé twice, and
 * the homepage carried a second copy of a table that already had a page of
 * its own. It also restated CV_PROFILE.summary, the Global Pulse description
 * from work.ts, and the Streetcar Scandal blurb from work.ts, each of which
 * renders elsewhere on this same page or one click away.
 *
 * What is left is the part that exists nowhere else: why the two halves of
 * this background belong together, and what the through-line actually is.
 * The tables are one link away, which is where a reader who wants a résumé
 * was always going to go.
 */
const About = () => {
  const ref = useFadeIn();

  return (
    <section id="about" className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto">
        {/* Single column now. The right-hand card repeated the location and
            the availability line, both of which the hero states at the top of
            this same page — the homepage said "Bay Area" four times and "open
            to roles" three. The hero keeps them; the footer keeps the city. */}
        <div className="max-w-2xl">
          <div className="fade-up">
            <p className="eyebrow mb-3">About</p>
            <h2 className="type-h1 mb-8">From Policy Data to Production Systems</h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                I came up through public policy and music production rather than a
                computer-science program — an M.P.P. at UCLA, field research for the World
                Bank in Peru, computational social science at NORC — while producing records
                the whole way through.
              </p>
              <p>
                In 2024 I moved to Valencia for an M.M. at Berklee. That is where the two
                halves stopped being separate: I produce records the way I build software,
                iteratively and under version control, and I build models the way I mix — by
                listening to what the thing actually does.
              </p>
              <p className="text-foreground font-medium">
                The through-line is measurement. Retention across six million exam records,
                ridership across 201 transit systems, the latency budget of an audio
                callback — the work is deciding what a number means before trusting it, and
                saying so when it turns out not to mean that.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <Link
                to={ROUTE_META.cv.path}
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
              >
                The full path and education <ArrowRight size={14} />
              </Link>
              <Link
                to={ROUTE_META.work.path}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                The music
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
