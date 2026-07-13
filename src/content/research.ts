export type EvidenceLinkKind = "repository" | "demo" | "publication" | "context";

export interface EvidenceLink {
  label: string;
  href: string;
  kind: EvidenceLinkKind;
}

export interface QualifiedMetric {
  value: string;
  label: string;
  context: string;
  qualifier: string;
}

export interface ResearchImplementation {
  name: string;
  observation: string;
  summary: string;
  links: EvidenceLink[];
}

export interface ResearchCaseStudy {
  id: "session-state" | "improv-partner" | "autoharm";
  eyebrow: string;
  title: string;
  summary: string;
  status: string;
  role: string;
  researchQuestion: string;
  methods: string[];
  metrics: QualifiedMetric[];
  evidence: EvidenceLink[];
  limitations: string[];
  nextStep?: string;
  collaboration?: string;
  implementations?: ResearchImplementation[];
}

export interface SupportingProject {
  title: string;
  status: string;
  summary: string;
  methods: string[];
  link?: EvidenceLink;
  caveat: string;
}

export interface ResearchQuestion {
  number: string;
  title: string;
  description: string;
}

export interface ResearchTrajectoryStage {
  number: string;
  title: string;
  summary: string;
  signals: string[];
  boundary?: string;
}

export interface EducationEntry {
  year: string;
  institution: string;
  credential: string;
  detail?: string;
  link?: EvidenceLink;
}

export interface ProfileLink {
  label: string;
  href: string;
}

export const researchQuestions: ResearchQuestion[] = [
  {
    number: "01",
    title: "Representing production state",
    description:
      "How can a system describe tracks, routing, devices, parameters, and musical structure while preserving what was observed, inferred, or hidden?",
  },
  {
    number: "02",
    title: "Connecting state to sound",
    description:
      "Which production-state features explain measurable acoustic outcomes, and which relationships remain specific to a DAW, plug-in, or session?",
  },
  {
    number: "03",
    title: "Supporting creative prediction",
    description:
      "How can interpretable predictions offer useful next actions while keeping musicians in control of musical intent and revision?",
  },
];

export const researchTrajectory: ResearchTrajectoryStage[] = [
  {
    number: "01",
    title: "A consented, cross-DAW corpus with aligned renders",
    summary:
      "Extend the adapter platform into a small, ethically sourced dataset that pairs session state and rendered audio across the four DAWs. Publish the schema, the adapter bundles, and a provenance-aware alignment protocol so the dataset can be audited and reused rather than trusted on assertion.",
    signals: [
      "Consent-first collection with contributor-visible provenance",
      "Adapter-conditioned observation regimes preserved end to end",
      "Open schema, adapter bundles, and evaluation splits",
    ],
    boundary:
      "Not a large-scale scrape and not a leaderboard benchmark—a small, honest, reproducible corpus that the field can inspect.",
  },
  {
    number: "02",
    title: "State-to-audio relationships that survive the plug-in boundary",
    summary:
      "Study which production-state features explain measurable acoustic outcomes across sessions, and which relationships remain specific to a DAW, plug-in, or session. Report DAW-dependent and DAW-independent effects with their observation-regime caveats intact instead of aggregating them away.",
    signals: [
      "Controlled A/B interventions on effect parameters and routing",
      "Perceptual and non-perceptual acoustic outcome measurement",
      "Cross-adapter analysis with uncertainty preserved",
    ],
    boundary:
      "Not a claim that any single mapping generalizes across plug-in versions or listening contexts without measurement.",
  },
  {
    number: "03",
    title: "Interpretable, editable predictions inside real workflows",
    summary:
      "Move from synthetic proofs of concept to creativity-supporting prediction that a musician can inspect, edit, and reject inside a real DAW session. Evaluate the interaction with practicing producers, not only with symbolic benchmarks, and treat control as the constraint on the design of every suggestion.",
    signals: [
      "Prediction interfaces with per-suggestion explanations",
      "Musician-facing evaluation alongside symbolic metrics",
      "Real-time controllability as a first-class success criterion",
    ],
    boundary:
      "Not an automatic mixing tool. The musician remains the author; the system is a collaborator that must be interruptible and reversible.",
  },
];

