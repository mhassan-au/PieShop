import { spawnSync } from "node:child_process";
import path from "node:path";

import { assertSafeSupabaseTarget } from "../src/config/supabase-target-guard.ts";

const mode = process.argv[2];

if (
  mode !== "--dry-run" &&
  mode !== "--apply" &&
  mode !== "--seed" &&
  mode !== "--reset"
) {
  process.stderr.write("Use --dry-run, --apply, --seed, or --reset.\n");
  process.exit(1);
}

const databaseUrl = process.env.SUPABASE_DB_URL ?? "";

try {
  assertSafeSupabaseTarget({
    appEnvironment: process.env.APP_ENV ?? "",
    projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    databaseUrl,
    destructiveConfirmation:
      process.env.SUPABASE_DESTRUCTIVE_CONFIRMATION ?? "",
  });
} catch (error) {
  const safeMessage =
    error instanceof Error
      ? error.message
      : "Supabase target validation failed.";
  process.stderr.write(`Migration blocked: ${safeMessage}\n`);
  process.exit(1);
}

const executable = process.execPath;
const supabaseCli = path.resolve("node_modules/supabase/dist/supabase.js");
const argumentsList = [
  supabaseCli,
  "db",
  mode === "--reset" ? "reset" : "push",
  "--db-url",
  databaseUrl,
];
if (mode === "--dry-run") argumentsList.push("--dry-run");
if (mode === "--seed") argumentsList.push("--include-seed");
if (mode === "--reset") argumentsList.push("--yes");

const result = spawnSync(executable, argumentsList, {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  process.stderr.write("Migration command could not be started.\n");
  process.exit(1);
}

process.exit(result.status ?? 1);
