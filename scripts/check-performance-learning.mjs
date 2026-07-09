#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const route = readFileSync(join(root, "src/app/api/performance/fill/route.ts"), "utf8");
const learning = readFileSync(join(root, "src/lib/performance/learning.ts"), "utf8");

const checks = [
  ["route exists and is auth-gated", route.includes("getAuthenticatedContext") && route.includes("AUTH_REQUIRED")],
  ["route writes performance_records", route.includes(".from(\"performance_records\")") && route.includes("published_at")],
  ["route writes account_memory_items", route.includes(".from(\"account_memory_items\")") && route.includes("performance:${record.id}")],
  ["route enforces ownership checks", route.includes(".eq(\"user_id\", user.id)") && route.includes("TASK_NOT_FOUND")],
  ["route logs Gate0 events", route.includes("performance_filled") && route.includes("published_marked")],
  ["learning supports three signals", ["validated", "invalidated", "new_signal"].every((s) => learning.includes(s))],
  ["learning body excludes prose fields", !learning.includes("full_text") && !learning.includes("article")],
  ["range enum includes unknown", learning.includes("PERFORMANCE_RANGE_VALUES") && learning.includes("\"unknown\"")],
];

for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
}

const failed = checks.filter(([, ok]) => !ok).length;
console.log(failed === 0 ? "\ncheck:performance-learning PASS" : `\ncheck:performance-learning FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
