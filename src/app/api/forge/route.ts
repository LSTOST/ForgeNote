// ForgeNote M1 — POST /api/forge（I-02B）。
// 创建一次生成任务：校验输入 → 调用服务端模型层 → 返回 API-CONTRACT 通用响应。
// I-02B 边界：不接 Supabase、不接登录、不持久化 session、不写假 user/session 逻辑。
// D-04 草稿在本阶段以响应体 draft 表达（不入库）。
// 依据：docs/API-CONTRACT.md（§2 通用响应 / §3 错误码 / §5.1）、docs/PRD-M1.md（§10.5 输入上限）、
//       docs/DATA-SCHEMA.md §2.1、Next.js 16 Route Handlers（node_modules/next/dist/docs）。

import { z } from "zod";

import { generateContentPackage } from "@/lib/ai/generate";
import type {
  Assumption,
  ForgeGenerationRequest,
  GenerationErrorCode,
  IntentType,
} from "@/lib/ai/types";
import { MAX_INPUT_CHARS } from "@/lib/constants";

// 模型调用需在 Node 运行时执行，禁止静态化。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTENT_TYPES = [
  "content_package",
  "xiaohongshu_note",
  "card_prompt",
  "generic_content",
] as const satisfies readonly IntentType[];

const assumptionSchema: z.ZodType<Assumption> = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  valueType: z.enum(["text", "number", "enum", "bool", "list"]),
  source: z.enum(["inferred", "profile", "manual", "recipe"]),
  state: z.enum(["default", "edited", "dismissed"]),
  editable: z.boolean(),
  highlight: z.boolean().optional(),
});

// 入参 schema：仅 rawInput 必填；其余可选并有默认值。
const requestBodySchema = z.object({
  rawInput: z.string(),
  intentType: z.enum(INTENT_TYPES).optional(),
  assumptions: z.array(assumptionSchema).optional(),
  sourceRecipeId: z.string().nullish(),
});

/** 错误码 → HTTP 状态（API-CONTRACT §3；MODEL_NOT_CONFIGURED 取 503 表“未配置/暂不可用”）。 */
function httpStatusFor(code: GenerationErrorCode | "VALIDATION_FAILED"): number {
  switch (code) {
    case "INPUT_EMPTY":
    case "INPUT_TOO_LONG":
    case "VALIDATION_FAILED":
      return 400;
    case "MODEL_NOT_CONFIGURED":
      return 503;
    case "GENERATION_FAILED":
    default:
      return 500;
  }
}

function errorResponse(
  code: GenerationErrorCode | "VALIDATION_FAILED",
  message: string,
  options?: { retryable?: boolean; draft?: unknown },
): Response {
  const error: Record<string, unknown> = { code, message };
  if (options?.retryable !== undefined) error.retryable = options.retryable;

  const payload: Record<string, unknown> = { ok: false, error };
  if (options?.draft !== undefined) payload.draft = options.draft;

  return Response.json(payload, { status: httpStatusFor(code) });
}

export async function POST(request: Request): Promise<Response> {
  // 1) 解析 body。非法 JSON / 结构不符 → VALIDATION_FAILED。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  }

  // 2) 业务校验（API-CONTRACT §5.1）。
  const rawInput = parsed.data.rawInput;
  if (rawInput.trim().length === 0) {
    return errorResponse("INPUT_EMPTY", "输入内容不能为空");
  }
  if (rawInput.length > MAX_INPUT_CHARS) {
    return errorResponse(
      "INPUT_TOO_LONG",
      `输入已超过 ${MAX_INPUT_CHARS} 字`,
    );
  }

  // 3) 组装引擎请求：缺省 intentType=content_package、assumptions=[]。
  const generationRequest: ForgeGenerationRequest = {
    rawInput,
    intentType: parsed.data.intentType ?? "content_package",
    assumptions: parsed.data.assumptions ?? [],
    sourceRecipeId: parsed.data.sourceRecipeId ?? null,
  };

  // 4) 真实生成（缺 env / 上游错误 / 解析失败均在内部降级为失败草稿，不抛到这里）。
  const result = await generateContentPackage(generationRequest);

  if (!result.ok) {
    // 失败：返回错误码 + D-04 草稿（不入库，仅响应体表达）。
    return errorResponse(result.error.code, result.error.message, {
      retryable: result.error.retryable,
      draft: result.draft,
    });
  }

  // 5) 成功：API-CONTRACT 通用成功格式。I-02B 不接库，故不返回 sessionId。
  return Response.json({
    ok: true,
    data: {
      intentType: result.intentType,
      assumptions: result.assumptions,
      questions: result.questions,
      outcome: result.outcome,
      recipe: result.recipe,
      verification: result.verification,
    },
  });
}
