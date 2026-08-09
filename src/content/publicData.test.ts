import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Publishing safeguard for the datasets under public/data. These files are
 * copied verbatim into the deploy and served from a public domain out of a
 * public repo, so anything that describes the machine they were authored on
 * must never reach them.
 *
 * This is not hypothetical: public/data/egmd.json shipped an unused `filepath`
 * column holding "/Users/<name>/Downloads/e-gmd-v1.0.0/..." for every one of
 * its 1000 rows — a home directory and account name published to the world by
 * a column the app never read. Dropping it also cut the file by 38%.
 */

const dataDir = join(__dirname, "..", "..", "public", "data");
const jsonFiles = readdirSync(dataDir).filter((file) => file.endsWith(".json"));

describe("public/data datasets", () => {
  it("finds datasets to check", () => {
    expect(jsonFiles.length).toBeGreaterThan(0);
  });

  it.each(jsonFiles)("%s leaks no local filesystem path", (file) => {
    const contents = readFileSync(join(dataDir, file), "utf8");
    expect(contents, "macOS/Linux home directory").not.toMatch(/\/(?:Users|home)\/[A-Za-z0-9._-]+\//);
    expect(contents, "Windows user profile path").not.toMatch(/[A-Za-z]:\\+Users\\+/);
  });
});
