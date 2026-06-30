export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: false,
  maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
};
