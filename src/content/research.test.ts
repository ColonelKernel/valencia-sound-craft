import { describe, expect, it } from "vitest";

import {
  backgroundSummary,
  caseStudies,
  education,
  profileLinks,
  researchQuestions,
  researchTrajectory,
  supportingProjects,
} from "./research";

const allContent = {
  backgroundSummary,
  caseStudies,
  education,
  profileLinks,
  researchQuestions,
  researchTrajectory,
  supportingProjects,
};

describe("research dossier content", () => {
  it("exposes the intended question and project hierarchy", () => {
    expect(researchQuestions).toHaveLength(3);
    expect(researchQuestions.map((question) => question.number)).toEqual(["01", "02", "03"]);
    expect(caseStudies.map((study) => study.id)).toEqual([
      "session-state",
      "improv-partner",
      "autoharm",
    ]);
    expect(supportingProjects.map((project) => project.title)).toEqual([
      "HarmonySingerMax",
      "AutoHarm Studio",
      "Arrangement Architect",
    ]);
  });

  it("keeps every reported metric attached to evaluation context and a qualifier", () => {
    const metrics = caseStudies.flatMap((study) => study.metrics);

    expect(metrics.length).toBeGreaterThan(0);
    for (const metric of metrics) {
      expect(metric.value.trim()).not.toBe("");
      expect(metric.label.trim()).not.toBe("");
      expect(metric.context.trim()).not.toBe("");
      expect(metric.qualifier.trim()).not.toBe("");
    }
  });

  it("presents the DAW adapters in the required observation order", () => {
    const sessionState = caseStudies.find((study) => study.id === "session-state");

    expect(sessionState?.implementations?.map((implementation) => implementation.name)).toEqual([
      "Cubase Session State Explorer",
      "Ableton Session State Explorer",
      "REAPER Session State Explorer",
      "Logic Session Evidence Explorer",
    ]);
    expect(
      sessionState?.implementations?.map((implementation) => implementation.observation),
    ).toEqual([
      "Open interchange",
      "Runtime API",
      "Transparent project file",
      "Export-derived evidence",
    ]);
    expect(sessionState?.limitations.join(" ")).toContain(
      "a validated cross-DAW state predictor has not yet been trained",
    );
  });

  it("separates workshop provenance from the later Improv Partner benchmark", () => {
    const improvPartner = caseStudies.find((study) => study.id === "improv-partner");
    const metricText = JSON.stringify(improvPartner?.metrics);

    expect(improvPartner?.collaboration).toContain(
      "Julián Cubillos, Santi Scalzadonna, and Zach Scheffler",
    );
    expect(improvPartner?.collaboration).toContain("musician and technical collaborator");
    expect(metricText).toContain("later");
    expect(metricText).toContain("0.363 vs 0.163");
    expect(improvPartner?.limitations.join(" ")).toContain("Real-instrument evaluation");
  });

  it("attributes pretrained AutoHarm models without claiming model training or DAW prediction", () => {
    const autoHarm = caseStudies.find((study) => study.id === "autoharm");
    const claimText = JSON.stringify(autoHarm);

    expect(claimText).toContain("pretrained JazzNet");
    expect(claimText).toContain("does not claim original authorship or novel training");
    expect(claimText).toContain("does not predict DAW production state");
  });

  it("provides only secure public links and publishes no local paths or email addresses", () => {
    const serialized = JSON.stringify(allContent);
    const links = [
      ...profileLinks,
      ...caseStudies.flatMap((study) => [
        ...study.evidence,
        ...(study.implementations?.flatMap((implementation) => implementation.links) ?? []),
      ]),
      ...supportingProjects.flatMap((project) => (project.link ? [project.link] : [])),
      ...education.flatMap((entry) => (entry.link ? [entry.link] : [])),
    ];

    for (const link of links) {
      expect(link.href).toMatch(/^https:\/\//);
    }
    expect(serialized).not.toMatch(/\/(?:Users|Volumes)\//);
    expect(serialized).not.toMatch(/(?:mailto:|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/);
    expect(serialized).not.toContain("ImprovPartner-live-snapshot");
    expect(serialized).not.toContain("ImprovPartnerPlan");
  });

  it("does not expose links for private supporting prototypes", () => {
    const harmonySinger = supportingProjects.find(
      (project) => project.title === "HarmonySingerMax",
    );
    const autoHarmStudio = supportingProjects.find(
      (project) => project.title === "AutoHarm Studio",
    );
    const arrangementArchitect = supportingProjects.find(
      (project) => project.title === "Arrangement Architect",
    );

    expect(harmonySinger?.link).toBeUndefined();
    expect(autoHarmStudio?.link).toBeUndefined();
    expect(arrangementArchitect?.link?.kind).toBe("repository");
    expect(arrangementArchitect?.caveat).toContain("not presented as an AI");
  });

  it("uses the corrected education record and links the selected Berklee capstone", () => {
    expect(education[0]).toMatchObject({
      year: "2025",
      institution: "Berklee College of Music",
      credential: "Master of Music in Music Production, Technology and Innovation",
    });
    expect(education[0]?.link?.href).toBe(
      "https://remix.berklee.edu/graduate-studies-production-technology/433/",
    );
  });

  it("bridges research questions to a doctoral trajectory with three stages", () => {
    expect(researchTrajectory).toHaveLength(3);
    expect(researchTrajectory.map((stage) => stage.number)).toEqual(["01", "02", "03"]);

    for (const stage of researchTrajectory) {
      expect(stage.title.trim()).not.toBe("");
      expect(stage.summary.trim()).not.toBe("");
      expect(stage.signals.length).toBeGreaterThan(0);
      expect(stage.signals.length).toBeLessThanOrEqual(4);
      for (const signal of stage.signals) {
        expect(signal.trim()).not.toBe("");
      }
      if (stage.boundary !== undefined) {
        expect(stage.boundary.trim()).not.toBe("");
      }
    }

    const trajectoryBody = researchTrajectory
      .map((stage) => `${stage.summary} ${stage.signals.join(" ")} ${stage.boundary ?? ""}`)
      .join(" ");
    expect(trajectoryBody).toContain("acoustic outcomes");
    expect(trajectoryBody).toContain("creativity-supporting");
  });
});
