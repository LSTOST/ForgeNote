// ForgeNote M2-06 — 选题雷达反编造/无伪热度验证（可复现）。
// 用法：npm run check:radar（tsx）。纯函数 parseRadarCards，不调 OpenRouter / DB。

import { parseRadarCards } from "@/lib/radar/generate";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

const model = JSON.stringify({
  cards: [
    // ✓ account_match 允许 0 依据
    { topic: "第一次独居必留的3类备用金", prototypeKey: "checklist_guide", hookExample: "钱要留在刀刃上", suggestedPlatform: "xiaohongshu", evidenceSource: "account_match", evidenceRefs: [] },
    // ✓ historically_effective 引用真实规律
    { topic: "我扔掉的5个必买好物", prototypeKey: "experience_recap", evidenceSource: "historically_effective", evidenceRefs: ["规律1"] },
    // ✓ recent_signal 引用真实观察
    { topic: "为什么最近都在聊断舍离", prototypeKey: "opinion_argument", evidenceSource: "recent_signal", evidenceRefs: ["观察2"] },
    // ✗ 伪热度：evidenceSource 是数字 → 无效来源，丢弃
    { topic: "标题党选题", prototypeKey: "opinion_argument", evidenceSource: "85", evidenceRefs: ["规律1"] },
    // ✗ 伪造引用 规律99（不在 ledger）→ 过滤后无有效引用 → 丢弃
    { topic: "编造依据的选题", prototypeKey: "knowledge_explainer", evidenceSource: "historically_effective", evidenceRefs: ["规律99"] },
    // ✗ 超长 topic（塞正文，>80 字）
    { topic: "这是一个被塞进来的超长主题".repeat(10), evidenceSource: "account_match", evidenceRefs: [] },
    // ✓ 未知 prototype 被清空，卡仍保留
    { topic: "独处时的仪式感", prototypeKey: "meme_dump", evidenceSource: "account_match", evidenceRefs: [] },
  ],
});

const validRefs = ["account", "规律1", "规律2", "观察1", "观察2"];
const r = parseRadarCards(model, { validRefs, count: 5 });

console.log(`保留 ${r.cards.length} / 丢弃 ${r.dropped.length}`);
for (const c of r.cards) console.log(`  ✓ [${c.evidenceSource}${c.prototypeKey ? "/" + c.prototypeKey : ""}] ${c.topic} 依据${JSON.stringify(c.evidenceRefs)}`);
for (const d of r.dropped) console.log(`  ✗ ${d.reason}`);

check("保留 4 张（含 account_match 0 依据 + 未知prototype清空后保留）", r.cards.length === 4);
check("伪热度(数字来源)被丢", r.dropped.some((d) => d.reason.includes("无效来源标签")));
check("伪造依据 规律99 被丢", r.dropped.some((d) => d.reason.includes("无有效依据引用")));
check("超长 topic 被丢", r.dropped.some((d) => d.reason.includes("超长")));
check("未知 prototype 被清空（卡保留）", r.cards.some((c) => c.topic === "独处时的仪式感" && c.prototypeKey === undefined));
check("无任何数字热度字段泄漏", r.cards.every((c) => !("score" in c) && !("heat" in c)));
check("evidenceRefs 均保留为数组", r.cards.every((c) => Array.isArray(c.evidenceRefs)));

// count 限制
const many = JSON.stringify({ cards: Array.from({ length: 9 }, (_, i) => ({ topic: `选题${i}`, evidenceSource: "account_match", evidenceRefs: [] })) });
check("count=5 限制生效（9→5）", parseRadarCards(many, { count: 5 }).cards.length === 5);

console.log(allPass ? "\ncheck:radar PASS ✓" : "\ncheck:radar FAIL ✗");
if (!allPass) process.exit(1);
