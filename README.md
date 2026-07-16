# Zach Scheffler — Research Dossier

An evidence-led portfolio focused on interpretable DAW state, audio outcomes, and musician-controlled intelligent production systems. The site is tailored to the MTG–Steinberg PhD research topic while remaining an honest, public record of implemented work and current limitations.

## Site structure

- Research agenda: representation, state-to-audio relationships, and interpretable prediction
- Session State Analyzer: one cross-DAW program spanning Cubase, Ableton Live, REAPER, and Logic Pro
- Improspira / Improv Partner: workshop provenance and the later evaluated continuation
- AutoHarm / Autoharmonizer: editable browser and Max harmony workflows
- Supporting prototypes and research background

Claims, links, evaluation contexts, and limitations live in `src/content/research.ts`. Keep metrics qualified there rather than embedding unsupported marketing copy in components.

## Local development

```bash
npm install
npm run dev
```

The production-quality gates are:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
npm run lighthouse
```

The production application has only React and ReactDOM runtime dependencies. On `main`, the repository contains just the shipped dossier — earlier Lovable scaffolding, unused UI kits, interactive tool subsystems, and the Supabase integration have been removed rather than merely firewalled out of the build graph (historical branches on the remote may still contain older material).

## Publishing safeguards

- Do not add workshop spreadsheets, internal documents, collaborator portraits, third-party manuals, private filesystem paths, or unlicensed session material.
- Keep synthetic, in-sample, heuristic, and pending-validation labels attached to the results they qualify.
- Public profile links are limited to GitHub and LinkedIn; no email or application documents are published without explicit approval.
- Deployment is intentionally separate from local implementation and verification.
- Environment files (`.env`) are untracked on `main`, and no runtime secrets exist in the shipped app.
