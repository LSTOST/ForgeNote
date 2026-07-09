#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function readText(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const caseFile = readJson("eval/baseline/cases/owner-gate0-week.json");
const prompt = readText("eval/baseline/prompts/chatgpt-baseline-v1.md");
const blinded = readJson("eval/baseline/templates/blinded-pair.json");
const judgment = readJson("eval/baseline/templates/judgment-record.json");

check("case has stable id", caseFile.caseId === "owner-gate0-week");
check("case has account profile", Boolean(caseFile.accountProfile?.positioning && caseFile.accountProfile?.audience && caseFile.accountProfile?.voice));
check("case has at least 10 recent posts", Array.isArray(caseFile.recentPosts) && caseFile.recentPosts.length >= 10);
check("case has performance notes", Array.isArray(caseFile.performanceNotes) && caseFile.performanceNotes.length >= 3);
check("case has field observations", Array.isArray(caseFile.fieldObservations) && caseFile.fieldObservations.length >= 3);

for (const required of ["5 张选题卡", "whyNow", "whyThisAccount", "evidence", "suggestedStructure", "firstPlatform", "禁止编造"]) {
  check(`prompt contains ${required}`, prompt.includes(required));
}

const forbiddenVisibleTerms = ["ForgeNote", "ChatGPT", "OpenRouter", "deepseek", "gpt"];
const blindedVisible = JSON.stringify(blinded.items);
for (const term of forbiddenVisibleTerms) {
  check(`blinded template hides ${term}`, !blindedVisible.toLowerCase().includes(term.toLowerCase()));
}

const pair = blinded.items?.[0];
check("blinded pair has A/B", pair?.options?.length === 2 && pair.options[0].label === "A" && pair.options[1].label === "B");
for (const option of pair?.options ?? []) {
  check(`option ${option.label} has visible fields`, ["topic", "whyNow", "whyThisAccount", "evidence", "suggestedStructure", "firstPlatform"].every((k) => k in option));
}

const judgmentItem = judgment.items?.[0];
const criteria = ["wouldActuallyDoThisWeek", "understandsAccount", "evidenceCredible", "structureActionable"];
for (const label of ["A", "B"]) {
  check(`judgment scores ${label}`, criteria.every((k) => Number.isInteger(judgmentItem?.scores?.[label]?.[k])));
}
check("judgment has forced choice", ["A", "B"].includes(judgmentItem?.forcedChoice));
check("judgment records real follow-up", "publishedLater" in judgmentItem && "performanceFilledLater" in judgmentItem);
check("judgment scale is 1-5", judgment.scale?.min === 1 && judgment.scale?.max === 5);

for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
}

const failed = checks.filter((item) => !item.ok).length;
console.log(failed === 0 ? "\ncheck:baseline-eval PASS" : `\ncheck:baseline-eval FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
