// ForgeNote M1 — AI 生成契约类型（I-02A）。
// 仅定义类型，不实现任何请求逻辑。
// 不引用 OpenAI / OpenRouter / Supabase 或浏览器 API。
// 依据：docs/API-CONTRACT.md §6、docs/DATA-SCHEMA.md §4、docs/DECISIONS.md（D-01 / D-04 / 模型网关决策）。

/** 内容意图类型。D-01：禁止使用 xiaohongshu_card_prompt。 */
export type IntentType =
  | "content_package"
  | "xiaohongshu_note"
  | "card_prompt"
  | "generic_content";

/** 假设条状态。 */
export type AssumptionState =
  | "default"
  | "edited"
  | "dismissed"
  | "profile";

/** 单条假设。 */
export interface Assumption {
  key: string;
  label: string;
  value: string;
  source: "inferred" | "profile" | "user";
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

/** 生成结果中的一个展示区块。 */
export interface OutcomeSection {
  key: string;
  label: string;
  content: string;
}

/** 完整内容包（content_package 主线）。 */
export interface ContentPackage {
  positioning: OutcomeSection;
  titleOptions: OutcomeSection;
  body: OutcomeSection;
  cardStructure: OutcomeSection;
  cardPrompts: OutcomeSection;
  hashtags: OutcomeSection;
  commentGuide: OutcomeSection;
}

/** 内容配方草稿。 */
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

/** 单项验收检查。 */
export interface VerificationCheck {
  key: string;
  label: string;
  passed: boolean;
  note?: string;
}

/** 生成错误。 */
export interface GenerationError {
  code: "GENERATION_FAILED" | "MODEL_NOT_CONFIGURED" | "INVALID_INPUT";
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
  verification: VerificationCheck[];
}

/** 生成失败结果。失败时保留草稿（D-04）。 */
export interface ForgeGenerationFailure {
  ok: false;
  error: GenerationError;
  draft: {
    rawInput: string;
    status: "draft";
    outcome: null;
  };
}

/** 生成响应：成功 / 失败可区分联合类型。 */
export type ForgeGenerationResponse =
  | ForgeGenerationSuccess
  | ForgeGenerationFailure;