const sessionAnalyzerLink: EvidenceLink = {
  label: "Session State Analyzer repository",
  href: "https://github.com/ColonelKernel/session-state-analyzer",
  kind: "repository",
};

const cubaseAdapterLink: EvidenceLink = {
  label: "Cubase adapter repository",
  href: "https://github.com/ColonelKernel/CubaseSessionStateExplorer",
  kind: "repository",
};

const abletonAdapterLink: EvidenceLink = {
  label: "Ableton adapter repository",
  href: "https://github.com/ColonelKernel/AbletonSessionStateExplorer",
  kind: "repository",
};

const reaperAdapterLink: EvidenceLink = {
  label: "REAPER adapter repository",
  href: "https://github.com/ColonelKernel/session-state-explorer",
  kind: "repository",
};

const logicAdapterLink: EvidenceLink = {
  label: "Logic adapter repository",
  href: "https://github.com/ColonelKernel/LogicSessionStateExplorer",
  kind: "repository",
};

const sessionStateEvidence: EvidenceLink[] = [
  sessionAnalyzerLink,
  cubaseAdapterLink,
  abletonAdapterLink,
  reaperAdapterLink,
  logicAdapterLink,
];

export const caseStudies: ResearchCaseStudy[] = [
  {
    id: "session-state",
    eyebrow: "Flagship research program",
    title: "Session State Analyzer",
    summary:
      "A cross-DAW research platform that consumes evidence bundles from DAW-specific adapters and normalizes them into a canonical, provenance-aware state graph. The central analyzer does not claim to parse every proprietary session format directly.",
    status: "Active research platform",
    role: "Independent researcher and developer",
    researchQuestion:
      "Can heterogeneous DAW evidence be represented with enough provenance and uncertainty to support comparison, state-to-audio analysis, and eventually useful prediction?",
    methods: [
      "Typed Python evidence models with Pydantic",
      "Provenance-aware graphs with NetworkX",
      "Feature and descriptor analysis with pandas and NumPy",
      "Guided and expert inspection views in Streamlit",
      "Observed, inferred, and hidden-state labels instead of false precision",
    ],
    metrics: [
      {
        value: "≈0.62",
        label: "Ableton hit@1",
        context:
          "State-retrieval evaluation in a controlled, seeded synthetic world built to exercise the Ableton adapter and prediction interface.",
        qualifier:
          "This is a synthetic proof of concept, not performance on naturally occurring Ableton sessions or a cross-DAW benchmark.",
      },
      {
        value: "≈0.95",
        label: "Ableton hit@3",
        context:
          "Top-three state retrieval in the same controlled, seeded synthetic-world evaluation.",
        qualifier:
          "The result demonstrates pipeline behavior under known conditions; it does not establish real-session generalization.",
      },
      {
        value: "99.3%",
        label: "Logic vocabulary coverage",
        context:
          "In-sample coverage of the export-derived vocabulary used by the Logic evidence workflow.",
        qualifier:
          "This is vocabulary coverage within the evaluated exports, not `.logicx` parsing accuracy or out-of-sample performance.",
      },
    ],
    evidence: sessionStateEvidence,
    limitations: [
      "Controlled state-to-audio fixtures exist, but a validated cross-DAW state predictor has not yet been trained.",
      "Cubase `.cpr` files and third-party VST3 internal state remain partially opaque, so the system records uncertainty rather than inventing values.",
      "REAPER mix-review suggestions are transparent heuristics, not learned recommendations or evidence of perceptual quality.",
      "The four adapters expose different levels of detail; comparison must retain each observation regime instead of treating missing data as equivalent state.",
    ],
    nextStep:
      "Build a consented multi-DAW corpus with aligned renders and state evidence, then evaluate which representations predict acoustic outcomes across sessions without obscuring adapter-specific uncertainty.",
    implementations: [
      {
        name: "Cubase Session State Explorer",
        observation: "Open interchange",
        summary:
          "Combines DAWproject, Track Archive XML, MIDI, runtime observations, and conservative `.cpr` evidence. Proprietary and plug-in state that cannot be verified stays explicitly opaque.",
        links: [cubaseAdapterLink],
      },
      {
        name: "Ableton Session State Explorer",
        observation: "Runtime API",
        summary:
          "Observes tracks, clips, scenes, devices, racks, sends, returns, and the master channel through Live-facing interfaces, then supports graphs, diffs, fingerprints, and descriptors.",
        links: [abletonAdapterLink],
      },
      {
        name: "REAPER Session State Explorer",
        observation: "Transparent project file",
        summary:
          "Parses accessible `.rpp` structure into project graphs and descriptors. Its evidence-backed mix review makes each rule inspectable, but those recommendations remain heuristic.",
        links: [reaperAdapterLink],
      },
      {
        name: "Logic Session Evidence Explorer",
        observation: "Export-derived evidence",
        summary:
          "Reconciles MusicXML, MIDI, stems, and other exports while distinguishing observed, inferred, and hidden state. It does not parse the proprietary `.logicx` session format.",
        links: [logicAdapterLink],
      },
    ],
  },
  {
    id: "improv-partner",
    eyebrow: "Collaborative prototype and continuation",
    title: "Improspira / Improv Partner",
    summary:
      "A musician-centered harmonic co-improvisation project developed across three stages: a rapid, DAW-connected prototype built by a three-person team during MTG's five-day workshop; a mature Max for Live “harmonic pedal” that listens to a full guitar phrase and answers in kind, adding a corpus-trained next-chord model with held-out symbolic evaluation; and an in-progress TypeScript consolidation that unifies the lineage behind one tested engine with real-time audio perception.",
    status: "Research prototype",
    role:
      "Musician and technical collaborator in the workshop team; subsequent prototype development",
    researchQuestion:
      "Can a harmonic partner propose contextually plausible continuations quickly enough to remain editable, interruptible, and useful inside a musician's workflow?",
    methods: [
      "Phrase-latched turn-taking: listen to a full phrase, answer at the next boundary",
      "Melody-conditioned Markov next-chord model over a 2,076-song corpus in key-normalized space",
      "Inspectable Markov baseline with RNN/LSTM alternatives explored across browser and Max runtimes",
      "JavaScript engine, Max for Live, Ableton Live API, MIDI, and OSC",
      "Real-time audio perception—pitch, chroma, and chord detection—in the TypeScript consolidation",
      "Held-out symbolic next-chord evaluation with deterministic, headless test suites",
    ],
    metrics: [
      {
        value: "112",
        label: "Held-out songs",
        context:
          "Evaluation corpus used by the later Improv Partner continuation, after the five-day workshop prototype.",
        qualifier:
          "This figure describes the later symbolic benchmark, not the workshop prototype and not a study with performing musicians.",
      },
      {
        value: "8,547",
        label: "Held-out transitions",
        context:
          "Chord transitions evaluated in the later continuation's held-out benchmark.",
        qualifier:
          "The benchmark evaluates symbolic next-chord prediction; it does not measure latency, listening behavior, or musical usefulness in Ableton Live.",
      },
      {
        value: "0.363 vs 0.163",
        label: "Top-1 transition accuracy",
        context:
          "Later-continuation held-out result compared with its benchmark baseline.",
        qualifier:
          "This result is separate from the workshop deliverable and is not evidence from a real-instrument session, user study, or Live-runtime evaluation.",
      },
    ],
    evidence: [
      {
        label: "MTG Generative Music AI Workshop",
        href: "https://www.upf.edu/web/mtg/generative-music-ai-workshop",
        kind: "context",
      },
    ],
    limitations: [
      "Real-instrument evaluation, studies with musicians, and end-to-end Ableton Live runtime validation remain pending.",
      "The current evaluation concerns symbolic transitions and synthesized acceptance, not reactive listening to a live performer.",
      "Workshop materials describe inconsistent dataset provenance and chord-vocabulary counts, so those details are not presented as validated findings here.",
    ],
    nextStep:
      "Evaluate latency, controllability, and perceived usefulness with live instruments and musicians, while comparing interpretable baselines with learned alternatives.",
    collaboration:
      "The workshop prototype was co-created by Julián Cubillos, Santi Scalzadonna, and Zach Scheffler. Zach contributed as a musician and technical collaborator; the workshop is presented as project provenance, not as an individually authored or validated research result.",
    implementations: [
      {
        name: "Improspira workshop prototype",
        observation: "Five-day collaborative prototype",
        summary:
          "A three-person DAW-connected harmonic-generation prototype that explored Markov, RNN, and LSTM approaches and pivoted toward an editable functional-chord generator.",
        links: [
          {
            label: "Workshop context",
            href: "https://www.upf.edu/web/mtg/generative-music-ai-workshop",
            kind: "context",
          },
        ],
      },
      {
        name: "Improspira harmonic pedal",
        observation: "Phrase-memory performance system",
        summary:
          "A Max for Live device for live guitar that captures one complete phrase and answers with a generated progression of the same length, evolving only at phrase boundaries. Its PREDICT mode adds a melody-conditioned Markov next-chord model—the source of the held-out benchmark below—behind four performance controls, exercised by deterministic headless test suites.",
        links: [],
      },
      {
        name: "Improv Partner consolidation",
        observation: "Dual-surface engine (in progress)",
        summary:
          "An in-progress TypeScript rebuild that unifies the lineage behind one shared, tested musical engine feeding both a browser and a Max surface, with a real-time audio-perception layer for pitch, chroma, and chord detection. Cross-surface response, latency, and musician-facing validation remain future work.",
        links: [],
      },
    ],
  },
  {
    id: "autoharm",
    eyebrow: "Interactive harmony systems",
    title: "AutoHarm / Autoharmonizer",
    summary:
      "A browser-and-Max lineage for generating, editing, auditioning, and exporting harmonic material while preserving direct musician control. The systems integrate an inspectable Markov approach and pretrained JazzNet RNN/LSTM models through ONNX and PyTorch.",
    status: "Public interactive and performance prototypes",
    role: "Developer and musical-interaction designer across the browser and Max integrations",
    researchQuestion:
      "How can multiple harmonic-generation approaches share an editable interface that lets a musician compare, revise, perform, and export suggestions?",
    methods: [
      "Editable chord progressions and explainable generation controls",
      "Web MIDI and MIDI-file export",
      "Markov generation as an inspectable baseline",
      "Pretrained JazzNet RNN/LSTM inference through ONNX and PyTorch",
      "React, TypeScript, Max for Live, Node for Max, and Python",
    ],
    metrics: [],
    evidence: [
      {
        label: "Open AutoHarm Web",
        href: "https://colonelkernel.github.io/AutoHarm-Web/",
        kind: "demo",
      },
      {
        label: "AutoHarm Web repository",
        href: "https://github.com/ColonelKernel/AutoHarm-Web",
        kind: "repository",
      },
      {
        label: "Autoharmonizer repository",
        href: "https://github.com/ColonelKernel/Autoharmonizer",
        kind: "repository",
      },
    ],
    limitations: [
      "The project integrates pretrained JazzNet models; it does not claim original authorship or novel training of those models.",
      "AutoHarm generates harmonic material and does not predict DAW production state.",
      "The public interaction demonstrates workflow integration, not comparative musical-quality results or a completed user study.",
    ],
    nextStep:
      "Compare model families through reproducible musical tasks and evaluate whether explanation, revision, and export controls improve creative usefulness for musicians.",
    collaboration:
      "This case study consolidates the FinalMaxUPF, UPF Autoharmonizer Maxpatch, autoharmonizer-max, and AutoHarm Web lineages. Pretrained JazzNet work is credited as upstream; the contribution claimed here is interaction and runtime integration.",
    implementations: [
      {
        name: "AutoHarm Web",
        observation: "Browser instrument",
        summary:
          "A public Generate/Respond/Perform interface with editable progressions, presets, explanations, audition controls, Web MIDI, and export.",
        links: [
          {
            label: "Open demo",
            href: "https://colonelkernel.github.io/AutoHarm-Web/",
            kind: "demo",
          },
          {
            label: "View repository",
            href: "https://github.com/ColonelKernel/AutoHarm-Web",
            kind: "repository",
          },
        ],
      },
      {
        name: "Autoharmonizer",
        observation: "Max for Live performance lineage",
        summary:
          "Brings the same harmonic brain into Max for Live: a four-corpus, key-normalized Markov blend alongside pretrained JazzNet RNN/LSTM models, served through a Python OSC engine with a Node for Max bridge, plus ONNX devices that run generation inside Max with verified torch-to-ONNX parity.",
        links: [
          {
            label: "View repository",
            href: "https://github.com/ColonelKernel/Autoharmonizer",
            kind: "repository",
          },
        ],
      },
    ],
  },
];

