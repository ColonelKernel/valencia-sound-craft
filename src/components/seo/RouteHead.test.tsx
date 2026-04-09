import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RouteHead, { createToolStructuredData } from "./RouteHead";

describe("RouteHead", () => {
  it("updates document metadata and structured data for a route", () => {
    render(
      <RouteHead
        title="Rhythm Engine"
        description="Atlas-backed rhythm engine"
        canonicalPath="/tools/rhythm"
        jsonLd={createToolStructuredData({
          name: "Rhythm Engine",
          description: "Atlas-backed rhythm engine",
          canonicalPath: "/tools/rhythm",
          educationalUse: "rhythm training",
        })}
      />,
    );

    expect(document.title).toBe("Rhythm Engine");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Atlas-backed rhythm engine",
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toContain("/tools/rhythm");
    expect(document.head.querySelector("#route-jsonld")?.textContent).toContain("Rhythm Engine");
  });
});

