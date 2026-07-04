// ForgeNote M2-07 — 结构稳定性判定（CODEX-REVIEW §3 六条件）。
//
// 关键语义（CODEX §3）：稳定性只 gate 底部 renderer 输出与保存 Recipe，
//   不 gate 中区可读主稿——中区主稿始终可读（isDraftReadable 恒真），不被稳定性阻塞。
// 纯函数，可离线测。

import { resolveToken } from "./registry";
import { structureHash } from "@/lib/render/contract";
import type { ModalityKey, StructureDocument } from "./types";
import type { RendererId } from "@/lib/render/contract";

/** M1 合法模态栈（去重保序后应等于其一）。 */
const VALID_STACKS: readonly (readonly ModalityKey[])[] = [["narrative"], ["narrative", "visual"]];

/**
 * 叙事必填 slot 按内容原型细化（对齐 PRD §3 各原型的核心结构；避免对清单类强求洞察）。
 * 通用底线：hook（开场）+ resolution（收束）。复盘/知识/观点/案例额外要求 insight（洞察）。
 */
const NARRATIVE_REQUIRED_BY_PROTOTYPE: Record<string, readonly string[]> = {
  experience_recap: ["hook", "insight", "resolution"],
  knowledge_explainer: ["hook", "insight", "resolution"],
  opinion_argument: ["hook", "insight", "resolution"],
  case_breakdown: ["hook", "insight", "resolution"],
  checklist_guide: ["hook", "resolution"], // 清单指南：场景→清单→使用条件，不强求 insight
};
const NARRATIVE_REQUIRED_FALLBACK: readonly string[] = ["hook", "resolution"];

/** 各模态必填 slot。narrative 按原型；visual 需分页布局。 */
function requiredSlotsFor(modality: ModalityKey, prototypeKey: string): readonly string[] {
  if (modality === "narrative") return NARRATIVE_REQUIRED_BY_PROTOTYPE[prototypeKey] ?? NARRATIVE_REQUIRED_FALLBACK;
  if (modality === "visual") return ["layout"];
  return [];
}

/** renderer 所需模态（condition 5）。 */
const RENDERER_REQUIRES: Record<RendererId, readonly ModalityKey[]> = {
  xiaohongshu: ["narrative"], // visual 可选，narrative 必需
  x_thread: ["narrative"],
  image_prompt: ["visual"],
};

/** 单条件结果。 */
export interface StabilityCondition {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  ok: boolean;
  detail?: string;
}

/** 稳定性报告。 */
export interface StabilityReport {
  stable: boolean;
  conditions: StabilityCondition[];
  blockers: string[];
  /** stable 时生成的结构指纹（供落库 + artifact 溯源）；unstable 时 undefined。 */
  structureHash?: string;
  /** 中区主稿是否可读——恒为 true（稳定性不阻塞主稿）。 */
  draftReadable: true;
}

/**
 * 评估六条件。targetRendererId 可选：给了就校验该 renderer 的模态兼容；
 * 不给则要求"至少一个 M1 renderer 兼容"。
 */
export function evaluateStability(
  s: Readonly<StructureDocument>,
  opts?: { targetRendererId?: RendererId },
): StabilityReport {
  const conditions: StabilityCondition[] = [];

  // ① 内容原型确定且属于 M1 五类稳定原型
  const proto = resolveToken(s.prototypeKey, { expectedKind: "prototype" });
  const c1 = proto.known && proto.token.status === "stable";
  conditions.push({ id: 1, name: "prototype 属 M1 五类", ok: c1, detail: c1 ? undefined : `无效 prototype: ${s.prototypeKey}` });

  // ② 模态栈合法
  const stackKey = [...s.modalityStack].join(",");
  const c2 = VALID_STACKS.some((v) => v.join(",") === stackKey);
  conditions.push({ id: 2, name: "模态栈合法", ok: c2, detail: c2 ? undefined : `非法模态栈: [${stackKey}]` });

  // ③ 必填 slot 均存在且有合法 strategy token
  const filled = new Map(s.slots.map((sl) => [sl.key, sl.strategyKey]));
  const missing: string[] = [];
  for (const modality of s.modalityStack) {
    for (const req of requiredSlotsFor(modality, s.prototypeKey)) {
      const strat = filled.get(req);
      if (!filled.has(req)) {
        missing.push(`${req}(缺)`);
      } else if (!strat) {
        missing.push(`${req}(待填)`);
      } else if (!resolveToken(strat, { expectedKind: "strategy", parent: req }).known) {
        missing.push(`${req}(策略非法)`);
      }
    }
  }
  const c3 = missing.length === 0;
  conditions.push({ id: 3, name: "必填 slot 完备", ok: c3, detail: c3 ? undefined : `未就绪: ${missing.join(", ")}` });

  // ④ required 待决策均已 accepted_default / user_resolved
  const unresolved = s.pendingDecisions
    .filter((d) => d.required && d.status !== "accepted_default" && d.status !== "user_resolved" && d.status !== "locked_for_render")
    .map((d) => d.key);
  const c4 = unresolved.length === 0;
  conditions.push({ id: 4, name: "required 决策已裁", ok: c4, detail: c4 ? undefined : `未裁决: ${unresolved.join(", ")}` });

  // ⑤ renderer 兼容
  const stackSet = new Set(s.modalityStack);
  const compatible = (rid: RendererId) => RENDERER_REQUIRES[rid].every((m) => stackSet.has(m));
  const c5 = opts?.targetRendererId
    ? compatible(opts.targetRendererId)
    : (Object.keys(RENDERER_REQUIRES) as RendererId[]).some(compatible);
  conditions.push({
    id: 5,
    name: "renderer 兼容",
    ok: c5,
    detail: c5 ? undefined : opts?.targetRendererId ? `${opts.targetRendererId} 不兼容模态栈` : "无兼容 renderer",
  });

  // ⑥ structure hash 可生成（前五条通过即可确定性生成）
  const preHashOk = c1 && c2 && c3 && c4 && c5;
  const hash = preHashOk ? structureHash(s) : undefined;
  conditions.push({ id: 6, name: "structure hash 已生成", ok: Boolean(hash), detail: hash ? undefined : "前置条件未满足，未生成 hash" });

  const blockers = conditions.filter((c) => !c.ok).map((c) => `[条件${c.id}] ${c.name}：${c.detail ?? "未通过"}`);
  const stable = blockers.length === 0;

  return { stable, conditions, blockers, structureHash: hash, draftReadable: true };
}
