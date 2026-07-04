// ForgeNote M2-01 — Structure Token Registry v0。
//
// 依据：docs/design/redefine-2026-07/CODEX-REVIEW.md §1/§2、M2-BUILD-PLAN.md §5、方向文档 v3.16 §2。
//
// 角色：这是"结构层"的封闭词表 + 多语言 display mapping 的单一事实源。
//   - Recipe / 学习 / 统计 / renderer 只能消费 machine_key（本文件的 key），不消费 human label。
//   - human label（zh-Hans / en）只用于 UI 显示，不进入学习层（v3.12 双层认知原则）。
//   - 模型输出不可信：任何 token 必须经 resolveToken 校验；未知 token → pending_mapping / generic_*。
//
// 纯 TS：不引用 Next / Supabase / OpenRouter / 浏览器 API。可被 server 与 client 同时 import。

import type { Locale } from "@/lib/copy";

/** 词表版本。任何 token 的新增/废弃/迁移都必须 bump，并随存储记录（DATA 层存 vocab_version）。 */
export const VOCAB_VERSION = "2026.07.0" as const;

/** token 类别。四层结构：prototype（内容原型）/ modality（表达模态）/ slot（结构槽位）/ strategy（槽位策略）。 */
export type TokenKind = "prototype" | "modality" | "slot" | "strategy";

/**
 * token 状态。
 * - stable：可进入 Recipe / 学习 / renderer 的封闭稳定 token。
 * - candidate：模型可提出，但不得直接写入 Recipe 或作为学习维度（走 candidate→reviewed→stable）。
 * - deprecated：已废弃，靠 deprecatedBy 迁移；旧 Recipe 读时做 alias 映射。
 * - disabled：能力保留但不进入 M1 UI 主路径（如 temporal）。
 */
export type TokenStatus = "candidate" | "stable" | "deprecated" | "disabled";

/** 单条结构 token（machine_key + 多语言 label + 父级约束 + 生命周期）。 */
export interface StructureToken {
  /** machine_key：稳定标识，存储与学习只认它。 */
  key: string;
  kind: TokenKind;
  /** 引入该 token 的词表版本。 */
  version: string;
  status: TokenStatus;
  /**
   * 父级约束（决定合法组合，integrity 校验依据）：
   * - strategy：allowedParents = 可填充的 slot key 列表（必填）。
   * - slot：allowedParents = 所属 modality key 列表（narrative / visual）。
   * - prototype / modality：顶层，省略。
   */
  allowedParents?: readonly string[];
  /** 多语言 label（两种 locale 都必须存在，由 Locale 类型保证）。 */
  labels: Record<Locale, { label: string; description?: string }>;
  /** 历史别名（模型近义漂移 / rename 迁移用）。 */
  aliases?: readonly string[];
  /** deprecated 时指向的替代 key。 */
  deprecatedBy?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// 词表数据 v0
// ────────────────────────────────────────────────────────────────────────────

/** ① 内容原型（M1 五类，封闭）。用户语言的顶层分类，Intent 与 Structure 之间。 */
const PROTOTYPES: readonly StructureToken[] = [
  { key: "experience_recap", kind: "prototype", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "经验复盘", description: "事件 → 误判 → 证据 → 反思 → 方法" }, en: { label: "Experience recap" } } },
  { key: "knowledge_explainer", kind: "prototype", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "知识解释", description: "问题 → 原理 → 判断方法 → 行动建议" }, en: { label: "Knowledge explainer" } } },
  { key: "checklist_guide", kind: "prototype", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "清单指南", description: "场景 → 清单 → 判断标准 → 使用条件" }, en: { label: "Checklist & guide" } } },
  { key: "opinion_argument", kind: "prototype", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "观点表达", description: "观点 → 反例/事实 → 推理 → 收束" }, en: { label: "Opinion & argument" } } },
  { key: "case_breakdown", kind: "prototype", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "案例拆解", description: "对象 → 现象 → 拆解维度 → 可复用结论" }, en: { label: "Case breakdown" } } },
] as const;

/** ② 表达模态。M1 只启用 narrative + visual；temporal 保留能力但 disabled，不进主路径。 */
const MODALITIES: readonly StructureToken[] = [
  { key: "narrative", kind: "modality", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "叙事", description: "线性叙事与观点表达（基座模态）" }, en: { label: "Narrative" } } },
  { key: "visual", kind: "modality", version: VOCAB_VERSION, status: "stable",
    labels: { "zh-Hans": { label: "视觉分层", description: "分卡 / 分屏 / 信息层级（叠加在叙事之上）" }, en: { label: "Visual" } } },
  { key: "temporal", kind: "modality", version: VOCAB_VERSION, status: "disabled",
    labels: { "zh-Hans": { label: "时间轴", description: "镜头节奏（视频，M1 后开放）" }, en: { label: "Temporal" } } },
] as const;

