import { useFadeIn } from "@/hooks/useFadeIn";
import { BarChart3, FileText, TrendingUp, Database } from "lucide-react";

const projects = [
  {
    title: "Public Health Policy Impact Assessment",
    description:
      "Analyzed the effectiveness of regional public health interventions using longitudinal datasets, identifying key policy levers that correlated with improved outcomes across demographics.",
    tags: ["Health Policy", "Regression Analysis", "Python"],
    icon: TrendingUp,
  },
  {
    title: "Urban Housing Policy & Affordability Modeling",
    description:
      "Built predictive models to evaluate how zoning reform and rent regulation policies affect housing affordability, using census and municipal data.",
    tags: ["Housing Policy", "Predictive Modeling", "R"],
    icon: BarChart3,
  },
  {
    title: "Education Funding Equity Analysis",
    description:
      "Conducted a comparative analysis of education funding distribution across school districts, quantifying disparities and modeling the impact of proposed legislative changes.",
    tags: ["Education Policy", "Data Visualization", "Tableau"],
    icon: FileText,
  },
  {
    title: "Environmental Regulation Compliance Dashboard",
    description:
      "Designed an interactive dashboard tracking industrial compliance with environmental regulations, surfacing trends in violations and enforcement effectiveness.",
    tags: ["Environmental Policy", "Dashboard", "SQL"],
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
            Beyond music, I apply data analysis skills to policy research —
            exploring how evidence-based approaches can inform better public
            decision-making.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <div
              key={project.title}
              className="fade-up border border-border bg-card rounded-sm p-8 space-y-4 hover:border-foreground/20 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <project.icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display font-semibold text-lg">{project.title}</h3>
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
