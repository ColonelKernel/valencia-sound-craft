import { useFadeIn } from "@/hooks/useFadeIn";
import { Globe, BarChart3, MapPin, Database } from "lucide-react";

const projects = [
  {
    title: "Results-Based Financing for Hospitals",
    org: "World Bank Group / UCLA",
    period: "2018",
    description:
      "Master's thesis prepared for the World Bank evaluating results-based financing mechanisms in Kyrgyz Republic hospitals. Applied semiparametric regression to analyze relationships between cortisol levels and subjective well-being during field missions in Peru.",
    tags: ["Health Policy", "Regression Analysis", "R", "Field Research"],
    icon: Globe,
  },
  {
    title: "USAID Education & Infrastructure Analysis",
    org: "NORC at the University of Chicago",
    period: "2020–2022",
    description:
      "Provided large-scale data analysis across USAID projects spanning education, infrastructure, child protection, and COVID-19 vaccination rates. Built automated web scraping pipelines to collect Tanzania national education datasets.",
    tags: ["Education Policy", "NLP", "Web Scraping", "Python & R"],
    icon: BarChart3,
  },
  {
    title: "Food Desert Accessibility Modeling",
    org: "NORC at the University of Chicago",
    period: "2022",
    description:
      "Developed alternative definitions of food deserts incorporating chronic medical conditions to create 'real feel distance' accessibility metrics. Applied regression modeling integrating physiological and geographic variables.",
    tags: ["Urban Policy", "GIS", "Regression Modeling", "R"],
    icon: MapPin,
  },
  {
    title: "CMS Data Strategy & Inventory",
    org: "Rios Partners",
    period: "2022–2023",
    description:
      "Spearheaded a data strategy team to identify and resolve data management challenges for CMS. Built a new internal data inventory and coordinated cross-functional teams to deliver evidence-based, implementable solutions.",
    tags: ["Data Strategy", "Health Policy", "CMS", "Consulting"],
    icon: Database,
  },
];

const DataAnalysis = () => {
  const ref = useFadeIn();

  return (
    <section id="data-analysis" className="section-padding bg-secondary" ref={ref}>
      <div className="container mx-auto">
        <div className="fade-up max-w-2xl mb-14">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
            Data &amp; Policy
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Policy Analysis &amp; Data Projects
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            With a Master of Public Policy from UCLA and experience at the World
            Bank, NORC, and Rios Partners, I bring rigorous analytical methods to
            public policy challenges — from health financing to education systems
            and urban accessibility.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <div
              key={project.title}
              className="fade-up border border-border bg-card rounded-sm p-8 space-y-4 hover:border-foreground/20 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <project.icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                <div>
                  <h3 className="font-display font-semibold text-lg leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.org} · {project.period}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs border border-border px-3 py-1 rounded-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DataAnalysis;