/** ③ 结构 slot（封闭）。allowedParents = 所属模态。 */
const SLOTS: readonly StructureToken[] = [
  { key: "hook", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["narrative"],
    labels: { "zh-Hans": { label: "钩子", description: "决定开头吸引力与共鸣点" }, en: { label: "Hook" } } },
  { key: "context", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["narrative"],
    labels: { "zh-Hans": { label: "情境", description: "提供场景与可信度基础" }, en: { label: "Context" } } },
  { key: "evidence", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["narrative"],
    labels: { "zh-Hans": { label: "证据", description: "支撑洞察的事实 / 数据 / 行为" }, en: { label: "Evidence" } } },
  { key: "insight", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["narrative"],
    labels: { "zh-Hans": { label: "洞察", description: "传递方法论与核心价值" }, en: { label: "Insight" } } },
  { key: "resolution", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["narrative"],
    labels: { "zh-Hans": { label: "收束", description: "提供可执行方案与行动驱动" }, en: { label: "Resolution" } } },
  { key: "layout", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["visual"],
    labels: { "zh-Hans": { label: "布局", description: "分页 / 分卡节奏（视觉分层）" }, en: { label: "Layout" } } },
  { key: "visual_hierarchy", kind: "slot", version: VOCAB_VERSION, status: "stable", allowedParents: ["visual"],
    labels: { "zh-Hans": { label: "视觉层级", description: "封面钩子与信息层级" }, en: { label: "Visual hierarchy" } } },
] as const;

/** ④ 槽位策略 token（半封闭）。allowedParents = 可填充的 slot key。 */
const STRATEGIES: readonly StructureToken[] = [
  // hook
  { key: "problem_hook", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["hook"],
    labels: { "zh-Hans": { label: "问题钩子" }, en: { label: "Problem hook" } } },
  { key: "loss_open", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["hook"],
    labels: { "zh-Hans": { label: "损失开场" }, en: { label: "Loss-framed opening" } }, aliases: ["loss_hook", "pain_opening"] },
  { key: "contrarian_hook", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["hook"],
    labels: { "zh-Hans": { label: "反共识开场" }, en: { label: "Contrarian hook" } } },
  { key: "number_hook", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["hook"],
    labels: { "zh-Hans": { label: "数字开场" }, en: { label: "Number-led hook" } } },
  // context
  { key: "case_evidence", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["context", "evidence"],
    labels: { "zh-Hans": { label: "实例证据" }, en: { label: "Case evidence" } } },
  { key: "scene_context", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["context"],
    labels: { "zh-Hans": { label: "场景铺垫" }, en: { label: "Scene setup" } } },
  // evidence
  { key: "user_behavior", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["evidence"],
    labels: { "zh-Hans": { label: "用户行为" }, en: { label: "Observed behavior" } } },
  { key: "data_point", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["evidence"],
    labels: { "zh-Hans": { label: "数据佐证" }, en: { label: "Data point" } } },
  // insight
  { key: "expectation_reversal", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["insight"],
    labels: { "zh-Hans": { label: "预期反转" }, en: { label: "Expectation reversal" } } },
  { key: "root_cause", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["insight"],
    labels: { "zh-Hans": { label: "根因归纳" }, en: { label: "Root cause" } } },
  { key: "reframe", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["insight"],
    labels: { "zh-Hans": { label: "视角重置" }, en: { label: "Reframe" } } },
  // resolution
  { key: "actionable_steps", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["resolution"],
    labels: { "zh-Hans": { label: "行动步骤" }, en: { label: "Actionable steps" } } },
  { key: "reusable_rule", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["resolution"],
    labels: { "zh-Hans": { label: "可复用守则" }, en: { label: "Reusable rule" } } },
  { key: "decision_rule", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["resolution"],
    labels: { "zh-Hans": { label: "判断法则" }, en: { label: "Decision rule" } } },
  // layout / visual_hierarchy
  { key: "list_cards", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["layout"],
    labels: { "zh-Hans": { label: "清单卡片" }, en: { label: "List + cards" } } },
  { key: "cover_cards_summary", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["layout"],
    labels: { "zh-Hans": { label: "封面·卡·总结" }, en: { label: "Cover → cards → summary" } } },
  { key: "cover_hook", kind: "strategy", version: VOCAB_VERSION, status: "stable", allowedParents: ["visual_hierarchy"],
    labels: { "zh-Hans": { label: "封面钩子" }, en: { label: "Cover hook" } } },
] as const;

/** 全量词表（有序）。 */
export const STRUCTURE_TOKENS: readonly StructureToken[] = [
  ...PROTOTYPES,
  ...MODALITIES,
  ...SLOTS,
  ...STRATEGIES,
];

// ────────────────────────────────────────────────────────────────────────────
// 索引与查询
// ────────────────────────────────────────────────────────────────────────────

const BY_KEY: ReadonlyMap<string, StructureToken> = new Map(STRUCTURE_TOKENS.map((t) => [t.key, t]));
const BY_ALIAS: ReadonlyMap<string, StructureToken> = new Map(
  STRUCTURE_TOKENS.flatMap((t) => (t.aliases ?? []).map((a) => [a, t] as const)),
);

/** 取 token（按 key）。 */
export function getToken(key: string): StructureToken | undefined {
  return BY_KEY.get(key);
}

