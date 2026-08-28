import { describe, expect, it } from "vitest";

import { resolveGitExecutable } from "./git-executable.mjs";

describe("resolveGitExecutable", () => {
  it("uses an explicitly configured executable when it exists", () => {
    expect(
      resolveGitExecutable({
        environment: { PIESHOP_GIT_EXECUTABLE: "D:\\Tools\\git.exe" },
        platform: "win32",
        pathExists: (candidate) => candidate === "D:\\Tools\\git.exe",
      }),
    ).toBe("D:\\Tools\\git.exe");
  });

  it("rejects an invalid explicit executable without exposing environment data", () => {
    expect(() =>
      resolveGitExecutable({
        environment: { PIESHOP_GIT_EXECUTABLE: "D:\\missing\\git.exe" },
        platform: "win32",
        pathExists: () => false,
      }),
    ).toThrow("PIESHOP_GIT_EXECUTABLE does not point to a file");
  });

  it("finds a standard Windows Git installation when PATH lookup is unavailable", () => {
    const expected = "C:\\Program Files\\Git\\cmd\\git.exe";
    expect(
      resolveGitExecutable({
        environment: { ProgramFiles: "C:\\Program Files" },
        platform: "win32",
        pathExists: (candidate) => candidate === expected,
      }),
    ).toBe(expected);
  });

  it("uses normal PATH resolution on non-Windows platforms", () => {
    expect(
      resolveGitExecutable({
        environment: {},
        platform: "linux",
        pathExists: () => false,
      }),
    ).toBe("git");
  });
});
