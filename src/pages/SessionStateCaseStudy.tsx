import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import CaseStudyFinding from "@/components/CaseStudyFinding";
import CaseStudyFooter from "@/components/CaseStudyFooter";
import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { SESSION_STATE_JSONLD } from "@/app/routeStructuredData";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * Case study for the session-state analyzer — the Python side of the
 * portfolio, and the only artifact here with a per-class evaluation table
 * behind it.
 *
 * Every figure is checked against the repository it describes: the evidence
 * vocabulary and ten domains against src/session_explorer/atlas/, the ladder
 * against docs/COMPATIBILITY_LADDER.md (a generated file), the classifier
 * numbers against docs/evaluation.md, and the test count by running the suite
 * rather than by reading a badge.
 *
 * The in-sample caveat on the 99.3% is not a hedge I added for tone. It is
 * written in the source itself, at the top of core/roles.py, and repeating it
 * here is the whole reason the number is worth quoting.
 */

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: "Scope", value: "Four DAW adapters — Ableton Live, REAPER, Logic Pro, Cubase — behind one canonical schema" },
  { label: "Methods", value: "Per-value evidence tagging, a ten-domain observability atlas, explainable cross-DAW alignment, a controlled state→audio intervention" },
  { label: "Stack", value: "Python 3.10+, pydantic, networkx, numpy, pandas; Streamlit for the workbench; librosa and pyloudnorm for offline audio descriptors" },
  { label: "Verified", value: "586 tests passing, 2 skipped, run against the checkout this page describes" },
];

