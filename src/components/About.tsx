import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useFadeIn } from "@/hooks/useFadeIn";
import { ROUTE_META } from "@/app/routeMeta";
import { CV_PROFILE } from "@/content/cv";

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
 * What is left is the part that exists nowhere else: why this particular
 * combination is rare, and what the through-line actually is. The tables are
 * one link away, which is where a reader who wants a résumé was always going
 * to go.
 *
 * The music is one clause and a link rather than a paragraph. It is real and
 * it explains the software habit, but for a government or NGO reader it is the
 * least load-bearing fact here, and it used to get equal billing with seven
 * years of commissioned public work.
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
            <h2 className="type-h1 mb-8">Seven Years of Evidence for Public Decisions</h2>

            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                Every job on this page was commissioned by someone accountable to the
                public: a development bank, a federal health agency, a foundation, a
                country strategy. I came to it through public policy rather than a
                computer-science program — an M.P.P. at UCLA in transportation and urban
                development, field research for the World Bank in Peru, computational
                social science at NORC — and I learned to build the software because the
                analysis kept needing it.
              </p>
              <p>
                That is the combination on offer. Most people who can supervise fourteen
                enumeration teams in two provinces cannot also write the scraper that
                recovers six million exam records from a portal with no bulk export, and
                most people who can write the scraper have never watched a survey
                instrument fail in the field. I have done both, for the same client, in the
                same year. There is also a music career, which is where the software
                habit came from and which is{" "}
                <Link
                  to={ROUTE_META.work.path}
                  className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  on its own page
                </Link>
                .
              </p>
              <p className="text-foreground font-medium">
                The through-line is measurement. Ridership across 201 transit systems,
                retention across six million exam records, cortisol against a
                subjective-wellbeing scale — the work is deciding what a number means
                before trusting it, and saying so when it turns out not to mean that. On
                the transit data that cost me the result I wanted, which is the version of
                this I would rather be judged on.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <Link
                to={ROUTE_META.cv.path}
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
              >
                The full path and education <ArrowRight size={14} />
              </Link>
              <a
                href={CV_PROFILE.research}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                The research dossier <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