/** key 是否为已知 token。 */
export function isKnown(key: string): boolean {
  return BY_KEY.has(key);
}

/** token 是否为 stable（可进入 Recipe / 学习 / renderer）。 */
export function isStable(key: string): boolean {
  return BY_KEY.get(key)?.status === "stable";
}

/** 取某类别的全部 token（如 UI 列内容原型 / slot 骨架）。 */
export function listByKind(kind: TokenKind): readonly StructureToken[] {
  return STRUCTURE_TOKENS.filter((t) => t.kind === kind);
}

/** 取 human label（按 locale）；未知 key 回退为 key 本身（UI 不至于空白，但应先经 resolveToken）。 */
export function getLabel(key: string, locale: Locale): string {
  return BY_KEY.get(key)?.labels[locale]?.label ?? key;
}

/** 某 slot 可用的 stable strategy（allowedParents 含该 slot）。供右栏结构编辑列可选项。 */
export function strategiesForSlot(slotKey: string): readonly StructureToken[] {
  return STRUCTURE_TOKENS.filter(
    (t) => t.kind === "strategy" && t.status === "stable" && (t.allowedParents ?? []).includes(slotKey),
  );
}

/** token 解析结果。模型输出必须过这一关。 */
export type TokenResolution =
  | { known: true; token: StructureToken }
  /** 命中别名 → 已迁移到 canonical。 */
  | { known: true; token: StructureToken; aliasedFrom: string }
  /** 未知 → 需要人工映射或降级为 generic_<kind>。 */
  | { known: false; reason: "unknown"; suggestion: string };

/**
 * 解析并校验一个 token key（可选校验类别与父级）。
 * 未知 token 不得直接进入 Recipe / 学习：返回 pending_mapping / generic_<kind> 建议。
 */
export function resolveToken(
  key: string,
  opts?: { expectedKind?: TokenKind; parent?: string },
): TokenResolution {
  const direct = BY_KEY.get(key);
  const viaAlias = direct ? undefined : BY_ALIAS.get(key);
  const token = direct ?? viaAlias;

  if (!token) {
    const suggestion = opts?.expectedKind ? `generic_${opts.expectedKind}` : "pending_mapping";
    return { known: false, reason: "unknown", suggestion };
  }
  if (opts?.expectedKind && token.kind !== opts.expectedKind) {
    return { known: false, reason: "unknown", suggestion: `generic_${opts.expectedKind}` };
  }
  if (opts?.parent && token.allowedParents && !token.allowedParents.includes(opts.parent)) {
    return { known: false, reason: "unknown", suggestion: `generic_${token.kind}` };
  }
  return viaAlias ? { known: true, token, aliasedFrom: key } : { known: true, token };
}

// ────────────────────────────────────────────────────────────────────────────
// 完整性校验（供 M2-02 测试 / CI 调用；不在 import 时自动执行，避免副作用）
// ────────────────────────────────────────────────────────────────────────────

/** 返回词表内部矛盾列表（空数组 = 健康）。非抛出，供 tooling 使用。 */
export function validateRegistry(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const t of STRUCTURE_TOKENS) {
    if (seen.has(t.key)) problems.push(`重复 key: ${t.key}`);
    seen.add(t.key);

    // strategy 的 allowedParents 必须是真实 slot key
    if (t.kind === "strategy") {
      if (!t.allowedParents?.length) {
        problems.push(`strategy ${t.key} 缺 allowedParents（应指向 slot）`);
      }
      for (const p of t.allowedParents ?? []) {
        const parent = BY_KEY.get(p);
        if (!parent || parent.kind !== "slot") problems.push(`strategy ${t.key} 的父级 ${p} 不是合法 slot`);
      }
    }
    // slot 的 allowedParents 必须是真实 modality key
    if (t.kind === "slot") {
      for (const p of t.allowedParents ?? []) {
        const parent = BY_KEY.get(p);
        if (!parent || parent.kind !== "modality") problems.push(`slot ${t.key} 的父级 ${p} 不是合法 modality`);
      }
    }
    // deprecated 必须有 deprecatedBy 且指向真实 key
    if (t.status === "deprecated") {
      if (!t.deprecatedBy || !BY_KEY.has(t.deprecatedBy)) {
        problems.push(`deprecated ${t.key} 的 deprecatedBy 无效`);
      }
    }
  }

  // 别名不得与任何 canonical key 冲突，且别名之间不得重复
  const aliasSeen = new Set<string>();
  for (const t of STRUCTURE_TOKENS) {
    for (const a of t.aliases ?? []) {
      if (BY_KEY.has(a)) problems.push(`别名 ${a}（属于 ${t.key}）与真实 key 冲突`);
      if (aliasSeen.has(a)) problems.push(`别名 ${a} 重复`);
      aliasSeen.add(a);
    }
  }

  return problems;
}

/** 抛出版：词表有矛盾时抛错（供 CI / 启动自检）。 */
export function assertRegistryIntegrity(): void {
  const problems = validateRegistry();
  if (problems.length) {
    throw new Error(`Structure registry integrity failed:\n- ${problems.join("\n- ")}`);
  }
}
