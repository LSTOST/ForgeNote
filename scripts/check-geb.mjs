import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "docs/geb/CONTEXT.md",
  "docs/geb/MAP.md",
  "docs/geb/PROTOCOL.md",
  "docs/geb/TASK.template.md",
  "docs/README.md",
  "docs/roadmap/roadmap.json",
];

const forbiddenRootDocs = [
  "docs/PROJECT-STATUS.md",
  "docs/PRD-M1.md",
  "docs/UIUX-M1.md",
  "docs/DATA-SCHEMA.md",
  "docs/API-CONTRACT.md",
  "docs/ForgeNote_M1_产品说明与实现方案_含商业化.md",
  "docs/ForgeNote_修订版方向.md",
  "docs/ForgeNote_差异化与竞品优先级建议.md",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) {
    failures.push(`Missing required GEB file: ${file}`);
  }
}

for (const file of forbiddenRootDocs) {
  if (existsSync(path.join(root, file))) {
    failures.push(`Forbidden obsolete root doc still exists: ${file}`);
  }
}

const agAgents = readFile("AGENTS.md");
if (!agAgents.includes("docs/geb/CONTEXT.md") || !agAgents.includes("docs/geb/MAP.md")) {
  failures.push("AGENTS.md must point agents to docs/geb/CONTEXT.md and docs/geb/MAP.md");
}

if (agAgents.includes("Before making ANY code changes, read in this order")) {
  failures.push("AGENTS.md still contains the old full-doc reading rule");
}

const docsReadme = readFile("docs/README.md");
if (!docsReadme.includes("GEB Lite") || !docsReadme.includes("不要全量读取 `docs/`")) {
  failures.push("docs/README.md must state the GEB Lite minimal-context rule");
}

for (const junk of findJunk(path.join(root, "docs"))) {
  failures.push(`Junk/generated file under docs: ${path.relative(root, junk)}`);
}

if (failures.length > 0) {
  console.error("GEB check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("GEB check passed.");

function readFile(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function findJunk(dir) {
  if (!existsSync(dir)) return [];

  const matches = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(root, fullPath);

    if (
      entry.name === ".DS_Store" ||
      relative === "docs/.obsidian" ||
      relative === "docs/roadmap/dashboard.html"
    ) {
      matches.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      matches.push(...findJunk(fullPath));
    }
  }

  return matches;
}
