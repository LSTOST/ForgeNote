#!/usr/bin/env node
// ForgeNote doctor — 工程环境自检（QA-01：基于当前 HEAD 适配，非 I-02B 旧状态）。
// 原则：
//   - 只检查「是否存在 / 是否就绪」，绝不读取或打印任何 secret 值。
//   - env 仅检测变量是否存在（process.env 或 .env.local 出现同名 key），不解析也不输出其值。
//   - 检查清单严格对齐当前仓库事实（migration=0001_init.sql、登录后才生成等）。
// 退出码：有 fail → 1，否则 0（warn 不阻断，便于 CI 在缺 env 时仍通过）。

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const results = [];

function mark(level, label, detail = "") {
  results.push({ level, label, detail });
}

function exists(relPath) {
  return existsSync(join(root, relPath));
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function checkFile(relPath, label = relPath) {
  if (exists(relPath)) mark("pass", label);
  else mark("fail", label, "缺失");
}

function checkScript(pkg, name) {
  if (pkg.scripts?.[name]) mark("pass", `npm script: ${name}`);
  else mark("fail", `npm script: ${name}`, "缺失");
}

// env 存在性检测：只看是否定义，永不取值、永不打印值。
function envName(name) {
  return name;
}
function hasEnv(name) {
  if (process.env[name] !== undefined && process.env[name] !== "") return true;
  // .env.local：仅做「存在同名且非空赋值」的存在性判断，不捕获也不返回其值。
  if (!exists(".env.local")) return false;
  const re = new RegExp(`^\\s*${name}\\s*=\\s*\\S`, "m");
  return re.test(readFileSync(join(root, ".env.local"), "utf8"));
}

const pkg = readJson("package.json");

// ── 运行时 ──
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 20) mark("pass", "Node.js >= 20", process.versions.node);
else mark("fail", "Node.js >= 20", process.versions.node);

// ── 依赖 / 配置 ──
checkFile("package-lock.json");
checkFile("node_modules/next/package.json", "依赖已安装 (next)");
checkFile(".env.example");

// ── 文档（当前 HEAD 实际存在的文档集合）──
for (const doc of [
  "docs/DECISIONS.md",
  "docs/PRD-M1.md",
  "docs/UIUX-M1.md",
  "docs/API-CONTRACT.md",
  "docs/DATA-SCHEMA.md",
  "docs/MODEL-INTEGRATION.md",
  "docs/PROJECT-STATUS.md",
  "docs/TICKETS.md",
  "docs/RUNBOOK.md",
  "docs/DEPLOYMENT.md",
  "docs/acceptance/Batch-C.md",
]) {
  checkFile(doc);
}

// ── npm 脚本（仅检查本仓库真实提供的脚本；I-13 起 eval:forge 已纳入 npm）──
for (const script of [
  "dev",
  "lint",
  "typecheck",
  "build",
  "doctor",
  "smoke:api",
  "db:test-rls",
  "eval:forge",
]) {
  checkScript(pkg, script);
}

// ── 工程脚本与资产（当前仓库事实：migration 为 0001_init.sql）──
for (const file of [
  "scripts/doctor.mjs",
  "scripts/smoke-forge-api.mjs",
  "scripts/test-rls.mjs",
  "scripts/eval-forge.mjs",
  "eval/cases/content-package.json",
  "supabase/migrations/0001_init.sql",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
]) {
  checkFile(file);
}

// ── env 存在性（不输出值；缺失为 warn 不阻断）──
// 模型网关（仅服务端）：缺失 → /api/forge 返回 MODEL_NOT_CONFIGURED。
for (const name of [envName("OPENROUTER_API_KEY"), envName("OPENROUTER_MODEL")]) {
  if (hasEnv(name)) mark("pass", `${name} 已配置`);
  else mark("warn", name, "未配置；/api/forge 将返回 MODEL_NOT_CONFIGURED");
}
// Supabase 公开配置（登录与受保护页所需）：缺失 → 登录不可用、/forge 跳 /login。
for (const name of [
  envName("NEXT_PUBLIC_SUPABASE_URL"),
  envName("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
]) {
  if (hasEnv(name)) mark("pass", `${name} 已配置`);
  else mark("warn", name, "未配置；登录闭环不可用、/api/forge 将 AUTH_REQUIRED");
}

const icon = { pass: "OK  ", warn: "WARN", fail: "FAIL" };
for (const item of results) {
  const suffix = item.detail ? ` - ${item.detail}` : "";
  console.log(`${icon[item.level]} ${item.label}${suffix}`);
}

const failed = results.filter((item) => item.level === "fail").length;
const warned = results.filter((item) => item.level === "warn").length;
console.log(`\nDoctor: ${failed} failed, ${warned} warnings`);
process.exit(failed > 0 ? 1 : 0);
