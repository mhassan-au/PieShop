type SupabaseTargetInput = {
  appEnvironment: string;
  projectUrl: string;
  databaseUrl: string;
  destructiveConfirmation: string;
};

export type SafeSupabaseTarget = {
  projectRef: string;
  databaseHost: string;
};

const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const SAFE_ENVIRONMENTS = new Set(["local", "test"]);

export function assertSafeSupabaseTarget(
  input: SupabaseTargetInput,
): SafeSupabaseTarget {
  if (!SAFE_ENVIRONMENTS.has(input.appEnvironment)) {
    throw new Error(
      "Destructive database work requires a local/test environment.",
    );
  }

  const projectUrl = parseUrl(input.projectUrl, "project URL");
  const projectRef = projectUrl.hostname.split(".")[0];

  if (
    projectUrl.protocol !== "https:" ||
    !projectUrl.hostname.endsWith(".supabase.co") ||
    !projectRef ||
    !PROJECT_REF_PATTERN.test(projectRef)
  ) {
    throw new Error("Invalid Supabase project URL.");
  }

  const databaseUrl = parseUrl(input.databaseUrl, "database URL");
  const isPoolerHost = databaseUrl.hostname.endsWith(".pooler.supabase.com");
  const isDirectHost = databaseUrl.hostname === `db.${projectRef}.supabase.co`;

  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    (!isPoolerHost && !isDirectHost)
  ) {
    throw new Error("Database host must be an approved Supabase host.");
  }

  const databaseProjectRef = isPoolerHost
    ? databaseUrl.username.split(".")[1]
    : databaseUrl.hostname.split(".")[1];

  if (databaseProjectRef !== projectRef) {
    throw new Error("Database and API project references do not match.");
  }

  if (isPoolerHost && databaseUrl.port !== "5432") {
    throw new Error("Migrations require the Supabase session-mode port 5432.");
  }

  if (input.destructiveConfirmation !== projectRef) {
    throw new Error(
      "Destructive confirmation must equal the project reference.",
    );
  }

  return { projectRef, databaseHost: databaseUrl.hostname };
}

function parseUrl(value: string, label: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }
}