export const supportingProjects: SupportingProject[] = [
  {
    title: "HarmonySingerMax",
    status: "Performance prototype",
    summary:
      "A Max for Live prototype connecting real-time vocal-harmony processing with a musician-facing Ableton workflow.",
    methods: ["Max for Live", "Ableton Live", "TypeScript", "Python"],
    caveat:
      "Structural integration has been checked, but listening evaluation, latency measurement, and validation with real guitar input remain pending.",
  },
  {
    title: "AutoHarm Studio",
    status: "Local beta",
    summary:
      "A locally tested TypeScript SDK for integrating harmonic-generation controls into an Ableton-oriented production workflow.",
    methods: ["TypeScript", "Ableton Extensions SDK", "Vitest"],
    caveat:
      "The automated suite covers the local SDK, but the manual Ableton Live checklist is incomplete and there is no public release or repository link.",
  },
  {
    title: "Arrangement Architect",
    status: "Public production utility",
    summary:
      "A deterministic tool for inspecting and shaping arrangement state inside an Ableton-oriented workflow.",
    methods: ["TypeScript", "Ableton Extensions SDK", "Node.js"],
    link: {
      label: "View repository",
      href: "https://github.com/ColonelKernel/ArrangementArchitect",
      kind: "repository",
    },
    caveat:
      "Arrangement Architect is rule-based and deterministic; it is not presented as an AI or machine-learning system.",
  },
];

export const education: EducationEntry[] = [
  {
    year: "2025",
    institution: "Berklee College of Music",
    credential: "Master of Music in Music Production, Technology and Innovation",
    detail:
      "Global Pulse, a five-track thesis/capstone combining field recording, synthesis, production experimentation, collaboration, and iterative revision.",
    link: {
      label: "Global Pulse — Berklee record",
      href: "https://remix.berklee.edu/graduate-studies-production-technology/433/",
      kind: "publication",
    },
  },
  {
    year: "2022",
    institution: "MIT Professional Education",
    credential: "Applied Data Science Program",
  },
  {
    year: "2018",
    institution: "UCLA Luskin School of Public Affairs",
    credential: "Master of Public Policy",
  },
  {
    year: "2013",
    institution: "Grinnell College",
    credential: "Bachelor of Arts in Political Science and Philosophy",
  },
];

export const backgroundSummary =
  "My background joins music production and performance with applied data science and public-policy research, bringing both technical and human-context methods to questions about creative AI.";

export const profileLinks: ProfileLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/ColonelKernel",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zscheff/",
  },
];
