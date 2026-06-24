// ForgeNote M1 — POST /api/forge（Batch A：真实生成 + session 持久化）。
// 流程：校验输入 → 识别登录用户 → 调用服务端模型层 → 写入 sessions → 返回 API-CONTRACT 通用响应。
// 边界（Batch A）：必须登录（无可识别用户 → AUTH_REQUIRED，不调用 OpenRouter、不落库）；
//   不创建假 user，不绕过 RLS 写匿名数据。
// D-04：生成失败仍持久化草稿（status=draft、outcome=null、error_code），输入与假设保留。
// 依据：docs/API-CONTRACT.md（§2 通用响应 / §3 错误码 / §4 权限 / §5.1）、docs/DATA-SCHEMA.md（§3.2 / §6 RLS）、
//       docs/DECISIONS.md（D-04）、docs/PRD-M1.md（§10.5 输入上限）、Next.js 16 Route Handlers。

import { z } from "zod";

import { generateContentPackage } from "@/lib/ai/generate";
import type {
  Assumption,
  ForgeGenerationRequest,
  GenerationErrorCode,
  IntentType,
} from "@/lib/ai/types";
import {
  MAX_ACCOUNT_POST_CHARS,
  MAX_INPUT_CHARS,
  MAX_OUTPUT_LOCALE_CHARS,
  normalizeOutputLocale,
} from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/supabase/server";

// 模型调用与 Auth cookie 读取需在 Node 运行时执行，禁止静态化。
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
  rationale: z.string().optional(),
  confidence: z.enum(["high", "inferred", "unsure"]).optional(),
});

// 入参 schema：仅 rawInput 必填；其余可选并有默认值。
const requestBodySchema = z.object({
  rawInput: z.string(),
  intentType: z.enum(INTENT_TYPES).optional(),
  assumptions: z.array(assumptionSchema).optional(),
  sourceRecipeId: z.string().uuid().nullish(),
  // I-16：可选 outputLocale（自由文本，超长 → VALIDATION_FAILED；旧请求不传仍可用）。
  outputLocale: z.string().max(MAX_OUTPUT_LOCALE_CHARS).nullish(),
  // DSN-01：可选过往帖冷启动。兼容 camelCase 与 snake_case。
  accountPost: z.string().max(MAX_ACCOUNT_POST_CHARS).nullish(),
  account_post: z.string().max(MAX_ACCOUNT_POST_CHARS).nullish(),
});

/** route 层错误码：模型层错误码 + 校验/鉴权/数据库错误（API-CONTRACT §3）。 */
type RouteErrorCode =
  | GenerationErrorCode
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "DATABASE_ERROR";

/** 错误码 → HTTP 状态（API-CONTRACT §3；MODEL_NOT_CONFIGURED 取 503 表“未配置/暂不可用”）。 */
function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "INPUT_EMPTY":
    case "INPUT_TOO_LONG":
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "MODEL_NOT_CONFIGURED":
      return 503;
    case "DATABASE_ERROR":
    case "GENERATION_FAILED":
    default:
      return 500;
  }
}

function errorResponse(
  code: RouteErrorCode,
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

  // 2) 鉴权（API-CONTRACT §4：POST /api/forge 必须登录）。
  //    无可识别用户 → AUTH_REQUIRED，绝不调用 OpenRouter、绝不落库。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能生成");
  }
  const { supabase, user } = auth;

  // 3) 业务校验（API-CONTRACT §5.1）。
  const rawInput = parsed.data.rawInput;
  if (rawInput.trim().length === 0) {
    return errorResponse("INPUT_EMPTY", "输入内容不能为空");
  }
  if (rawInput.length > MAX_INPUT_CHARS) {
    return errorResponse("INPUT_TOO_LONG", `输入已超过 ${MAX_INPUT_CHARS} 字`);
  }

  // 4) 组装引擎请求：缺省 intentType=content_package、assumptions=[]。
  //    I-16：outputLocale 归一化（trim；空串→null），可选。
  const outputLocale = normalizeOutputLocale(parsed.data.outputLocale);
  const accountPost =
    normalizeOutputLocale(parsed.data.accountPost) ??
    normalizeOutputLocale(parsed.data.account_post);
  const generationRequest: ForgeGenerationRequest = {
    rawInput,
    intentType: parsed.data.intentType ?? "content_package",
    assumptions: parsed.data.assumptions ?? [],
    sourceRecipeId: parsed.data.sourceRecipeId ?? null,
    outputLocale,
    accountPost,
  };
  // I-16 additive：仅当 outputLocale 非空时才写 output_locale 列。
  //   这样未指定 locale 的既有流程，即使 0002 migration 尚未应用也不依赖该列、不回归。
  const localePatch = outputLocale !== null ? { output_locale: outputLocale } : {};

  // 5) 真实生成（缺 env / 上游错误 / 解析失败均在内部降级为失败结果，不抛到这里）。
  const result = await generateContentPackage(generationRequest);

  // 6) 持久化到 sessions（RLS 以登录用户身份写入 user_id；不绕过 RLS）。
  if (!result.ok) {
    // 失败：落 D-04 草稿（status=draft、outcome=null、error_code/message）。
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        raw_input: generationRequest.rawInput,
        intent_type: generationRequest.intentType,
        assumptions: result.draft.assumptions,
        outcome: null,
        recipe_snapshot: null,
        verification: null,
        source_recipe_id: generationRequest.sourceRecipeId,
        ...localePatch,
        status: "draft",
        error_code: result.error.code,
        error_message: result.error.message,
      })
      .select("id")
      .single();

    if (error || !data) {
      // 草稿写失败：返回 DATABASE_ERROR，输入不丢（前端保留输入与假设）。
      return errorResponse("DATABASE_ERROR", "草稿保存失败，请稍后重试", {
        retryable: true,
      });
    }

    // 草稿已落库：返回原始生成错误码 + 含 sessionId 的草稿（D-04，可稍后重试）。
    return errorResponse(result.error.code, result.error.message, {
      retryable: result.error.retryable,
      draft: { ...result.draft, sessionId: data.id },
    });
  }

  // 成功：落 completed session。
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      raw_input: generationRequest.rawInput,
      intent_type: result.intentType,
      assumptions: result.assumptions,
      outcome: result.outcome,
      recipe_snapshot: result.recipe,
      verification: result.verification,
      source_recipe_id: generationRequest.sourceRecipeId,
      ...localePatch,
      status: "completed",
      error_code: null,
      error_message: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    // 已生成但写库失败：返回 DATABASE_ERROR，输入不丢。
    return errorResponse("DATABASE_ERROR", "生成结果保存失败，请稍后重试", {
      retryable: true,
    });
  }

  // 7) 成功：API-CONTRACT 通用成功格式，Batch A 起返回 sessionId。
  return Response.json({
    ok: true,
    data: {
      sessionId: data.id,
      intentType: result.intentType,
      assumptions: result.assumptions,
      questions: result.questions,
      outcome: result.outcome,
      recipe: result.recipe,
      verification: result.verification,
      outputLocale,
    },
  });
}
