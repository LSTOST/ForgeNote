// ForgeNote M2-08 — 三 renderer 验证（可复现）。
// 用法：npm run check:renderers（tsx）。用注入 mock fill，不调 OpenRouter。
// 验证：① plan 覆盖率不丢 slot ② render 产物带正确 sourceStructureHash ③ 不改结构
//      ④ golden harness 抓住"丢 slot / 改 hash"的作弊 renderer ⑤ supports 门控

import { structureHash, runGoldenCoverage, planCoverage } from "@/lib/render/contract";
import type { RendererFill, RendererInput } from "@/lib/render/contract";
import type { StructureDocument } from "@/lib/structure/types";
import {
  createXThreadRenderer,
  createXiaohongshuRenderer,
  createImagePromptRenderer,
  planXThread,
  planXiaohongshu,
  planImagePrompt,
  artifactCoverage,
} from "@/lib/render/renderers";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

// 确定性 mock fill：按单元数产出占位文本（不触模型）。
const mockFill: RendererFill = async (messages) => {
  const user = messages.find((m) => m.role === "user")?.content ?? "";
  const n = (user.match(/#\d+ \[/g) ?? []).length;
  return JSON.stringify({ units: Array.from({ length: n }, (_, i) => ({ role: "u", text: `文本${i}` })) });
};

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
const inputFor = (s: StructureDocument, rid: RendererInput["target"]["rendererId"]): RendererInput =>
  ({ structure: s, accountBrain: {}, target: { rendererId: rid }, constraints: [] });

// ── ① plan 覆盖率：不丢叙事 slot ──
console.log("① plan 覆盖率");
const xtCov = planCoverage(planXThread(narrative));
check("X thread 覆盖全部 4 叙事 slot", ["hook", "context", "insight", "resolution"].every((k) => xtCov.includes(k)));
const xhsCov = planCoverage(planXiaohongshu(narrative));
check("小红书覆盖全部 4 叙事 slot", ["hook", "context", "insight", "resolution"].every((k) => xhsCov.includes(k)));
const imgCov = planCoverage(planImagePrompt(visual));
check("图片Prompt 覆盖 hook+visual_hierarchy+layout", ["hook", "visual_hierarchy", "layout"].every((k) => imgCov.includes(k)));

// ── ② render 产物：hash 溯源 + 不改结构 ──
console.log("② render 产物 + 不改结构");
const xt = createXThreadRenderer(mockFill);
const before = JSON.stringify(narrative);
const art = await xt.render(inputFor(narrative, "x_thread"));
check("sourceStructureHash 正确", art.sourceStructureHash === structureHash(narrative));
check("format=thread", art.format === "thread");
check("render 未改结构", JSON.stringify(narrative) === before);
check("产物单元数=叙事slot数", (art.output as { units: unknown[] }).units.length === 4);

// ── ③ golden harness：合规 renderer 通过 ──
console.log("③ golden harness");
const rep = await runGoldenCoverage(xt, inputFor(narrative, "x_thread"), ["hook", "context", "insight", "resolution"], artifactCoverage);
check("合规 renderer golden PASS", rep.passed && rep.hashMatches && rep.missingSlots.length === 0);

// 作弊①：丢一个 slot 的 renderer
const dropSlot = { ...xt, render: async (i: RendererInput) => { const a = await xt.render(i); (a.output as { units: unknown[] }).units.pop(); return a; } };
const rep2 = await runGoldenCoverage(dropSlot, inputFor(narrative, "x_thread"), ["hook", "context", "insight", "resolution"], artifactCoverage);
check("作弊(丢slot) 被 golden 抓住", rep2.passed === false && rep2.missingSlots.length > 0);

// 作弊②：偷改 sourceStructureHash（模拟改结构）
const cheatHash = { ...xt, render: async (i: RendererInput) => ({ ...(await xt.render(i)), sourceStructureHash: "deadbeef" }) };
const rep3 = await runGoldenCoverage(cheatHash, inputFor(narrative, "x_thread"), ["hook"], artifactCoverage);
check("作弊(改hash) 被 golden 抓住", rep3.passed === false && rep3.hashMatches === false);

// ── ④ supports 门控 ──
console.log("④ supports 门控");
check("图片Prompt 不支持纯 narrative", createImagePromptRenderer(mockFill).supports(narrative) === false);
check("图片Prompt 支持含 visual", createImagePromptRenderer(mockFill).supports(visual) === true);
check("小红书支持 narrative", createXiaohongshuRenderer(mockFill).supports(narrative) === true);

console.log(allPass ? "\ncheck:renderers PASS ✓" : "\ncheck:renderers FAIL ✗");
if (!allPass) process.exit(1);
