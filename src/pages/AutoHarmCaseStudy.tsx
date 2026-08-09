import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import RouteHead from "@/components/seo/RouteHead";
import { ROUTE_META } from "@/app/routeMeta";
import { AUTOHARM_JSONLD } from "@/app/routeStructuredData";
import { useFadeIn } from "@/hooks/useFadeIn";

/**
 * Case study for AutoHarm. Every technical claim here is checked against the
 * public source at github.com/ColonelKernel/AutoHarm-Web — model files, corpus
 * names, and browser constraints included. Nothing is rounded up: the neural
 * checkpoints came out of the earlier Max work, and the page says so.
 */

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: "What it is", value: "A generative chord instrument that runs in the browser" },
  { label: "Stack", value: "TypeScript, React, Vite, zustand, onnxruntime-web" },
  { label: "Engines", value: "Four-corpus Markov blend, plus JazzNet RNN and LSTM in ONNX" },
  { label: "Output", value: "Live MIDI to a virtual port, plus .mid export of the take" },
  { label: "Backend", value: "None — fully client-side, models served as static assets" },
];

const AutoHarmCaseStudy = () => {
  const ref = useFadeIn();

  return (
    <div className="min-h-screen" ref={ref}>
      <RouteHead
        title={ROUTE_META.autoharm.title}
        description={ROUTE_META.autoharm.description}
        canonicalPath={ROUTE_META.autoharm.path}
        jsonLd={AUTOHARM_JSONLD}
      />
      <main className="pt-16">
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="fade-up mb-10 max-w-2xl">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={16} /> Projects
              </Link>
              <p className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Case study
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">AutoHarm</h1>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                A browser-native generative chord instrument — a four-corpus Markov blend
                alongside two JazzNet ONNX models — that plays live MIDI into a DAW, ported
                from my Autoharmonizer Max for Live device.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <a
                  href="https://autoharm.zachscheffler.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:text-primary"
                >
                  Launch the app <ArrowUpRight size={14} />
                </a>
                <a
                  href="https://github.com/ColonelKernel/AutoHarm-Web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Source <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <dl className="fade-up mb-14 grid max-w-3xl gap-px overflow-hidden rounded-[1.25rem] border border-border/70 bg-border/70 sm:grid-cols-2">
              {AT_A_GLANCE.map((item) => (
                <div key={item.label} className="bg-card/80 p-5">
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="fade-up max-w-2xl space-y-10 leading-relaxed text-muted-foreground">
              <div className="space-y-4">
                <p>
                  I built this first as a Max for Live device. A Max patch sent a chord symbol
                  over OSC to a Python service on localhost, which sampled the next chord from a
                  Markov chain. It worked, and nobody could run it — you needed Max 8, Python
                  3.9+, <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">python-osc</code>,
                  and two free UDP ports before you heard a note. The harmony was fine; the
                  delivery was the problem. AutoHarm is the same brain with the delivery
                  removed: a URL.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  The approach
                </h2>
                <p>
                  Two engines, both actually shipped. The default is a four-corpus Markov blend —
                  first-order transition tables from Nottingham, POP909, Bach, and OpenBook, all
                  transposed to C/Am and deliberately kept apart. A Harmonic Color dial crossfades
                  along an ordered path from the plainest corpus to the spiciest rather than
                  averaging the four into one grey table; a second dial sets sampling temperature.
                  Roughly 180,000 counted transitions in about 150&nbsp;KB of JSON, and no model
                  download.
                </p>
                <p>
                  The neural option is a JazzNet RNN and LSTM, exported to ONNX and run in the
                  browser through onnxruntime-web — a 118-token chord vocabulary, two layers, 128
                  hidden units — loaded lazily on first selection, so anyone who stays on Markov
                  downloads none of it. I did not train them in this project: the checkpoints come
                  out of the earlier UPF Max work, and this repo exports and runs them.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Trade-offs
                </h2>
                <p>
                  Everything under <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">src/engine/</code>{" "}
                  is pure TypeScript. No DOM, no React, no Web MIDI, no Web Audio. That cost me
                  plumbing and bought the thing I needed: the whole musical brain runs in Node
                  under Vitest, so the port is pinned to the original Python by golden fixtures
                  instead of by my ear. The ONNX graphs are checked against logits captured from
                  Python onnxruntime. The blend code reimplements CPython&rsquo;s compensated float
                  summation, because a naive sum drifted by one unit in the last place — enough to
                  flip two tied probabilities and change which chord you hear.
                </p>
                <p>
                  The clock lives in a Web Worker, because main-thread timers get throttled to one
                  second in a background tab and the entire use case is this tab sitting behind
                  your DAW. WASM runs single-threaded — static hosting cannot send the COOP/COEP
                  headers SharedArrayBuffer wants — which at this model size costs nothing.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  What shipped
                </h2>
                <p>
                  Three modes. Generate gives you a progression as chord cards you can edit, lock,
                  reorder, and reroll one at a time, with four musical macros over the raw
                  parameters. Respond waits for you to finish a phrase on a MIDI keyboard,
                  analyses which notes carried weight, and answers on the next downbeat. Perform is
                  the same instrument with targets big enough to hit live.
                </p>
                <p>
                  Underneath: twelve harmonic-rhythm templates plus an editable grid; swing applied
                  identically to the synth, the MIDI out, and the exported file; a built-in synth
                  for playing with nothing attached; note output to a virtual MIDI port that any
                  DAW records; external MIDI clock so the DAW drives the transport; and{" "}
                  <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">.mid</code>{" "}
                  export of the take as played. Clicking a chord shows why: the panel is the
                  scoring breakdown that picked it, not prose written afterwards.
                </p>
                <p className="text-sm">
                  One caveat worth stating plainly: MIDI output needs a virtual port you create
                  yourself — the IAC Driver on macOS, loopMIDI on Windows — and a browser that
                  implements Web MIDI. Chrome, Edge, and Firefox route it; Safari does not.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  What&rsquo;s next
                </h2>
                <p>
                  It plays in 4/4 only. A decision, not an oversight — and the next thing to lift.
                  One test gap stays open: capture timestamping against a real lookahead clock
                  cannot be faked in Node, so it remains a hardware check. And when a neural model
                  is slower than the remainder of the phrase, Respond spends one silent cycle
                  thinking; Markov always answers on the downbeat.
                </p>
              </div>
            </div>

            <div className="fade-up mt-14">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={16} /> Back to projects
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AutoHarmCaseStudy;
