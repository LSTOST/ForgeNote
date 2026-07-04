// ForgeNote M2-05 — 账号大脑（account memory）域类型。
//
// 依据：migration 0003_structure_core.sql（account_memory_items）、CODEX-REVIEW.md §M2-05、
//       方向文档 v3.16（账号大脑：可查看/可关闭/可纠正 + source ledger + freshness）。
// 纯 TS：仅类型，不引用 Next / Supabase / 浏览器 API。
//
// 反编造原则（Codex §5 风险）：每条记忆必须带 source（来源账本）+ 证据；
//   没有来源的"信念"不许进入账号大脑（模型不得把编造当事实）。不存正文文章，只存结构化 body。

/** 记忆类别（对齐 account_memory_items.kind）。 */
export type MemoryKind =
  | "audience" // 受众画像
  | "voice" // 表达习惯
  | "proven_pattern" // 已验证内容规律
  | "rule" // 长期遵循的规则 / 红线
  | "topic" // 常用主题
  | "visual_pref"; // 视觉偏好

export const MEMORY_KINDS: readonly MemoryKind[] = [
  "audience",
  "voice",
  "proven_pattern",
  "rule",
  "topic",
  "visual_pref",
];

/**
 * 来源账本（source ledger，对齐 account_memory_items.source）。
 * 每条记忆的证据来自哪里，决定可信度与是否允许入库。
 */
export type MemorySource =
  | "pasted_post" // 用户粘贴的历史帖
  | "user_observation" // 用户手动输入的观察
  | "curated" // 人工维护的领域动态
  | "cross_platform" // 跨平台迁移推断（置信度降级）
  | "account_match"; // 仅账号匹配（无外部信号）

export const MEMORY_SOURCES: readonly MemorySource[] = [
  "pasted_post",
  "user_observation",
  "curated",
  "cross_platform",
  "account_match",
];

/** 记忆状态（对齐 account_memory_items.status）。 */
export type MemoryStatus = "active" | "revised" | "dismissed";

/** 单条账号记忆（应用层，镜像 account_memory_items 行）。 */
export interface AccountMemoryItem {
  kind: MemoryKind;
  /** 结构化信念（machine-friendly；不存正文文章）。 */
  body: Record<string, unknown>;
  source: MemorySource;
  /** 证据条数（用于 UI 显示"验证 ×N"，不是伪精确热度）。 */
  evidenceCount: number;
  /** 证据新鲜度（ISO 时间戳；由入库时赋值）。 */
  freshnessAt: string;
  status: MemoryStatus;
}

/** 首屏账号接入的原始输入（用户粘贴，不做平台 API 抓取）。 */
export interface AccountIntakeInput {
  /** 平台 profile 文本 / 链接（自由文本）。 */
  profileText: string;
  /** 近期内容（粘贴的历史帖，逐条）。 */
  recentPosts: readonly string[];
  /** 表现数据（粘贴的截图文本 / 手填）。 */
  performanceNotes?: readonly string[];
  /** 平台标识（metadata，如 xiaohongshu / x）。 */
  platform?: string;
}

/** 入库结果：保留的记忆 + 被丢弃的编造项（透明可审计）。 */
export interface AccountIntakeResult {
  ok: boolean;
  items: AccountMemoryItem[];
  /** 被丢弃的项及原因（无来源 / 未知类别 / 无证据 = 疑似编造）。 */
  dropped: { reason: string; raw: unknown }[];
  errorCode?: "MODEL_NOT_CONFIGURED" | "GENERATION_FAILED";
  errorMessage?: string;
}
