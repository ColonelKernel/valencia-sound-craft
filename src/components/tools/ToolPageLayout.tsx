import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import RouteHead, { type RouteMetaConfig } from "@/components/seo/RouteHead";
import ToolSubnav from "@/components/tools/ToolSubnav";

interface ToolPageLayoutProps {
  meta: RouteMetaConfig;
  eyebrow: string;
  title: string;
  description: string;
  summary: ReactNode;
  children: ReactNode;
}

const ToolPageLayout = ({
  meta,
  eyebrow,
  title,
  description,
  summary,
  children,
}: ToolPageLayoutProps) => (
  <>
    <RouteHead {...meta} />
    <main className="min-h-screen bg-background pt-24">
      <section className="border-b border-border/70 bg-secondary/30 px-6 py-10">
        <div className="container mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link to="/tools" className="hover:text-foreground">
              Tools
            </Link>
            <span>/</span>
            <span className="text-foreground">{title}</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
            <div className="max-w-4xl space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                {description}
              </p>
            </div>
          </div>

          <ToolSubnav />
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="container mx-auto">
          <article className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5 text-sm leading-7 text-muted-foreground shadow-[0_20px_50px_-40px_rgba(0,0,0,0.75)]">
            {summary}
          </article>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="container mx-auto">{children}</div>
      </section>
    </main>
  </>
);

export default ToolPageLayout;

