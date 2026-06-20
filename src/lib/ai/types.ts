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
}

/** 卡片结构条目。对齐 DATA-SCHEMA §4.2 cardStructure。 */
export interface CardStructureItem {
  index: number;
  type: string;
  title: string;
}

/** 单张卡片的生成 Prompt。对齐 DATA-SCHEMA §4.2 cardPrompts。 */
export interface CardPromptItem {
  index: number;
  prompt: string;
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
