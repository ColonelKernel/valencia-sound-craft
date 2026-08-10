import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { PROJECTS_JSONLD } from "@/app/routeStructuredData";
import { PROJECTS, PROJECT_SECTIONS, type Project } from "@/content/projects";
import { useFadeIn } from "@/hooks/useFadeIn";

const ProjectCard = ({ project }: { project: Project }) => (
  <article className="rounded-[1.5rem] border border-border/70 bg-card/75 p-5 flex flex-col gap-4">
    <div>
      <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.tagline}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {project.stack.map((tech) => (
        <span key={tech} className="text-xs border border-border px-2.5 py-1 rounded-full text-muted-foreground">
          {tech}
        </span>
      ))}
    </div>
    <div className="mt-auto flex flex-wrap gap-4">
      {project.links.map((link) =>
        link.url.startsWith("/") ? (
          <Link
            key={link.url}
            to={link.url}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {link.label} <ArrowUpRight size={14} />
          </Link>
        ) : (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {link.label} <ArrowUpRight size={14} />
          </a>
        ),
      )}
    </div>
  </article>
);

const ProjectsPage = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.projects.title}
        description={ROUTE_META.projects.description}
        canonicalPath={ROUTE_META.projects.path}
        jsonLd={PROJECTS_JSONLD}
      />
      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-12 max-w-2xl">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Projects</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Software I Build</h1>
              <p className="text-muted-foreground leading-relaxed">
                I build audio software for the browser: Web Audio scheduling engines, Web MIDI
                instruments that play into any DAW, and extensions that live inside Ableton.
                These are tools I built because I kept wanting them mid-session — the Groove
                Atlas, the analytics platform, the music tools. All of them come from the same
                habit: when the workflow fights you, build the thing that fights back.
              </p>
              {/* Employers in this space increasingly screen for AI-assisted
                  workflow experience by name. Stating it plainly — alongside
                  what keeps it honest — is better than leaving it implied. */}
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                This site and its tools are built in an AI-assisted, test-gated workflow:
                content invariants are enforced by the test suite, and nothing merges
                without passing typecheck, lint, unit and end-to-end runs, a bundle budget,
                and an accessibility floor. The full source is public at{" "}
                <a
                  href="https://github.com/ColonelKernel/valencia-sound-craft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  github.com/ColonelKernel/valencia-sound-craft
                </a>
                .
              </p>
            </div>

            <div className="space-y-12">
              {PROJECT_SECTIONS.map((section) => {
                const items = PROJECTS.filter((project) => project.kind === section.kind);
                if (items.length === 0) return null;
                return (
                  <div key={section.kind} className="fade-up">
                    <h2 className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
                      {section.title}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fade-up mt-14">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} /> Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProjectsPage;
