import { useEffect } from "react";

import Navbar from "@/components/Navbar";
import {
  caseStudies,
  education,
  profileLinks,
  researchQuestions,
  researchTrajectory,
  supportingProjects,
  type EvidenceLink,
  type ResearchCaseStudy,
} from "@/content/research";

const ExternalArrow = () => <span aria-hidden="true">↗</span>;

const LinkList = ({ links, label = "Project evidence" }: { links: EvidenceLink[]; label?: string }) => (
  <nav className="evidence-links" aria-label={label}>
    {links.map((link) => (
      <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
        <span>{link.label}</span>
        <ExternalArrow />
      </a>
    ))}
  </nav>
);

const MethodList = ({ methods }: { methods: string[] }) => (
  <ul className="method-list" aria-label="Methods and technologies">
    {methods.map((method) => (
      <li key={method}>{method}</li>
    ))}
  </ul>
);

const ResearchArchitecture = () => (
  <figure className="architecture-figure" aria-labelledby="architecture-caption">
    <div className="architecture-toolbar" aria-hidden="true">
      <span />
      <span />
      <span />
      <p>evidence / canonical state / outcomes</p>
    </div>
    <div className="architecture-stage">
      <div className="architecture-inputs" aria-hidden="true">
        {[
          ["01", "Cubase", "open interchange"],
          ["02", "Ableton Live", "runtime API"],
          ["03", "REAPER", "project file"],
          ["04", "Logic Pro", "export evidence"],
        ].map(([index, name, source]) => (
          <div className="architecture-node" key={name}>
            <span>{index}</span>
            <strong>{name}</strong>
            <small>{source}</small>
          </div>
        ))}
      </div>
      <div className="architecture-flow" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="architecture-core">
        <div className="core-orbit core-orbit--outer" aria-hidden="true" />
        <div className="core-orbit core-orbit--inner" aria-hidden="true" />
        <div className="core-label">
          <span>Canonical graph</span>
          <strong>STATE</strong>
          <small>provenance · uncertainty · routing</small>
        </div>
      </div>
      <div className="architecture-output" aria-hidden="true">
        <span>compare</span>
        <span>explain</span>
        <span>evaluate</span>
      </div>
    </div>
    <figcaption id="architecture-caption">
      A shared analytical layer keeps each observation tied to its source instead of treating every DAW as equally observable.
    </figcaption>
  </figure>
);

const MetricGrid = ({ study }: { study: ResearchCaseStudy }) => (
  <div className="metric-grid">
    {study.metrics.map((metric) => (
      <article className="metric-card" key={`${metric.value}-${metric.label}`}>
        <p className="metric-value">{metric.value}</p>
        <h4>{metric.label}</h4>
        <p>{metric.context}</p>
        <small>{metric.qualifier}</small>
      </article>
    ))}
  </div>
);

const StudyHeader = ({ study, index }: { study: ResearchCaseStudy; index: string }) => (
  <header className="study-header">
    <div>
      <p className="section-kicker">
        {index} / {study.eyebrow}
      </p>
      <h2>{study.title}</h2>
    </div>
    <div className="study-intro">
      <span className="status-pill">{study.status}</span>
      <p>{study.summary}</p>
    </div>
  </header>
);

