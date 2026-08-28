import { existsSync } from "node:fs";
import path from "node:path";

export function resolveGitExecutable({
  environment = process.env,
  platform = process.platform,
  pathExists = existsSync,
} = {}) {
  const configuredExecutable = environment.PIESHOP_GIT_EXECUTABLE;
  if (configuredExecutable) {
    if (!pathExists(configuredExecutable)) {
      throw new Error("PIESHOP_GIT_EXECUTABLE does not point to a file");
    }
    return configuredExecutable;
  }

  if (platform !== "win32") return "git";

  const candidates = [
    environment.ProgramFiles,
    environment["ProgramFiles(x86)"],
    environment.LOCALAPPDATA
      ? path.join(environment.LOCALAPPDATA, "Programs")
      : undefined,
  ]
    .filter(Boolean)
    .flatMap((root) => [
      path.join(root, "Git", "cmd", "git.exe"),
      path.join(root, "Git", "bin", "git.exe"),
    ]);

  return candidates.find((candidate) => pathExists(candidate)) ?? "git";
}
