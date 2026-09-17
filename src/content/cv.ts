/**
 * CV / résumé — single source of truth for the /cv page, its generated PDF,
 * and the About section's timeline and education blocks.
 *
 * Curate, don't catalog: every entry here is verified against at least two
 * independent sources (résumés, LinkedIn, cover letters, the Global Pulse CE
 * paper). Add nothing that can't be traced the same way.
 *
 * Two hard rules, enforced by cv.test.ts:
 *   1. No phone number or street address — ever. The public contact channels
 *      are the site's contact form and the profiles in ARTIST_PROFILES.
 *   2. The Berklee credential is "M.M. Music Production, Technology &
 *      Innovation". Older résumés and LinkedIn say "M.A., Music Technology";
 *      that is stale and must not reappear here.
 */

import { ARTIST_PROFILES } from "./work";

/**
 * One filename for both copies of the résumé: the client-generated download on
 * /cv and the static build-time artifact at the site root. Two names for one
 * document is a drift surface. Lives here rather than in cvPdf.ts so pages can
 * link the file without pulling the PDF layout into their route chunk.
 */
export const CV_PDF_FILENAME = "Zach-Scheffler-CV.pdf";

export interface TimelineEntry {
  years: string;
  role: string;
  note: string;
}

export interface EducationEntry {
  institution: string;
  credential: string;
  location: string;
  years: string;
  detail: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

/** Headline identity. First person, matching the site's voice. */
export const CV_PROFILE = {
  name: "Zach Scheffler",
  // One canonical identity across the hero, the meta title, the JSON-LD, and
  // this PDF. The headline leads with the data work because that is both the
  // longest-running thread here (2016-2023) and the market being addressed;
  // the audio work is the differentiator and is stated as such, not demoted.
  headline: "Data Scientist & Machine Learning Engineer",
  location: "San Francisco Bay Area",
  summary:
    "Seven years of applied data work (2016\u20132023) across the World Bank, NORC at the University of Chicago, and Rios Partners, where I founded the firm's data strategy team \u2014 NLP, geospatial, and web-scraping pipelines, and the statistical modeling built on them. I didn't come up through a computer-science program; I came up through public policy and music production, and I still ship the models myself. Since 2024 the proving ground has been audio: neural models running on-device, and a real-time C++ codebase with an allocation-free audio-thread test.",
  /**
   * What I'm looking for. /cv never stated this \u2014 it listed history and left
   * the reader to infer the ask. Rendered on the page and drawn into the PDF.
   */
  target:
    "Targeting data scientist and machine-learning engineer roles \u2014 San Francisco Bay Area or remote. Also open to senior software engineering work in audio and media.",
  /** Where to reach me — the contact form or email, never a phone number. */
  contactPath: "/#contact",
  email: "zachscheffler@gmail.com",
  site: "https://zachscheffler.com",
  research: "https://research.zachscheffler.com",
  profiles: ARTIST_PROFILES,
};

/**
 * Career timeline. Also rendered by the About section, so the two can never
 * drift apart.
 */
export const CAREER_TIMELINE: TimelineEntry[] = [
  { years: "2009–2013", role: "Grinnell College", note: "B.A. — Latin ensembles, jazz and rock bands alongside coursework" },
  { years: "2013", role: "Streetcar Scandal", note: "Started producing original music" },
  // Scoped to what can be substantiated on request: the room and the calibre
  // of the work, not artist names an interviewer could ask to verify.
  { years: "2014–2015", role: "East West Studios, LA", note: "Audio engineering intern — supported major-label recording sessions" },
  { years: "2015", role: "UCLA Extension", note: "Professional Certificate in Music Production" },
  { years: "2016–2018", role: "UCLA", note: "Master of Public Policy — thesis prepared for the World Bank" },
  { years: "2016–2019", role: "World Bank", note: "Consultant — led wellbeing data-collection fieldwork across Peru" },
  { years: "2018–2023", role: "7DrumCity", note: "Mentor & workshop leader" },
  // "National scale" was doing a number's job here. The figure is his own, from
  // the 2021 NORC performance review and corroborated in it by his manager:
  // R web scrapers over the Tanzanian examinations council site, assembled to
  // map primary-to-secondary retention for USAID's country strategy.
  { years: "2020–2022", role: "NORC at the University of Chicago", note: "Research associate — wrote R scrapers that assembled 6M+ national exam records in Tanzania; NLP over social-media corpora for NIH- and Facebook-funded studies" },
  { years: "2022", role: "MIT Professional Education", note: "Applied Data Science certificate" },
  { years: "2022–2023", role: "Rios Partners", note: "Consultant — founded the firm's data strategy team" },
  { years: "2024–2025", role: "Berklee College of Music, Valencia", note: "M.M. Music Production, Technology & Innovation" },
  // The current row is the one a hiring reader looks for first, so it names a
  // role rather than a city, and points at the work that backs it.
  {
    years: "2025–present",
    role: "Independent producer & music-software developer",
    note: "Producing records and recording sessions, and building music software: the zachscheffler.com tool suite, AutoHarm, the vcv-rack-mcp C++ audio tooling, and four Ableton Live extensions (github.com/ColonelKernel)",
  },
];

/** Degrees and certificates. Rendered by both /cv and the About sidebar. */
export const EDUCATION: EducationEntry[] = [
  {
    institution: "Berklee College of Music",
    credential: "M.M. Music Production, Technology & Innovation",
    location: "Valencia, Spain",
    years: "2024–2025",
    detail:
      "Focus: music production workflows, audio technology integration, and studio systems. Mentor: Pablo Munguía.",
  },
  {
    institution: "UCLA Luskin School of Public Affairs",
    credential: "Master of Public Policy (Transportation & Urban Development)",
    location: "Los Angeles, CA",
    years: "2016–2018",
    detail:
      "Applied Policy Project (team of five) for the World Bank: Results-Based Financing for Hospitals, the Case of the Kyrgyz Republic — difference-in-differences analysis of a 64-hospital randomized trial, on quarterly panel data from 2014 to 2017.",
  },
  {
    institution: "MIT Professional Education",
    credential: "Applied Data Science Program Certificate",
    location: "Online",
    years: "2022",
    detail: "Practical applied data science training.",
  },
  {
    institution: "Grinnell College",
    credential: "B.A., Political Science & Philosophy",
    location: "Grinnell, IA",
    years: "2009–2013",
    detail:
      "Interdisciplinary coursework in economics, mathematics, and political science. Composed and performed original music.",
  },
];

/** Skills, grouped. Self-reported on the résumé and evidenced by public work. */
export const SKILLS: SkillGroup[] = [
  // Data leads because the headline does. Every item is evidenced: forecasting
  // in src/lib/linearRegression.ts, clustering in GrooveIntelligence/clustering.ts,
  // the metric layer in src/lib/catalogAnalytics.ts, and ONNX inference in
  // AutoHarm. Deliberately absent: "deep learning", "embeddings", "PyTorch" \u2014
  // this repo ships inference over checkpoints it did not train, and says so.
  {
    label: "Data science & ML",
    items: [
      "Data pipelines",
      "NLP",
      "Statistical modeling",
      "Causal inference",
      "Forecasting",
      "Clustering",
      "ONNX inference",
      "Web scraping",
    ],
  },
  // Ordered by depth of public evidence, not by market demand. C++ is second
  // rather than first because TypeScript carries more of the public tree, but
  // it is listed because vcv-rack-mcp is a real C++ codebase, not a binding:
  // plugins/RackMCP/src/{core,rackside}/ is hand-written, and tests/cpp/ holds
  // 18 suites of its own.
  {
    label: "Programming",
    items: ["TypeScript", "C++", "Python", "R", "SQL"],
  },
  // Every item here is evidenced by public source in github.com/ColonelKernel:
  // Web Audio and Web MIDI in this site's engine, Vitest/Playwright suites and
  // the GitHub Actions gate in its CI, the gzip budget in scripts/, and the
  // Lighthouse accessibility floor of 1.0 in lighthouserc.cjs. CMake and the
  // real-time discipline come from vcv-rack-mcp, whose C++ suite includes an
  // allocation-free audio-thread test and a fuzz target.
  {
    label: "Software engineering",
    items: [
      "React",
      "Web Audio API",
      "Web MIDI",
      "CMake",
      "Vitest & Playwright",
      "GitHub Actions CI",
      "Performance budgets",
      "Accessibility (WCAG)",
    ],
  },
  // "Audio engineering", not "Audio & DSP": the work here is recording, mixing,
  // and signal flow. No DSP is implemented from scratch, so it isn't claimed.
  {
    label: "Audio engineering",
    items: ["Recording", "Mixing", "Signal flow", "Max/MSP", "VCV Rack"],
  },
  {
    label: "Music technology",
    items: ["MIDI systems", "Generative composition", "Ableton Live", "Pro Tools", "Logic Pro", "REAPER"],
  },
  {
    label: "Languages",
    items: ["English (native)", "Spanish (fluent)"],
  },
];
