import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import CaseStudyFinding from "@/components/CaseStudyFinding";
import CaseStudyFooter, { type CaseStudySlug } from "@/components/CaseStudyFooter";
import RouteHead, { type RouteStructuredData } from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * The shell all four case studies were writing out by hand.
 *
 * Each page repeated the same ten imports and the same forty-odd lines:
 * min-h-screen wrapper with a fade ref, RouteHead from ROUTE_META, main.pt-16,
 * a back-link, the "Case study" eyebrow, the h1, the lede, a pair of buttons,
 * the at-a-glance <dl>, the sections, and CaseStudyFooter.
 *
 * It had already drifted, which is the argument for this existing at all.
 * AutoHarm differed from the other three in three separate ways and none of
 * them were decisions:
 *
 *   - its <dl> was a two-column grid where the others were divide-y
 *   - its back-link said "Projects" at size 16 where the others said
 *     "All projects" at 14, and its header spacing used mt-* where the others
 *     used mb-*
 *   - its external links carried target="_blank" rel="noopener noreferrer"
 *     and the other three carried none, so the same kind of link opened two
 *     different ways depending on which page you were reading
 *
 * The majority form wins on the first two. On the third the minority is
 * correct — an external link should say so — so all four now open in a new tab
 * with the rel that makes that safe, and in-app routes stay client-side
 * <Link>s. A trailing slash or a leading "/" is the whole test.
 */

export interface CaseStudyAction {
  label: string;
  /** An absolute https URL, or an in-app route beginning with "/". */
  href: string;
}

export interface CaseStudyLayoutProps {
  /** Drives RouteHead and the canonical path straight from the route table. */
  slug: CaseStudySlug;
  jsonLd: RouteStructuredData;
  title: string;
  lede: ReactNode;
  /** First is primary, the rest secondary. Two is the established shape. */
  actions: CaseStudyAction[];
  /** Three or four lines: what I did, what came back, what it cost. */
  finding: ReactNode;
  glance: Array<{ label: string; value: string }>;
  /** The body sections, in a max-w-2xl column. */
  children: ReactNode;
}

const isInApp = (href: string) => href.startsWith("/");

const CaseStudyLayout = ({
  slug,
  jsonLd,
  title,
  lede,
  actions,
  finding,
  glance,
  children,
}: CaseStudyLayoutProps) => {
  const ref = useFadeIn();
  const meta = ROUTE_META[slug];

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.path}
        jsonLd={jsonLd}
      />

      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-10">
              <Link
                to={ROUTE_META.projects.path}
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={14} /> All projects
              </Link>

              <p className="eyebrow mb-3">Case study</p>
              <h1 className="type-h1 mb-5">{title}</h1>

              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{lede}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                {actions.map((action, index) => {
                  const className = buttonClasses({
                    variant: index === 0 ? "primary" : "secondary",
                  });

                  return isInApp(action.href) ? (
                    <Link key={action.href} to={action.href} className={className}>
                      {action.label} <ArrowUpRight size={15} />
                    </Link>
                  ) : (
                    <a
                      key={action.href}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {action.label} <ArrowUpRight size={15} />
                    </a>
                  );
                })}
              </div>
            </div>

            <CaseStudyFinding>{finding}</CaseStudyFinding>

            <dl
              className={cardClasses(
                { padding: "none", flush: true },
                "fade-up mb-16 divide-y divide-border",
              )}
            >
              {glance.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6"
                >
                  <dt className="text-sm font-medium text-foreground">{row.label}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="fade-up max-w-2xl space-y-12">{children}</div>

            <CaseStudyFooter current={slug} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default CaseStudyLayout;
