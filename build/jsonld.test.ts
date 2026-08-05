import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./jsonld";

describe("serializeJsonLd", () => {
  it("produces parseable JSON with the url appended", () => {
    const out = serializeJsonLd({ "@type": "Person", name: "Zach" }, "https://example.com/cv");
    expect(JSON.parse(out)).toEqual({
      "@type": "Person",
      name: "Zach",
      url: "https://example.com/cv",
    });
  });

  it("escapes every raw < so a payload can never terminate the script block", () => {
    const out = serializeJsonLd({ name: "sneaky</script><script>alert(1)" }, "/x");
    expect(out).not.toContain("<");
    // Still round-trips to the original string.
    expect(JSON.parse(out).name).toBe("sneaky</script><script>alert(1)");
  });

  it("does not mangle quotes or ampersands (the escapeHtml failure mode)", () => {
    const out = serializeJsonLd({ name: 'A "quoted" name & more' }, "/x");
    expect(JSON.parse(out).name).toBe('A "quoted" name & more');
  });
});
