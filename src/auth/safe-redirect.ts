export const CONTROL_PLANE_HOME = "/control";

const encodedSeparatorOrControl = /%(?:0a|0d|2f|5c)/iu;

export function resolveSafeControlPlaneRedirect(
  candidate: string | null | undefined,
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    encodedSeparatorOrControl.test(candidate)
  ) {
    return CONTROL_PLANE_HOME;
  }

  try {
    const destination = new URL(candidate, "https://pieshop.invalid");
    const isControlPlane =
      destination.pathname === CONTROL_PLANE_HOME ||
      destination.pathname.startsWith(`${CONTROL_PLANE_HOME}/`);

    if (destination.origin !== "https://pieshop.invalid" || !isControlPlane) {
      return CONTROL_PLANE_HOME;
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return CONTROL_PLANE_HOME;
  }
}
