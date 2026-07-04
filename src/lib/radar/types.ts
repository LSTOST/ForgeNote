// ForgeNote M2-06 — 选题雷达域类型。
//
// 依据：migration 0003/0004（radar_cards）、M2-00 裁决（无伪热度，用来源标签）、方向文档 v3.16、
//       CODEX-REVIEW.md（雷达数据诚实性：无 API/爬虫时数字热度是伪精确）。
// 纯 TS：仅类型，不引用 Next / Supabase / 浏览器 API。

/** 内容原型 machine_key（M1 五类；与 registry prototype 对齐）。 */
export type PrototypeKey =
  | "experience_recap"
  | "knowledge_explainer"
  | "checklist_guide"
  | "opinion_argument"
  | "case_breakdown";

/**
 * 证据来源标签（M2-00：替代伪热度数字）。回答"为什么建议这个选题"，透明可核。
 * - account_match：题材/角度符合账号（无外部信号）。
 * - recent_signal：近期信号（用户粘贴的领域观察）。
 * - historically_effective：历史有效（该题材/结构在账号历史表现好）。
 * - low_evidence：低证据（试探性，上限高但未验证）。
 */
export type EvidenceSource = "account_match" | "recent_signal" | "historically_effective" | "low_evidence";

export const EVIDENCE_SOURCES: readonly EvidenceSource[] = [
  "account_match",
  "recent_signal",
  "historically_effective",
  "low_evidence",
];

/** 选题卡状态（对齐 radar_cards.status）。 */
export type RadarCardStatus = "proposed" | "selected" | "skipped";

/** 单张选题卡（应用层，镜像 radar_cards 行；刻意无数字热度字段）。 */
export interface RadarCard {
  /** 选题方向（具体，非泛泛）。 */
  topic: string;
  /** 建议内容原型（machine_key，registry 校验）；未定则 undefined。 */
  prototypeKey?: PrototypeKey;
  /** 钩子示例（短，帮用户判断）。 */
  hookExample?: string;
  /** 建议平台（metadata，M2-00 放宽允许显示；如 xiaohongshu / x）。 */
  suggestedPlatform?: string;
  /** 来源标签（为什么建议它；替代伪热度）。 */
  evidenceSource: EvidenceSource;
  /** 依据来源引用（指向账号记忆规律 / 领域观察；可核）。 */
  evidenceRefs: string[];
  status: RadarCardStatus;
}

/** 雷达生成输入：账号大脑摘要 + 可选近期领域观察。 */
export interface RadarInput {
  /** 账号大脑摘要（受众/声音/已验证规律/主题，短文本）。 */
  accountSummary: {
    audience?: string;
    voice?: string;
    provenPatterns?: readonly string[];
    topics?: readonly string[];
  };
  /** 用户粘贴的近期领域观察（每条一句），作为 recent_signal 依据。 */
  recentObservations?: readonly string[];
  /** 生成张数（默认 5）。 */
  count?: number;
}

/** 雷达生成结果：保留的卡 + 丢弃的伪造/非法项（透明可审计）。 */
export interface RadarResult {
  ok: boolean;
  cards: RadarCard[];
  dropped: { reason: string; raw: unknown }[];
  errorCode?: "MODEL_NOT_CONFIGURED" | "GENERATION_FAILED";
  errorMessage?: string;
}
