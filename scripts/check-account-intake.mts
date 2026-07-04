// ForgeNote M2-05 — 账号接入反编造校验（可复现）。
// 用法：npm run check:intake （经 tsx，解析 tsconfig paths）。
// 只测纯函数 parseAccountMemory，不调 OpenRouter / DB。

import { parseAccountMemory } from "@/lib/account/intake";

const model = JSON.stringify({
  items: [
    // ✓ 合规：有 kind/source/证据
    { kind: "proven_pattern", source: "pasted_post", body: { pattern: "踩坑复盘 4.2x 中位" }, evidenceRefs: ["帖3", "帖6"], evidenceCount: 6 },
    // ✓ account_match 允许 0 证据
    { kind: "audience", source: "account_match", body: { who: "早期独立开发者" }, evidenceRefs: [] },
    // ✗ 来源不在 ledger（疑似编造）
    { kind: "voice", source: "gut_feeling", body: { tone: "克制" }, evidenceRefs: ["帖1"] },
    // ✗ 未知 kind
    { kind: "mood", source: "pasted_post", body: { x: 1 }, evidenceRefs: ["帖1"] },
    // ✗ 非 account_match 但无证据
    { kind: "rule", source: "user_observation", body: { rule: "不蹭热点" }, evidenceRefs: [] },
    // ✗ body 仅含正文字段 → 剥离后为空
    { kind: "topic", source: "pasted_post", body: { content: "一整篇文章正文", article: "…" }, evidenceRefs: ["帖2"] },
    // ✓ 但夹带的正文字段被剥离，保留结构化键；自报证据数 99 被 cap 到 1
    { kind: "visual_pref", source: "pasted_post", body: { style: "暖纸色", content: "应被剥离" }, evidenceRefs: ["帖4"], evidenceCount: 99 },
  ],
});

const r = parseAccountMemory(model, { now: () => new Date("2026-07-04T00:00:00Z") });

const noLeak = r.items.every((i) => !("content" in i.body) && !("article" in i.body));
const capCount = r.items.find((i) => i.kind === "visual_pref")?.evidenceCount === 1;
const pass = r.ok && r.items.length === 3 && r.dropped.length === 4 && noLeak && capCount;

console.log(`保留 ${r.items.length} / 丢弃 ${r.dropped.length}`);
for (const it of r.items) console.log(`  ✓ [${it.kind}/${it.source}] ${JSON.stringify(it.body)} 证据×${it.evidenceCount}`);
for (const d of r.dropped) console.log(`  ✗ ${d.reason}`);
console.log(pass ? "\ncheck:intake PASS ✓" : "\ncheck:intake FAIL ✗");

if (!pass) process.exit(1);
