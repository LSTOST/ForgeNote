// ForgeNote M2-07 — 结构生成 + 稳定性判定验证（可复现）。
// 用法：npm run check:structure （tsx，解析 tsconfig paths）。纯函数，不调 OpenRouter / DB。

import { parseStructure } from "@/lib/structure/generate";
import { evaluateStability } from "@/lib/structure/stability";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

// ── 1. 合法结构 → parse ok，registry 校验通过，stable ──
const good = JSON.stringify({
  prototypeKey: "experience_recap",
  modalityStack: ["narrative"],
  slots: [
    { key: "hook", strategyKey: "loss_open" },
    { key: "context", strategyKey: "case_evidence" },
    { key: "insight", strategyKey: "expectation_reversal" },
    { key: "resolution", strategyKey: "reusable_rule" },
  ],
  pendingDecisions: [{ key: "context.granularity", required: false, options: ["exact", "vague"] }],
});
const g = parseStructure(good, { taskId: "t1" });
console.log("① 合法结构");
check("parse ok", g.ok && !!g.document);
const gs = evaluateStability(g.document!);
check("stable", gs.stable);
check("6 条件全过", gs.conditions.every((c) => c.ok));
check("生成了 structureHash", !!gs.structureHash);
check("主稿可读(不被阻塞)", gs.draftReadable === true);

// ── 2. 未知/越级 strategy → 降级为待填，stable 失败于条件3 ──
const badStrat = JSON.stringify({
  prototypeKey: "experience_recap",
  modalityStack: ["narrative"],
  slots: [
    { key: "hook", strategyKey: "loss_hook" }, // 别名 → 迁移到 loss_open（应保留）
    { key: "insight", strategyKey: "actionable_steps" }, // 越级：actionable_steps 属 resolution，不属 insight → 降级
    { key: "resolution", strategyKey: "reusable_rule" },
  ],
  pendingDecisions: [],
});
const b = parseStructure(badStrat, { taskId: "t2" });
console.log("② 越级 strategy 降级");
check("parse ok", b.ok);
check("别名 loss_hook 迁移为 loss_open", b.document!.slots.find((s) => s.key === "hook")?.strategyKey === "loss_open");
check("越级 strategy 被降级为待填", b.document!.slots.find((s) => s.key === "insight")?.strategyKey === undefined);
check("有 dropped 记录", b.dropped.length > 0);
const bs = evaluateStability(b.document!);
check("unstable（insight 待填）", !bs.stable && bs.blockers.some((x) => x.includes("条件3")));

// ── 3. 缺必填 slot → 条件3 失败 ──
const missing = parseStructure(JSON.stringify({
  prototypeKey: "opinion_argument", modalityStack: ["narrative"],
  slots: [{ key: "hook", strategyKey: "contrarian_hook" }], pendingDecisions: [],
}), { taskId: "t3" });
console.log("③ 缺必填 slot");
check("unstable 且条件3 报缺失", !evaluateStability(missing.document!).stable);

// ── 3b. 必填 slot 按原型细化：清单指南不强求 insight ──
console.log("③b 按原型细化必填 slot");
const checklist = parseStructure(JSON.stringify({
  prototypeKey: "checklist_guide", modalityStack: ["narrative"],
  slots: [{ key: "hook", strategyKey: "number_hook" }, { key: "resolution", strategyKey: "actionable_steps" }],
  pendingDecisions: [],
}), { taskId: "t3b" });
check("清单指南 hook+resolution（无 insight）即 stable", evaluateStability(checklist.document!).stable);
const recap = parseStructure(JSON.stringify({
  prototypeKey: "experience_recap", modalityStack: ["narrative"],
  slots: [{ key: "hook", strategyKey: "loss_open" }, { key: "resolution", strategyKey: "reusable_rule" }],
  pendingDecisions: [],
}), { taskId: "t3c" });
check("经验复盘缺 insight 仍 unstable", !evaluateStability(recap.document!).stable);

// ── 4. 非法模态栈（含 temporal）→ temporal 被过滤，剩 narrative ──
const temporal = parseStructure(JSON.stringify({
  prototypeKey: "knowledge_explainer", modalityStack: ["narrative", "temporal"],
  slots: [{ key: "hook", strategyKey: "problem_hook" }, { key: "insight", strategyKey: "root_cause" }, { key: "resolution", strategyKey: "actionable_steps" }],
  pendingDecisions: [],
}), { taskId: "t4" });
console.log("④ temporal 过滤");
check("temporal 被剔除，栈=[narrative]", temporal.document!.modalityStack.join(",") === "narrative");
check("stable（过滤后合法）", evaluateStability(temporal.document!).stable);

// ── 5. required 待决策未裁 → 条件4 失败 ──
const undecided = parseStructure(JSON.stringify({
  prototypeKey: "experience_recap", modalityStack: ["narrative"],
  slots: [{ key: "hook", strategyKey: "loss_open" }, { key: "insight", strategyKey: "expectation_reversal" }, { key: "resolution", strategyKey: "reusable_rule" }],
  pendingDecisions: [{ key: "case.nameable", required: true }],
}), { taskId: "t5" });
console.log("⑤ required 决策未裁");
const us = evaluateStability(undecided.document!);
check("unstable 且条件4 报未裁", !us.stable && us.blockers.some((x) => x.includes("条件4")));

// ── 6. 未知 prototype → parse 失败 ──
console.log("⑥ 未知 prototype");
check("parse 失败", !parseStructure(JSON.stringify({ prototypeKey: "meme_dump", modalityStack: ["narrative"], slots: [], pendingDecisions: [] }), { taskId: "t6" }).ok);

// ── 7. visual 模态需要 layout ──
const visual = parseStructure(JSON.stringify({
  prototypeKey: "checklist_guide", modalityStack: ["narrative", "visual"],
  slots: [{ key: "hook", strategyKey: "number_hook" }, { key: "insight", strategyKey: "reframe" }, { key: "resolution", strategyKey: "actionable_steps" }],
  pendingDecisions: [],
}), { taskId: "t7" });
console.log("⑦ visual 缺 layout");
check("unstable（visual 需 layout）", !evaluateStability(visual.document!).stable);
const withLayout = { ...visual.document!, slots: [...visual.document!.slots, { key: "layout", strategyKey: "list_cards" }] };
check("补 layout 后 stable", evaluateStability(withLayout).stable);

console.log(allPass ? "\ncheck:structure PASS ✓" : "\ncheck:structure FAIL ✗");
if (!allPass) process.exit(1);
