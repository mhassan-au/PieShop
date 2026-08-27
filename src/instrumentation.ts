export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initializeSentry } = await import("./observability/sentry-sdk");
  initializeSentry(process.env.SENTRY_DSN);
}