const SessionStateCaseStudy = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.sessionState.title}
        description={ROUTE_META.sessionState.description}
        canonicalPath={ROUTE_META.sessionState.path}
        jsonLd={SESSION_STATE_JSONLD}
      />

      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-10">
              <Link
                to="/projects"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={14} /> All projects
              </Link>

              <p className="eyebrow mb-3">Case study</p>
              <h1 className="type-h1 mb-5">Session-State Analyzer</h1>

              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                A music session is a structured record of thousands of decisions — tracks,
                routing, processing, automation — and almost every dataset in music
                information retrieval throws it away and keeps only the rendered audio. This
                project represents the session instead, in one form that four different DAWs
                can be read into, and then measures how much of it each DAW is actually
                willing to tell you.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://github.com/ColonelKernel/session-state-analyzer"
                  className={buttonClasses({ variant: "primary" })}
                >
                  Source <ArrowUpRight size={15} />
                </a>
                <a
                  href="https://session-state-analyzer-n2lj2kmjjijdzta7oarpyt.streamlit.app/"
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Live workbench <ArrowUpRight size={15} />
                </a>
              </div>

              {/* A recruiter who clicks a dead demo learns something worse than
                  nothing. Free Streamlit hosting sleeps on idle, so the link
                  says what to expect instead of pretending it is always warm. */}
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                The workbench is on Streamlit&rsquo;s free tier, which sleeps when idle. If it
                greets you with a wake-up prompt, it takes about a minute to come back.
              </p>
            </div>

            <CaseStudyFinding>
              <p>
                MIR datasets keep the rendered audio and throw away the session that produced
                it. I built the missing half: one canonical schema for a music session, with
                four DAW adapters behind it, and a role classifier over the tracks.
              </p>
              <p>
                The classifier reaches{" "}
                <strong>99.3% over 6,467 weighted instances</strong> — and that number is
                smaller than it looks. Some keywords in the taxonomy were added{" "}
                <em>because</em> benchmarking exposed them as misses on this same corpus,
                which makes it in-sample vocabulary coverage, not held-out generalization.
              </p>
              <p>
                It is reported with that sentence attached, here and in the source file&rsquo;s
                own header. The calibration table is published for the same reason: the 0.20
                confidence bucket is right 92.5% of the time, which is not low confidence, it
                is badly calibrated confidence.
              </p>
            </CaseStudyFinding>

            <dl className={cardClasses({ padding: "none", flush: true }, "fade-up mb-16 divide-y divide-border")}>
              {AT_A_GLANCE.map((row) => (
                <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-foreground">{row.label}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="fade-up max-w-2xl space-y-12">
              <div>
                <h2 className="type-h2 mb-4">Partial observability as a value, not a gap</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The obvious way to build this is a schema with nullable fields, where a
                    DAW that will not expose its automation curves simply produces nulls. That
                    design destroys the most interesting information in the problem, because
                    it cannot distinguish <em>the DAW hides this</em> from{" "}
                    <em>this session does not have one</em> from{" "}
                    <em>I reconstructed this from a stem and could be wrong</em>.
                  </p>
                  <p>
                    So every value in a snapshot carries an evidence tag:{" "}
                    <strong className="text-foreground">observed</strong> (read from the
                    project file), <strong className="text-foreground">inferred</strong>{" "}
                    (reconstructed from exported audio, MIDI or notes),{" "}
                    <strong className="text-foreground">annotated</strong> (supplied by a
                    person), <strong className="text-foreground">hidden</strong> (exists, but
                    the DAW will not expose it), and{" "}
                    <strong className="text-foreground">unsupported</strong> (the mechanism
                    does not exist in this DAW at all). Partial observability stops being an
                    absence and becomes a queryable fact.
                  </p>
                  <p>
                    That single decision is what makes the rest possible. You cannot compare
                    two DAWs honestly until missing-because-hidden and missing-because-absent
                    are different values, and you cannot report a coverage figure that means
                    anything until the denominator knows the difference.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">The atlas, and the refusal to produce a score</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The observability atlas rolls the evidence tags up across ten domains —
                    structure, timeline, routing, processing, parameters, automation,
                    modulation, musical content, native features, audio outcome — for all four
                    DAWs at once. The DAWs land in genuinely different places. REAPER&rsquo;s
                    project file is plain text and reads almost entirely as{" "}
                    <em>observed</em>; Logic&rsquo;s is opaque, so most of its state is{" "}
                    <em>inferred</em> from exported stems, MIDI, MusicXML and channel-strip
                    notes, and everything unrecoverable is marked <em>hidden</em> rather than
                    quietly dropped.
                  </p>
                  <p>
                    The temptation here is a single number per DAW, and it would be wrong. A
                    session&rsquo;s profile is shaped, not ranked. The compatibility ladder
                    records rungs — loadable, structural, signal-flow, temporal, behavioral,
                    acoustic-outcome-linked, controlled intervention — as a{" "}
                    <strong className="text-foreground">reached set, never a rank</strong>, and
                    real profiles come out non-contiguous. The Logic bundle reaches the
                    acoustic-outcome rung while never reaching signal-flow, because its
                    routing survives as annotations rather than as materialized edges. Any
                    headline number that calls that a lower score has thrown away the finding.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">A classifier, and why its accuracy is smaller than it looks</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Reconstructing a Logic session from its stems needs a guess at what each
                    file is, so filenames are classified into track roles — vocal, drums, bass,
                    keys, bus, mixdown and so on. It is deliberately not a learned model: it is
                    token matching with an ordered first-match rule, and every result carries a
                    confidence and a human-readable reason, because a reconstruction a producer
                    cannot argue with is worse than no reconstruction.
                  </p>
                  <p>
                    Benchmarked against MedleyDB&rsquo;s instrument labels plus a curated set
                    of decorated export names, it reaches{" "}
                    <strong className="text-foreground">99.3% over 6,467 weighted instances</strong>,
                    with per-role precision, recall and F1 reported for all twelve roles.
                    Labels the taxonomy has no bucket for are scored as correct only when the
                    classifier abstains — on that vocabulary, saying <em>Unknown</em> is the
                    right answer and is measured as such.
                  </p>
                  <p>
                    And here is the part that matters more than the number. Some keywords in
                    the taxonomy were added <em>because</em> benchmarking exposed them as
                    misses on this same corpus. That makes 99.3% a measure of in-sample
                    vocabulary coverage, not of held-out generalization, and the source file
                    says so in its own header. Quoting the figure without that sentence would
                    be the kind of thing that survives a résumé and does not survive an
                    interview.
                  </p>
                  <p>
                    The calibration table says something similar. Predictions emitted at 0.75
                    confidence are right 99.9% of the time and predictions at 0.85 are right
                    100% of the time — but the 0.20 bucket is right 92.5% of the time, which
                    is not low confidence, it is badly calibrated confidence. The numbers are
                    published as a reliability table precisely so that reading it is possible.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">Matching strips across DAWs, with reasons attached</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    Comparing the same song in two DAWs means deciding which channel strip
                    corresponds to which, and the alignment engine does it from auditable
                    signals only: registry concepts, name tokens, entity shape, local topology
                    and media hashes. Every claim it returns carries the reasons that produced
                    it, and it grades itself into PROBABLE, POSSIBLE, UNMATCHED or CONFLICTING
                    — where CONFLICTING names both rivals rather than silently picking the
                    narrow winner.
                  </p>
                  <p>
                    CONFIRMED is the fifth status and the engine cannot assign it. It is
                    reachable only through a person confirming the match. A system that
                    promotes its own guesses to ground truth eventually trains on them.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">One change, traced to the sound it made</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The question underneath all of this is whether a change to a session can be
                    connected to a change in the audio. The repository answers it once, in
                    miniature and reproducibly: add a single post-fader send from a lead vocal
                    into a plate reverb, then trace it through three pure functions — the state
                    delta (the new routing edge), the signal path it creates, and the acoustic
                    delta between the two renders&rsquo; descriptors, measured as RMS and peak
                    in dB, spectral centroid in Hz, and LUFS. The descriptors are computed
                    offline; the workbench reads them and never decodes audio in the browser.
                  </p>
                  <p>
                    One intervention on one session is not a result. It is a template with a
                    measured example in it, which is the honest thing to call it, and it is the
                    rung the ladder marks as reached only for the pair that actually did it.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="type-h2 mb-4">What is missing</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    The corpus is small — a handful of example sessions, two of them real
                    captures rather than synthetic fixtures. The role classifier has never been
                    scored on a vocabulary it did not help design. There is no learned component
                    anywhere in the analysis, by choice, and that choice has a cost: the system
                    can explain everything it claims and can generalize past its keyword tables
                    not at all.
                  </p>
                  <p>
                    What it does have is a contract. Four adapters, written against one schema
                    pinned by tag, producing snapshots that re-validate on load, with 586 tests
                    across the analyzer and the schema package. The measurement design is the
                    contribution; the dataset is what it is waiting for.
                  </p>
                </div>
              </div>
            </div>

            <CaseStudyFooter current="sessionState" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default SessionStateCaseStudy;
