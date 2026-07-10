export const DEFAULT_AUTH_REDIRECT_PATH = "/workspace";

const LEGACY_AUTH_REDIRECT_PATHS = new Set(["/forge"]);

export function normalizeAuthRedirectPath(
  nextParam: string | null,
  origin: string,
): string {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  const target = new URL(nextParam, origin);
  const isLegacyDestination =
    LEGACY_AUTH_REDIRECT_PATHS.has(target.pathname) ||
    [...LEGACY_AUTH_REDIRECT_PATHS].some((path) =>
      target.pathname.startsWith(`${path}/`),
    );

  if (isLegacyDestination) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
