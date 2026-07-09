#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

const week = read("docs/gate0/week-template.md");
const summary = read("docs/gate0/four-week-summary.md");
const index = read("docs/gate0/evidence-index.md");

const checks = [
  ["week template requires real path", ["/radar", "/workspace", "/gate0", "/api/performance/fill"].every((s) => week.includes(s))],
  ["week template tracks fallback", week.includes("fallback reason key") && week.includes("裸聊 ChatGPT")],
  ["week template tracks learning", week.includes("验证了什么账号规律") && week.includes("推翻了什么账号规律")],
  ["summary covers four weeks", ["Week 1", "Week 2", "Week 3", "Week 4"].every((s) => summary.includes(s))],
  ["summary has Gate 0 decision", summary.includes("是否进入 Gate 1") && summary.includes("Pass / Conditional Pass / Fail")],
  ["index requires docs/acceptance", index.includes("docs/acceptance/")],
  ["index forbids mock evidence", index.includes("mock 数据") && index.includes("Codex 代码检查替代")],
];

for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
}

const failed = checks.filter(([, ok]) => !ok).length;
console.log(failed === 0 ? "\ncheck:gate0-pack PASS" : `\ncheck:gate0-pack FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
