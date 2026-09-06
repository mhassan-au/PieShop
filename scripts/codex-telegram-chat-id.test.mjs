import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(
  new URL("./codex-telegram-chat-id.ps1", import.meta.url),
);
const shell = process.platform === "win32" ? "powershell.exe" : "pwsh";
const directory = mkdtempSync(join(tmpdir(), "pieshop-telegram-chat-id-"));
const envPath = join(directory, ".env.local");
const fakeToken = `123456:${"a".repeat(24)}`;

function run(path) {
  return spawnSync(
    shell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-EnvFile",
      path,
      "-DryRun",
    ],
    { encoding: "utf8" },
  );
}

try {
  writeFileSync(envPath, `CODEX_TELEGRAM_BOT_TOKEN=${fakeToken}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  const valid = run(envPath);
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /configuration is valid/);
  assert.doesNotMatch(
    valid.stdout + valid.stderr,
    new RegExp(fakeToken.replace(":", "\\:")),
  );

  const missing = run(`${envPath}.missing`);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /CODEX_TELEGRAM_BOT_TOKEN is missing/);

  console.log(
    "Telegram chat-ID helper tests passed: local configuration and secret redaction verified.",
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
