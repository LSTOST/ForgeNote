import assert from "node:assert/strict";

const {
  DEFAULT_AUTH_REDIRECT_PATH,
  normalizeAuthRedirectPath,
} = await import("../src/lib/auth/redirect.ts");

const origin = "https://forgenote.test";

const cases = [
  [null, DEFAULT_AUTH_REDIRECT_PATH],
  ["", DEFAULT_AUTH_REDIRECT_PATH],
  ["https://evil.test/forge", DEFAULT_AUTH_REDIRECT_PATH],
  ["//evil.test/forge", DEFAULT_AUTH_REDIRECT_PATH],
  ["/forge", DEFAULT_AUTH_REDIRECT_PATH],
  ["/forge?x=1", DEFAULT_AUTH_REDIRECT_PATH],
  ["/forge/old-task", DEFAULT_AUTH_REDIRECT_PATH],
  ["/workspace", "/workspace"],
  ["/workspace?idea=hello#draft", "/workspace?idea=hello#draft"],
  ["/profile", "/profile"],
];

for (const [input, expected] of cases) {
  assert.equal(normalizeAuthRedirectPath(input, origin), expected, input ?? "null");
}

console.log("Auth redirect check passed.");
