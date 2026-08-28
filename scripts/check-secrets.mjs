import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resolveGitExecutable } from "./git-executable.mjs";

const allowedFiles = new Set([".env.example", "doc/ENVIRONMENT_VARIABLES.md"]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|TELEGRAM_ALERT_BOT_TOKEN|WHATSAPP_ACCESS_TOKEN|RESEND_API_KEY)\s*=\s*[^<\s][^\r\n]*/u,
  /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/u,
];

const repositoryPath = process.cwd().replaceAll("\\", "/");
let files;
try {
  const gitExecutable = resolveGitExecutable();
  files = execFileSync(
    gitExecutable,
    [
      "-c",
      `safe.directory=${repositoryPath}`,
      "ls-files",
      "-co",
      "--exclude-standard",
    ],
    { encoding: "utf8" },
  )
    .split(/\r?\n/u)
    .filter(Boolean);
} catch {
  process.stderr.write(
    "Secret scan could not start Git. Install Git, add it to PATH, or set PIESHOP_GIT_EXECUTABLE to git.exe.\n",
  );
  process.exit(1);
}

const findings = [];

for (const file of files) {
  const normalisedFile = file.replaceAll("\\", "/");
  if (allowedFiles.has(normalisedFile)) continue;

  let content;
  try {
    content = readFileSync(path.resolve(file), "utf8");
  } catch {
    continue;
  }

  if (secretPatterns.some((pattern) => pattern.test(content))) {
    findings.push(normalisedFile);
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `Potential secrets detected in:\n${findings.map((file) => `- ${file}`).join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write("Secret scan passed.\n");
}
