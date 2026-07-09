#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function assertMissing(relPath) {
  if (existsSync(join(root, relPath))) fail(`legacy path still exists: ${relPath}`);
}

function assertNotIncludes(relPath, needles) {
  const text = read(relPath);
  for (const needle of needles) {
    if (text.includes(needle)) fail(`${relPath} still contains ${needle}`);
  }
}

for (const relPath of [
  "src/app/forge",
  "src/app/recipes",
  "src/app/api/forge",
  "src/app/api/render/route.ts",
  "src/components/forge",
  "src/components/recipes",
]) {
  assertMissing(relPath);
}

const pkg = JSON.parse(read("package.json"));
for (const scriptName of ["smoke:api", "eval:forge"]) {
  if (pkg.scripts?.[scriptName]) fail(`legacy npm script still exists: ${scriptName}`);
}
if (!pkg.scripts?.["check:m2-cleanup"]) fail("npm script missing: check:m2-cleanup");

for (const copyFile of ["src/lib/copy/zh-Hans.ts", "src/lib/copy/en.ts"]) {
  assertNotIncludes(copyFile, [
    "nav: {\n    forge:",
    "nav: {\n    recipes:",
    "  forge: {",
    "  recipes: {",
    "  recipeDetail: {",
    "  recipePanel: {",
    "Forge 工作台",
    "Forge workbench",
  ]);
}

for (const scriptFile of ["scripts/doctor.mjs", "scripts/metrics.mjs"]) {
  assertNotIncludes(scriptFile, ["eval:forge", "smoke:api"]);
}

if (failures.length > 0) {
  console.error("M2 cleanup check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("M2 cleanup check passed.");
