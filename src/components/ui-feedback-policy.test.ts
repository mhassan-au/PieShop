import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(?:ts|tsx)$/u.test(path) &&
          !path.endsWith("ui-feedback-policy.test.ts")
        ? [path]
        : [];
  });
}

describe("app-owned feedback policy", () => {
  it("prohibits native browser prompt APIs", () => {
    for (const path of sourceFiles(join(process.cwd(), "src"))) {
      expect(readFileSync(path, "utf8"), path).not.toMatch(
        /window\.(?:alert|confirm|prompt)\s*\(/u,
      );
    }
  });
});
