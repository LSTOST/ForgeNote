#!/usr/bin/env node
// ForgeNote eval harness（QA-01：作为种子资产吸收，未纳入 npm/CI——见下）。
//
// 现状与边界：
//   - Batch A 后 POST /api/forge **必须登录**，匿名调用一律 AUTH_REQUIRED。
//   - 因此 eval 不是 CI 可跑的匿名脚本，故**不**加入 package.json 的 `eval` 入口。
//   - 它是 I-13（eval 门禁接入真实样例集）的种子：需要 ① 运行中的 dev server
//     ② 已配置 OPENROUTER 模型 env ③ 一个登录态 Auth cookie。
//   - 提供 cookie：设置 FORGENOTE_AUTH_COOKIE（整段 Cookie 头，从已登录浏览器复制）。
//
// 用法：
//   FORGENOTE_AUTH_COOKIE='sb-...=...; ...' node scripts/eval-forge.mjs \
//     --base-url http://localhost:3000 --cases eval/cases/content-package.json
//
// 安全：不打印 cookie / 不打印 secret，仅输出每个用例的 pass/fail 检查名。

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    args.set(process.argv[i].slice(2), process.argv[i + 1]);
    i += 1;
  }
}

const baseUrl =
  args.get("base-url") ||
  process.env.FORGENOTE_BASE_URL ||
  process.env.BASE_URL ||
  "http://127.0.0.1:3000";
const caseFile = args.get("cases") || "eval/cases/content-package.json";
const authCookie = process.env.FORGENOTE_AUTH_COOKIE || "";
const suite = JSON.parse(readFileSync(join(root, caseFile), "utf8"));

function fail(message) {
  throw new Error(message);
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function collectText(outcome) {
  return [
    outcome.positioning,
    ...(outcome.titles || []),
    outcome.body,
    ...(outcome.cardStructure || []).map((item) => item.title),
    ...(outcome.cardPrompts || []).map((item) => item.prompt),
    ...(outcome.hashtags || []),
    outcome.commentGuide,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callForge(testCase) {
  const headers = { "Content-Type": "application/json" };
  if (authCookie) headers.Cookie = authCookie;

  const res = await fetch(`${baseUrl}/api/forge`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      rawInput: testCase.rawInput,
      intentType: testCase.intentType || "content_package",
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    const code = json?.error?.code || res.status;
    if (code === "AUTH_REQUIRED") {
      fail("AUTH_REQUIRED：eval 需登录态。请设置 FORGENOTE_AUTH_COOKIE（见脚本头注释）。");
    }
    fail(`API 未生成内容 (${code})。eval 需要运行中的 server + 模型 env + 登录态。`);
  }
  return json.data;
}

function evaluateData(testCase, data) {
  const checks = [];
  const outcome = data.outcome || {};
  const recipe = data.recipe || {};
  const expect = testCase.expect || {};
  const text = collectText(outcome);

  checks.push({ name: "outcome 存在", passed: Boolean(data.outcome) });
  checks.push({ name: "recipe 存在", passed: Boolean(data.recipe) });
  checks.push({
    name: `标题 >= ${expect.minTitles}`,
    passed: Array.isArray(outcome.titles) && outcome.titles.length >= expect.minTitles,
  });
  checks.push({
    name: `卡片 >= ${expect.minCards}`,
    passed:
      Array.isArray(outcome.cardStructure) &&
      Array.isArray(outcome.cardPrompts) &&
      outcome.cardStructure.length >= expect.minCards &&
      outcome.cardPrompts.length >= expect.minCards,
  });
  checks.push({
    name: "卡片结构/Prompt 数量一致",
    passed:
      Array.isArray(outcome.cardStructure) &&
      Array.isArray(outcome.cardPrompts) &&
      outcome.cardStructure.length === outcome.cardPrompts.length,
  });

  const [minTags, maxTags] = expect.hashtagRange || [0, Infinity];
  checks.push({
    name: `话题 ${minTags}-${maxTags}`,
    passed:
      Array.isArray(outcome.hashtags) &&
      outcome.hashtags.length >= minTags &&
      outcome.hashtags.length <= maxTags,
  });
  checks.push({
    name: "正文/主题关键词命中",
    passed: includesAny(text, expect.bodyMustIncludeAny || []),
  });
  checks.push({
    name: "无禁用词",
    passed: !includesAny(text, expect.bannedTerms || []),
  });
  checks.push({
    name: "verification 可见",
    passed:
      Boolean(data.verification) &&
      typeof data.verification.overallPassed === "boolean" &&
      Array.isArray(data.verification.checks),
  });
  checks.push({
    name: "recipe intent 匹配",
    passed: recipe.intentType === (testCase.intentType || "content_package"),
  });

  return checks;
}

console.log(`Eval target: ${baseUrl}`);
console.log(`Eval cases: ${caseFile}`);
if (!authCookie) {
  console.log("提示：未提供 FORGENOTE_AUTH_COOKIE；匿名调用会被 AUTH_REQUIRED 拦截。");
}

let failed = 0;
for (const testCase of suite.cases) {
  try {
    const data = await callForge(testCase);
    const checks = evaluateData(testCase, data);
    const bad = checks.filter((check) => !check.passed);
    if (bad.length > 0) {
      failed += 1;
      console.log(`FAIL ${testCase.id}`);
      for (const check of bad) console.log(`  - ${check.name}`);
    } else {
      console.log(`OK   ${testCase.id}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${testCase.id}`);
    console.log(`  - ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`\nEval: ${suite.cases.length - failed}/${suite.cases.length} passed`);
process.exit(failed > 0 ? 1 : 0);