const FlagshipStudy = ({ study }: { study: ResearchCaseStudy }) => (
  <article id="session-state" className="case-study case-study--flagship">
    <StudyHeader study={study} index="01" />

    <div className="case-overview">
      <div className="case-question">
        <p className="mini-label">Research question</p>
        <blockquote>{study.researchQuestion}</blockquote>
        <p className="role-line">
          <strong>Role</strong> {study.role}
        </p>
        <MethodList methods={study.methods} />
        <LinkList links={study.evidence} />
      </div>
      <ResearchArchitecture />
    </div>

    {study.implementations && (
      <section className="adapter-section" aria-labelledby="observation-regimes">
        <div className="subsection-heading">
          <p className="mini-label">Four observation regimes</p>
          <h3 id="observation-regimes">One model, different evidence.</h3>
        </div>
        <div className="adapter-grid">
          {study.implementations.map((implementation, index) => (
            <article className="adapter-card" key={implementation.name}>
              <span className="adapter-number">0{index + 1}</span>
              <p className="adapter-observation">{implementation.observation}</p>
              <h4>{implementation.name}</h4>
              <p>{implementation.summary}</p>
              <LinkList links={implementation.links} label={`${implementation.name} links`} />
            </article>
          ))}
        </div>
      </section>
    )}

    <section className="evidence-section" aria-labelledby="measured-evidence">
      <div className="subsection-heading">
        <p className="mini-label">Measured evidence</p>
        <h3 id="measured-evidence">Results with their boundaries intact.</h3>
      </div>
      <MetricGrid study={study} />
    </section>

    <div className="research-visual-grid">
      <figure className="research-image research-image--wide">
        <img
          src="/media/reaper-mixer.webp"
          alt="Session State Explorer mixer view showing tracks, effects, sends, warnings, and provenance-aware state"
          width="1600"
          height="900"
          loading="lazy"
        />
        <figcaption>
          REAPER evidence translated into an inspectable production-state view. Demonstration fixture; project paths removed.
        </figcaption>
      </figure>
      <figure className="research-image">
        <img
          src="/media/ableton-prediction.webp"
          alt="Ableton Session State Explorer prediction evaluation with the synthetic-data proof-of-concept banner visible"
          width="1440"
          height="813"
          loading="lazy"
        />
        <figcaption>
          Interpretable effect-chain prediction. The source interface’s synthetic-data warning is deliberately preserved.
        </figcaption>
      </figure>
    </div>

    <div className="limitation-panel">
      <div>
        <p className="mini-label">What this does not claim</p>
        <h3>Observability is part of the research result.</h3>
      </div>
      <ul>
        {study.limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>
      {study.nextStep && (
        <p className="next-step">
          <strong>Next research step</strong>
          {study.nextStep}
        </p>
      )}
    </div>
  </article>
);

const SecondaryStudy = ({ study, index }: { study: ResearchCaseStudy; index: string }) => (
  <article id={study.id} className="case-study case-study--secondary">
    <StudyHeader study={study} index={index} />
    <div className="secondary-layout">
      <div className="secondary-main">
        <p className="mini-label">Research question</p>
        <blockquote>{study.researchQuestion}</blockquote>
        {study.collaboration && <p className="collaboration-note">{study.collaboration}</p>}
        {study.implementations && (
          <div className="lineage-grid">
            {study.implementations.map((implementation) => (
              <article key={implementation.name}>
                <p className="mini-label">{implementation.observation}</p>
                <h3>{implementation.name}</h3>
                <p>{implementation.summary}</p>
                {implementation.links.length > 0 && (
                  <LinkList links={implementation.links} label={`${implementation.name} links`} />
                )}
              </article>
            ))}
          </div>
        )}
        {study.metrics.length > 0 && <MetricGrid study={study} />}
      </div>
      <aside className="secondary-aside">
        <p className="role-line">
          <strong>Role</strong> {study.role}
        </p>
        <MethodList methods={study.methods} />
        <LinkList links={study.evidence} />
        <div className="compact-limitations">
          <p className="mini-label">Limits / current status</p>
          <ul>
            {study.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
    {study.nextStep && (
      <p className="secondary-next-step">
        <span>Next</span> {study.nextStep}
      </p>
    )}
  </article>
);

const Index = () => {
  useEffect(() => {
    const scrollToHash = () => {
      if (!window.location.hash) return;
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      target?.scrollIntoView({ block: "start", behavior: "auto" });
    };

    scrollToHash();
    const animationFrame = window.requestAnimationFrame(scrollToHash);
    const timer = window.setTimeout(scrollToHash, 100);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  const sessionState = caseStudies.find((study) => study.id === "session-state");
  const improvPartner = caseStudies.find((study) => study.id === "improv-partner");
  const autoHarm = caseStudies.find((study) => study.id === "autoharm");

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <section id="top" className="hero-section">
          <div className="hero-grid page-shell">
            <div className="hero-copy">
              <p className="hero-kicker">Zach Scheffler · Research portfolio · 2026</p>
              <h1>Interpretable DAW State for Intelligent Music Production.</h1>
              <p className="hero-deck">
                I build provenance-aware systems for representing and comparing production state—audio effects,
                routing, and mixing—across Cubase, Ableton Live, REAPER, and Logic Pro, and investigate how those
                states relate to acoustic outcomes and creativity-supporting prediction.
              </p>
              <div className="hero-actions">
                <a className="button button--primary" href="#research">
                  Explore the research <span aria-hidden="true">↓</span>
                </a>
                <a className="button button--ghost" href="https://github.com/ColonelKernel" target="_blank" rel="noreferrer">
                  GitHub <ExternalArrow />
                </a>
                <a className="text-link" href="https://www.linkedin.com/in/zscheff/" target="_blank" rel="noreferrer">
                  LinkedIn <ExternalArrow />
                </a>
              </div>
            </div>
            <div className="hero-research-map" aria-label="Research program overview">
              <p className="map-label">Research program / current trajectory</p>
              <div className="map-stack">
                <div>
                  <span>01</span>
                  <strong>Represent</strong>
                  <small>production state + provenance</small>
                </div>
                <div>
                  <span>02</span>
                  <strong>Relate</strong>
                  <small>state changes + acoustic outcomes</small>
                </div>
                <div>
                  <span>03</span>
                  <strong>Predict</strong>
                  <small>interpretable, musician-controlled support</small>
                </div>
              </div>
              <p className="map-footnote">MIR · audio effects and processing · machine learning · music production</p>
            </div>
          </div>
          <div className="hero-marquee" aria-hidden="true">
            <div>
              <span>DAW STATE</span><i />
              <span>PROVENANCE</span><i />
              <span>AUDIO OUTCOMES</span><i />
              <span>HUMAN–AI MUSIC</span><i />
              <span>OPEN RESEARCH</span><i />
            </div>
          </div>
        </section>

        <section id="background" className="background-section">
          <div className="page-shell background-grid">
            <div className="portrait-frame">
              <img
                src="/media/zach-scheffler.webp"
                srcSet="/media/zach-scheffler-480.webp 480w, /media/zach-scheffler.webp 720w, /media/zach-scheffler-960.webp 960w"
                sizes="(max-width: 860px) min(480px, 100vw - 36px), 34vw"
                alt="Zach Scheffler playing guitar outdoors"
                width="720"
                height="960"
                loading="lazy"
              />
              <div className="portrait-caption">
                <span>Musician</span>
                <span>Producer</span>
                <span>Research engineer</span>
              </div>
            </div>
            <div className="background-copy">
              <p className="section-kicker">About</p>
              <h2>Zach Scheffler — musician, producer, and applied data scientist.</h2>
              <p className="background-lead">
                A path that joins music production and performance with applied data science and public-policy
                research. That mix shapes how I frame technical systems: as evidence-bearing tools used by
                people, inside institutions and creative workflows.
              </p>
              <ol className="education-list">
                {education.map((item) => (
                  <li key={`${item.year}-${item.institution}`}>
                    <time>{item.year}</time>
                    <div>
                      <h3>{item.credential}</h3>
                      <p>{item.institution}</p>
                      {item.detail && <small>{item.detail}</small>}
                      {item.link && <LinkList links={[item.link]} label={`${item.credential} link`} />}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="research" className="research-agenda page-section page-shell">
          <header className="section-intro">
            <p className="section-kicker">Research agenda</p>
            <h2>Production intelligence begins with what a system can—and cannot—observe.</h2>
            <p>
              My work connects music information retrieval, audio-effects processing, and music production practice,
              approached with a software-architecture and provenance mindset. These questions organize the portfolio
              and the proposed doctoral trajectory.
            </p>
          </header>
          <div className="question-grid">
            {researchQuestions.map((question) => (
              <article key={question.number}>
                <span>{question.number}</span>
                <h3>{question.title}</h3>
                <p>{question.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className="projects-section">
          <div className="page-shell">
            <div className="projects-intro">
              <p className="section-kicker">Selected systems</p>
              <p>Three research programs, presented with evidence, constraints, and the next question—not as a product catalog.</p>
            </div>
            {sessionState && <FlagshipStudy study={sessionState} />}
            {improvPartner && <SecondaryStudy study={improvPartner} index="02" />}
            {autoHarm && <SecondaryStudy study={autoHarm} index="03" />}
          </div>
        </section>

        <section className="supporting-section page-section page-shell" aria-labelledby="supporting-work-title">
          <div className="subsection-heading">
            <p className="section-kicker">Supporting prototypes</p>
            <h2 id="supporting-work-title">Smaller systems, specific production questions.</h2>
          </div>
          <div className="support-grid">
            {supportingProjects.map((project, index) => (
              <article key={project.title}>
                <span className="support-number">0{index + 1}</span>
                <div>
                  <span className="status-pill">{project.status}</span>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <MethodList methods={project.methods} />
                  <p className="support-caveat">{project.caveat}</p>
                  {project.link && <LinkList links={[project.link]} label={`${project.title} link`} />}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="trajectory" className="research-agenda page-section page-shell" aria-labelledby="trajectory-title">
          <header className="section-intro">
            <p className="section-kicker">Proposed research trajectory</p>
            <h2 id="trajectory-title">
              A doctoral research trajectory that extends the four observation regimes above.
            </h2>
            <p>
              Three stages that build toward a program aligned with music information retrieval, audio effects
              and processing, machine learning, and music production practice—same qualifiers, same honesty about
              observability that the systems above already carry.
            </p>
          </header>
          <div className="question-grid">
            {researchTrajectory.map((stage) => (
              <article key={stage.number}>
                <span>{stage.number}</span>
                <h3>{stage.title}</h3>
                <p>{stage.summary}</p>
                <p className="mini-label">{stage.signals.join(" · ")}</p>
                {stage.boundary && (
                  <p className="support-caveat">
                    <strong>Boundary </strong>
                    {stage.boundary}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-grid">
          <div>
            <p className="section-kicker">Open to research dialogue</p>
            <h2>DAW state, audio outcomes, and tools musicians can interrogate.</h2>
          </div>
          <nav aria-label="Profile links">
            {profileLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label} <ExternalArrow />
              </a>
            ))}
          </nav>
        </div>
        <div className="page-shell footer-bottom">
          <p>© 2026 Zach Scheffler</p>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
};

export default Index;
