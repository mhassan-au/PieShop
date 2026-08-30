import { describe, expect, it } from "vitest";

import {
  CONTROL_PLANE_HOME,
  resolveSafeControlPlaneRedirect,
} from "./safe-redirect";

describe("resolveSafeControlPlaneRedirect", () => {
  it.each([
    [undefined, CONTROL_PLANE_HOME],
    [null, CONTROL_PLANE_HOME],
    ["", CONTROL_PLANE_HOME],
    ["/control", "/control"],
    ["/control/sessions", "/control/sessions"],
    ["/control?from=login", "/control?from=login"],
  ])("resolves %s to %s", (candidate, expected) => {
    expect(resolveSafeControlPlaneRedirect(candidate)).toBe(expected);
  });

  it.each([
    "https://attacker.example/control",
    "//attacker.example/control",
    "/\\attacker.example/control",
    "/control/%2f%2fattacker.example",
    "/control/%5c%5cattacker.example",
    "/control%0d%0aLocation:https://attacker.example",
    "/merchant",
    "control",
  ])("rejects unsafe destination %s", (candidate) => {
    expect(resolveSafeControlPlaneRedirect(candidate)).toBe(CONTROL_PLANE_HOME);
  });
});
