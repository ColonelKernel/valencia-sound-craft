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
  // this PDF. "Data Scientist" moved into the summary, where it can be stated
  // as dated, checkable history instead of a current job title.
  headline: "Music Producer & Creative Technologist",
  location: "Valencia, Spain",
  summary:
    "I didn't come up through a conservatory or a computer-science program — I came up through music production and public policy. I've been producing since 2013, spent seven years in applied data work (2016–2023) across the World Bank, NORC, and Rios Partners, and now build software where music, data, and audio meet.",
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
  { years: "2020–2022", role: "NORC at the University of Chicago", note: "Research associate — NLP, GIS, and web-scraping at national scale" },
  { years: "2022", role: "MIT Professional Education", note: "Applied Data Science certificate" },
  { years: "2022–2023", role: "Rios Partners", note: "Consultant — founded the firm's data strategy team" },
  { years: "2024–2025", role: "Berklee College of Music, Valencia", note: "M.M. Music Production, Technology & Innovation" },
  { years: "2025–present", role: "Valencia, Spain", note: "Producing records, recording sessions, and building music software" },
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
      "Thesis: Results-Based Financing for Hospitals — The Case of the Kyrgyz Republic (prepared for the World Bank).",
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
  {
    label: "Music technology",
    items: ["MIDI systems", "Generative composition", "Ableton Live", "Pro Tools", "Logic Pro", "REAPER"],
  },
  {
    label: "Programming",
    items: ["TypeScript", "Python", "R", "SQL"],
  },
  {
    label: "Audio & DSP",
    items: ["Recording", "Mixing", "Signal flow", "Max/MSP", "VCV Rack"],
  },
  {
    label: "Data systems",
    items: ["Data pipelines", "NLP", "Web scraping", "Statistical modeling"],
  },
  {
    label: "Languages",
    items: ["English (native)", "Spanish (fluent)"],
  },
];
