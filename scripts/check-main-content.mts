// ForgeNote M2-09 Step 1 — 主内容层验证（可复现，不调 OpenRouter）。
// 用法：npm run check:main-content（tsx）。注入 mock fill。
// 验证：① 形态由模态决定 ② 提纲确定性派生 ③ section 按 slot 顺序绑定 + hash 溯源
//      ④ heading 缺省回退 slot 标签 ⑤ 解析失败降级为骨架 + 告警 ⑥ 只吃叙事内容 slot（非 layout）

import { structureHash } from "@/lib/render/contract";
import type { RendererFill } from "@/lib/render/contract";
import {
  buildOutline,
  generateMainContent,
  mainContentForm,
} from "@/lib/content/main-content";
import { getLabel } from "@/lib/structure/registry";
import type { StructureDocument } from "@/lib/structure/types";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

// mock fill：按 section 单元数产出占位（role 用输入 key，heading 留空以测回退）。
const mockFill: RendererFill = async (messages) => {
  const user = messages.find((m) => m.role === "user")?.content ?? "";
  const keys = [...user.matchAll(/#\d+ \[([a-z_]+)\]/g)].map((m) => m[1]);
  return JSON.stringify({ sections: keys.map((k, i) => ({ role: k, heading: "", text: `可读正文${i}` })) });
};
const badFill: RendererFill = async () => "not json";

const narrative: StructureDocument = {
  id: "s1", taskId: "t1", vocabVersion: "2026.07.0", prototypeKey: "experience_recap",
  modalityStack: ["narrative"],
  slots: [
    { key: "hook", strategyKey: "loss_open" },
    { key: "context", strategyKey: "case_evidence" },
    { key: "insight", strategyKey: "expectation_reversal" },
    { key: "resolution", strategyKey: "reusable_rule" },
  ],
  pendingDecisions: [], stabilityStatus: "stable",
};
const visual: StructureDocument = {
  ...narrative, id: "s2", modalityStack: ["narrative", "visual"],
  slots: [...narrative.slots, { key: "layout", strategyKey: "list_cards" }, { key: "visual_hierarchy", strategyKey: "cover_hook" }],
};
const temporal: StructureDocument = { ...narrative, id: "s3", modalityStack: ["narrative", "temporal"] };
const input = (s: StructureDocument) => ({ intent: "应届生第一次租房", structure: s, accountBrain: {} });

// ── ① 形态由模态决定 ──
console.log("① 形态映射");
check("叙事 → prose", mainContentForm(narrative) === "prose");
check("视觉 → cards", mainContentForm(visual) === "cards");
check("时间 → script", mainContentForm(temporal) === "script");

// ── ② 提纲确定性派生（免模型）──
console.log("② 提纲");
const outline = buildOutline(narrative);
check("direction 含原型标签", outline.direction.includes(getLabel("experience_recap", "zh-Hans")));
check("提纲点 = 4 叙事 slot、有序", outline.points.map((p) => p.slotKey).join(",") === "hook,context,insight,resolution");
check("提纲点带人类可读 label", outline.points[0].label === getLabel("hook", "zh-Hans"));
check("提纲点带策略 label", outline.points[0].strategyLabel === getLabel("loss_open", "zh-Hans"));

// ── ③ 主内容：section 按 slot 顺序绑定 + hash 溯源 ──
console.log("③ 主内容生成");
const mc = await generateMainContent(input(narrative), mockFill);
check("section 数 = 4 叙事 slot", mc.sections.length === 4);
check("section role 按 NARRATIVE_ORDER", mc.sections.map((s) => s.role).join(",") === "hook,context,insight,resolution");
check("section 绑定对应 slotKeys", mc.sections.every((s) => s.slotKeys.length === 1 && s.slotKeys[0] === s.role));
check("text 来自 fill", mc.sections[0].text === "可读正文0");
check("sourceStructureHash 溯源正确", mc.sourceStructureHash === structureHash(narrative));
check("form = prose", mc.form === "prose");

// ── ④ heading 缺省回退 slot 标签 ──
console.log("④ heading 回退");
check("空 heading 回退为 slot 人类标签", mc.sections[0].heading === getLabel("hook", "zh-Hans"));

// ── ⑤ 解析失败降级 ──
console.log("⑤ 降级");
const mcBad = await generateMainContent(input(narrative), badFill);
check("解析失败仍返回 4 骨架 section", mcBad.sections.length === 4);
check("降级 section text 为空", mcBad.sections.every((s) => s.text === ""));
check("带解析失败告警", mcBad.warnings.length > 0);

// ── ⑥ 只吃叙事内容 slot（layout/visual_hierarchy 不进主内容 section）──
console.log("⑥ 视觉结构");
const mcVisual = await generateMainContent(input(visual), mockFill);
check("视觉结构 form = cards", mcVisual.form === "cards");
check("section 仍只 4 叙事 slot（不含 layout/visual_hierarchy）", mcVisual.sections.map((s) => s.role).join(",") === "hook,context,insight,resolution");

console.log(allPass ? "\n✓ 全部通过" : "\n✗ 有失败");
process.exit(allPass ? 0 : 1);
