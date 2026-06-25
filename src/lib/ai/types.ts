// ForgeNote M1 — AI 生成契约类型（I-02A）。
// 仅定义类型，不实现任何请求逻辑。
// 不引用 OpenAI / OpenRouter / Supabase 或浏览器 API。
// 依据：docs/API-CONTRACT.md §5.1 / §6、docs/DATA-SCHEMA.md §2 / §4、docs/DECISIONS.md（D-01 / D-04 / 模型网关决策）。

/** 内容意图类型。对齐 DATA-SCHEMA §2.1；D-01：禁止使用 xiaohongshu_card_prompt。 */
export type IntentType =
  | "content_package"
  | "xiaohongshu_note"
  | "card_prompt"
  | "generic_content";

/** 假设条来源。对齐 DATA-SCHEMA §2.2。 */
export type AssumptionSource = "inferred" | "profile" | "manual" | "recipe";

/** 假设条状态。对齐 DATA-SCHEMA §2.3（profile 是 source，不是 state）。 */
export type AssumptionState = "default" | "edited" | "dismissed";

/** 假设条值类型。对齐 DATA-SCHEMA §4.1（扩展 bool / list）。 */
export type AssumptionValueType = "text" | "number" | "enum" | "bool" | "list";

/** 假设条置信度。DSN-01：用于区分高确定、推断、拿不准。 */
export type AssumptionConfidence = "high" | "inferred" | "unsure";

/** 单条假设。 */
export interface Assumption {
  key: string;
  label: string;
  value: string;
  valueType: AssumptionValueType;
  source: AssumptionSource;
  state: AssumptionState;
  editable: boolean;
  highlight?: boolean;
  /** 这条判断的依据，面向用户展示。 */
  rationale?: string;
  /** 这条判断的置信度，面向 UI 做轻提示。 */
  confidence?: AssumptionConfidence;
}

/** 生成前可向用户追问的澄清问题。 */
export interface Question {
  key: string;
  prompt: string;
  reason: string;
  optional: boolean;
}

/** 一次 Forge 生成请求。 */
export interface ForgeGenerationRequest {
  rawInput: string;
  intentType: IntentType;
  assumptions: Assumption[];
  answers?: Record<string, string>;
  sourceRecipeId?: string | null;
  /**
   * I-16：目标输出语言 / 表达偏好（自由文本，如 zh-Hans / en-US / "English for Instagram carousel"）。
   * 可选、nullable；缺省/为 null 时保持现有行为，不做多语言系统、不与国家/平台绑定、不是 enum。
   */
  outputLocale?: string | null;
  /**
   * DSN-01：冷启动账号上下文。用户可选粘贴一条过往帖，帮助推断本次假设。
   * 不等于账号画像，不持久化为偏好；是否持久化另票决定。
   */
  accountPost?: string | null;
}

/** 卡片结构条目。对齐 DATA-SCHEMA §4.2 cardStructure。 */
export interface CardStructureItem {
  index: number;
  type: string;
  title: string;
}

/** 单张卡片的逐页文案。字段名沿用 DATA-SCHEMA §4.2 cardPrompts；I-22 起语义改为可发布初稿。 */
export interface CardPromptItem {
  index: number;
  /** 兼容旧契约：I-22 起这里应写逐页卡片文案，而不是绘图 prompt。 */
  prompt: string;
  /** I-22：该页可直接放进卡片的正文 / 要点。旧 session 可为空。 */
  body?: string;
  /** I-22：该页配图方向。旧 session 可为空，UI 会回退展示 prompt。 */
  visualDirection?: string;
}

/**
 * 完整内容包（content_package 主线）。
 * 字段命名与结构对齐 DATA-SCHEMA §4.2 / API-CONTRACT §5.1。
 */
export interface ContentPackage {
  positioning: string;
  titles: string[];
  body: string;
  cardStructure: CardStructureItem[];
  cardPrompts: CardPromptItem[];
  hashtags: string[];
  commentGuide: string;
}

/** 内容配方草稿。对齐 DATA-SCHEMA §4.3。 */
export interface RecipeDraft {
  name: string;
  intentType: IntentType;
  audience: string;
  goal: string;
  tone: string;
  structure: string[];
  visualStyle: string;
  negativeRules: string[];
  variables: string[];
  acceptance: string[];
}

/** 单项验收检查。对齐 DATA-SCHEMA §4.4 checks[]。 */
export interface VerificationCheck {
  key: string;
  label: string;
  passed: boolean;
  message?: string;
}

/** 验收结果。对齐 DATA-SCHEMA §4.4：overallPassed + checks，不再使用裸数组。 */
export interface Verification {
  overallPassed: boolean;
  checks: VerificationCheck[];
}

/** 生成错误码。对齐 API-CONTRACT §3 + MODEL-INTEGRATION §3 / §5。 */
export type GenerationErrorCode =
  | "GENERATION_FAILED"
  | "MODEL_NOT_CONFIGURED"
  | "INPUT_EMPTY"
  | "INPUT_TOO_LONG";

/** 生成错误。 */
export interface GenerationError {
  code: GenerationErrorCode;
  message: string;
  retryable: boolean;
}

/** 生成成功结果。 */
export interface ForgeGenerationSuccess {
  ok: true;
  intentType: IntentType;
  assumptions: Assumption[];
  questions: Question[];
  outcome: ContentPackage;
  recipe: RecipeDraft;
  verification: Verification;
}

/**
 * 失败时保留的 Session 草稿（D-04）。
 * 输入与假设不丢失，status=draft、outcome=null、errorCode 为明确错误码。
 */
export interface ForgeGenerationDraft {
  rawInput: string;
  intentType: IntentType;
  assumptions: Assumption[];
  status: "draft";
  outcome: null;
  errorCode: GenerationErrorCode;
}

/** 生成失败结果。失败时保留草稿（D-04）。 */
export interface ForgeGenerationFailure {
  ok: false;
  error: GenerationError;
  draft: ForgeGenerationDraft;
}

/** 生成响应：成功 / 失败可区分联合类型。 */
export type ForgeGenerationResponse =
  | ForgeGenerationSuccess
  | ForgeGenerationFailure;
