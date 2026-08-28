const projectUrlValue = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function fail(message) {
  process.stderr.write(`Supabase connection check failed: ${message}\n`);
  process.exitCode = 1;
}

if (!projectUrlValue || !publishableKey) {
  fail("required development variables are missing from .env.local");
} else if (!publishableKey.startsWith("sb_publishable_")) {
  fail("the configured key is not a Supabase publishable key");
} else {
  try {
    const projectUrl = new URL(projectUrlValue);

    if (
      projectUrl.protocol !== "https:" ||
      !projectUrl.hostname.endsWith(".supabase.co")
    ) {
      fail("the project URL must be an HTTPS supabase.co project URL");
    } else {
      const requestOptions = {
        headers: {
          apikey: publishableKey,
        },
        signal: AbortSignal.timeout(10_000),
      };
      const authResponse = await fetch(
        new URL("/auth/v1/settings", projectUrl),
        requestOptions,
      );

      if (!authResponse.ok) {
        fail(
          `API gateway rejected the publishable key (Auth returned HTTP ${authResponse.status})`,
        );
      } else {
        const dataResponse = await fetch(
          new URL("/rest/v1/__pieshop_connection_probe?select=*", projectUrl),
          {
            ...requestOptions,
            signal: AbortSignal.timeout(10_000),
          },
        );

        if (dataResponse.status === 401 || dataResponse.status === 403) {
          fail(
            `publishable key is valid, but Data API rejected the probe with HTTP ${dataResponse.status}`,
          );
        } else {
          process.stdout.write(
            "Supabase connection check passed: Auth and Data API are reachable and the publishable key was accepted.\n",
          );
        }
      }
    }
  } catch (error) {
    const safeReason =
      error instanceof Error && error.name === "TimeoutError"
        ? "request timed out"
        : "the Data API could not be reached";
    fail(safeReason);
  }
}
