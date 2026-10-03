const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/u;
const SAFE_ENVIRONMENTS = new Set(["local", "test"]);

export function assertSafeSupabaseTestTarget(input) {
  if (!SAFE_ENVIRONMENTS.has(input.appEnvironment)) {
    throw new Error("unsafe_environment");
  }

  const projectUrl = parseUrl(input.projectUrl, "invalid_project_url");
  const projectRef = projectUrl.hostname.split(".")[0] ?? "";
  if (
    projectUrl.protocol !== "https:" ||
    !projectUrl.hostname.endsWith(".supabase.co") ||
    !PROJECT_REF_PATTERN.test(projectRef)
  ) {
    throw new Error("invalid_project_url");
  }

  const databaseUrl = parseUrl(input.databaseUrl, "invalid_database_url");
  const poolerHost = databaseUrl.hostname.endsWith(".pooler.supabase.com");
  const directHost = databaseUrl.hostname === `db.${projectRef}.supabase.co`;
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    (!poolerHost && !directHost)
  ) {
    throw new Error("unsafe_database_host");
  }

  const databaseProjectRef = poolerHost
    ? (databaseUrl.username.split(".")[1] ?? "")
    : (databaseUrl.hostname.split(".")[1] ?? "");
  if (databaseProjectRef !== projectRef) {
    throw new Error("project_mismatch");
  }
  if (poolerHost && databaseUrl.port !== "5432") {
    throw new Error("unsafe_database_port");
  }
  if (input.projectConfirmation !== projectRef) {
    throw new Error("confirmation_mismatch");
  }

  return { projectRef, databaseHost: databaseUrl.hostname };
}

export function safeDatabaseFailure() {
  return "database_operation_failed";
}

export function safeDatabaseCode(error) {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" && /^[0-9A-Z]{5}$/u.test(error.code)
    ? error.code
    : null;
}

function parseUrl(value, errorCode) {
  try {
    return new URL(value);
  } catch {
    throw new Error(errorCode);
  }
}
