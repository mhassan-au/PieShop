import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(
  new URL("./codex-notify.ps1", import.meta.url),
);
const shell = process.platform === "win32" ? "powershell.exe" : "pwsh";

function run(args) {
  return spawnSync(
    shell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      ...args,
    ],
    { encoding: "utf8" },
  );
}

const preview = run([
  "-Status",
  "waiting",
  "-Title",
  "Manual UI review required",
  "-Message",
  "Review the latest merchant workflow in Codex.",
  "-DryRun",
]);

assert.equal(preview.status, 0, preview.stderr);
assert.match(preview.stdout, /\[PieShop\] Codex: waiting/);
assert.match(preview.stdout, /Manual UI review required/);
assert.match(preview.stdout, /UTC: \d{4}-\d{2}-\d{2}T/);

const unsafe = run([
  "-Status",
  "failed",
  "-Title",
  "Unsafe payload",
  "-Message",
  "password=do-not-send-this",
  "-DryRun",
]);

assert.notEqual(unsafe.status, 0);
assert.match(unsafe.stderr, /may contain a credential or personal identifier/);
assert.doesNotMatch(unsafe.stdout + unsafe.stderr, /do-not-send-this/);

const missingConfig = run([
  "-Status",
  "completed",
  "-Title",
  "Checks passed",
  "-Message",
  "No action is required.",
  "-EnvFile",
  `${scriptPath}.missing`,
]);

assert.notEqual(missingConfig.status, 0);
assert.match(missingConfig.stderr, /notifications are disabled/);

console.log(
  "Codex notifier tests passed: dry run, redaction guard, and disabled-by-default behavior verified.",
);
