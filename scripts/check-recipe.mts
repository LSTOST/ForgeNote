// ForgeNote M2-10 — Recipe 保存/复用验证（可复现）。
// 用法：npm run check:recipe（tsx）。纯函数，不调 OpenRouter / DB。
// 验证：① 从 stable 结构保存 ② 拒绝 unstable ③ 只存 machine_key、剥离正文
//      ④ 反正文守卫 ⑤ 换输入复用往返

import { buildRecipeFromStructure, applyRecipeToStructure, auditRecipeNoContent } from "@/lib/recipe/schema";
import type { StructureDocument } from "@/lib/structure/types";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

const stable: StructureDocument = {
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

// ── ① 从 stable 结构保存 ──
console.log("① 从 stable 结构保存");
const r = buildRecipeFromStructure(stable, {
  name: "踩坑复盘·损失开场",
  rendererPolicy: { defaultRenderer: "x_thread", tone: "克制", hints: { emoji: "no" } },
  performanceSignalRefs: [{ ref: "perf#123", kind: "engagement" }],
});
check("保存成功", r.ok && !!r.recipe);
check("slotSchema 4 条", r.recipe!.slotSchema.length === 4);
check("只含 machine_key（slotKey+strategyKey）", r.recipe!.slotSchema.every((e) => typeof e.slotKey === "string" && typeof e.strategyKey === "string" && Object.keys(e).length === 2));
check("带 rendererPolicy", r.recipe!.rendererPolicy.defaultRenderer === "x_thread");

// ── ② 拒绝 unstable 结构 ──
console.log("② 拒绝 unstable");
const unstable: StructureDocument = { ...stable, id: "s2", slots: [{ key: "hook", strategyKey: "loss_open" }] }; // 缺 insight/resolution
const ru = buildRecipeFromStructure(unstable, { name: "半成品" });
check("unstable 被拒绝", !ru.ok && ru.errorCode === "STRUCTURE_UNSTABLE");

// ── ③ 剥离疑似正文 ──
console.log("③ 剥离正文");
const longText = "这是一整段被塞进策略里的正文".repeat(20); // > 120 字
const rc = buildRecipeFromStructure(stable, {
  name: "带正文",
  rendererPolicy: { tone: "克制", lengthHint: longText, hints: { note: longText, ok: "短提示" } },
});
check("超长 lengthHint 被剥离", rc.recipe!.rendererPolicy.lengthHint === undefined);
check("超长 hint 被剥离、短 hint 保留", rc.recipe!.rendererPolicy.hints?.note === undefined && rc.recipe!.rendererPolicy.hints?.ok === "短提示");

// ── ④ 反正文守卫 ──
console.log("④ 反正文守卫");
check("干净配方审计无问题", auditRecipeNoContent(r.recipe!).length === 0);
// 手动构造一个夹带正文的配方，守卫应报出
const dirty = { ...r.recipe!, rendererPolicy: { ...r.recipe!.rendererPolicy, hints: { blob: longText } } };
check("夹带正文被守卫抓出", auditRecipeNoContent(dirty).length > 0);

// ── ⑤ 换输入复用往返 ──
console.log("⑤ 换输入复用");
const applied = applyRecipeToStructure(r.recipe!, { taskId: "t-new" });
check("复用结构绑定新任务", applied.taskId === "t-new");
check("复用结构 slotSchema 与配方一致", applied.slots.map((s) => `${s.key}:${s.strategyKey}`).join(",") === r.recipe!.slotSchema.map((e) => `${e.slotKey}:${e.strategyKey}`).join(","));
check("复用结构直接 stable + 有 hash", applied.stabilityStatus === "stable" && !!applied.structureHash);
// 往返：复用后的结构再存配方，slotSchema 应等价
const r2 = buildRecipeFromStructure(applied, { name: "复用后再存" });
check("往返 slotSchema 等价", r2.ok && r2.recipe!.slotSchema.map((e) => e.strategyKey).join(",") === r.recipe!.slotSchema.map((e) => e.strategyKey).join(","));

console.log(allPass ? "\ncheck:recipe PASS ✓" : "\ncheck:recipe FAIL ✗");
if (!allPass) process.exit(1);
