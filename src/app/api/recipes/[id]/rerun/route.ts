// ForgeNote M1 — POST /api/recipes/:id/rerun（I-10：换输入重跑）。
// 沿用一条历史配方，对新输入重新生成，落库为一个新的 session（source_recipe_id 指向该配方）。
// 边界（I-10）：必须登录；只重跑当前用户可见、未软删除的 recipe（RLS）；
//   原 recipe 不被覆盖；成功后 usage_count + 1。不做多版本 diff、不做偏好记忆、不改模型 prompt。
// 依据：docs/API-CONTRACT.md（§2 通用响应 / §3 错误码 / §4 权限 / §5.8）、
//       docs/DATA-SCHEMA.md（§3.2 sessions / §3.3 recipes / §6 RLS）、docs/DECISIONS.md（D-04）、
//       docs/PRD-M1.md（§10.5 输入上限）、Next.js 16 Route Handlers（context.params 为 Promise）。

import { z } from "zod";

import { generateContentPackage } from "@/lib/ai/generate";
import type {
  Assumption,
  ForgeGenerationRequest,
  GenerationErrorCode,
  IntentType,
} from "@/lib/ai/types";
import { MAX_INPUT_CHARS } from "@/lib/constants";
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

const idSchema = z.string().uuid();

// 入参：仅 rawInput（新主题/新输入）。配方上下文来自 recipe.fields，不允许覆盖。
const requestBodySchema = z.object({
  rawInput: z.string(),
});

type RouteErrorCode =
  | GenerationErrorCode
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "RECIPE_NOT_FOUND"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "INPUT_EMPTY":
    case "INPUT_TOO_LONG":
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "RECIPE_NOT_FOUND":
      return 404;
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

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringList(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string").join("、");
}

function normalizeIntent(value: unknown): IntentType {
  return INTENT_TYPES.includes(value as IntentType)
    ? (value as IntentType)
    : "content_package";
}

/**
 * 从配方快照（recipe.fields）派生重跑用的假设条。
 * 把配方的核心维度作为 source="recipe" 的上下文喂给生成引擎，使新输入「沿用该配方」。
 * 只取有值的维度，缺失维度跳过；不写死平台/语言（v5 折叠边界：不扩散写死中文/小红书）。
 */
function buildRecipeAssumptions(fields: Record<string, unknown>): Assumption[] {
  const dims: Array<{ key: string; label: string; value: string | null }> = [
    { key: "audience", label: "受众", value: asString(fields.audience) },
    { key: "goal", label: "目标", value: asString(fields.goal) },
    { key: "tone", label: "语气", value: asString(fields.tone) },
    { key: "visual_style", label: "视觉风格", value: asString(fields.visualStyle) },
    { key: "structure", label: "结构", value: asStringList(fields.structure) || null },
  ];

  return dims
    .filter((dim): dim is { key: string; label: string; value: string } =>
      Boolean(dim.value),
    )
    .map((dim) => ({
      key: dim.key,
      label: dim.label,
      value: dim.value,
      valueType: "text",
      source: "recipe",
      state: "default",
      editable: true,
    }));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
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

  // 2) 鉴权（API-CONTRACT §4：写入必须登录）。未登录 → AUTH_REQUIRED，不查库、不调用模型。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能重跑配方");
  }
  const { supabase, user } = auth;

  // 3) 校验路径 id。非法 UUID 按不存在处理，不暴露内部校验细节。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("RECIPE_NOT_FOUND", "配方不存在");
  }

  // 4) 输入业务校验（与 /api/forge 对齐：空 / 超长）。
  const rawInput = parsed.data.rawInput;
  if (rawInput.trim().length === 0) {
    return errorResponse("INPUT_EMPTY", "输入内容不能为空");
  }
  if (rawInput.length > MAX_INPUT_CHARS) {
    return errorResponse("INPUT_TOO_LONG", `输入已超过 ${MAX_INPUT_CHARS} 字`);
  }

  // 5) 读取来源 recipe（RLS + user_id + 未软删除）。他人/不存在/已删除 → RECIPE_NOT_FOUND。
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, intent_type, fields, usage_count")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (recipeError) {
    return errorResponse("DATABASE_ERROR", "读取配方失败，请稍后重试");
  }
  if (!recipe) {
    return errorResponse("RECIPE_NOT_FOUND", "配方不存在");
  }

  // 6) 组装引擎请求：intentType 与假设沿用配方，sourceRecipeId 指向该配方。
  const fields = (recipe.fields ?? {}) as Record<string, unknown>;
  const intentType = normalizeIntent(recipe.intent_type);
  const generationRequest: ForgeGenerationRequest = {
    rawInput,
    intentType,
    assumptions: buildRecipeAssumptions(fields),
    sourceRecipeId: recipe.id,
  };

  // 7) 真实生成（缺 env / 上游错误 / 解析失败均在内部降级为失败结果）。
  const result = await generateContentPackage(generationRequest);

  // 8) 失败：落 D-04 草稿（status=draft、outcome=null、error_code/message），source_recipe_id 关联。
  //    失败时不增加 usage_count（仅成功重跑计数）。
  if (!result.ok) {
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
        source_recipe_id: recipe.id,
        status: "draft",
        error_code: result.error.code,
        error_message: result.error.message,
      })
      .select("id")
      .single();

    if (error || !data) {
      return errorResponse("DATABASE_ERROR", "草稿保存失败，请稍后重试", {
        retryable: true,
      });
    }

    return errorResponse(result.error.code, result.error.message, {
      retryable: result.error.retryable,
      draft: { ...result.draft, sessionId: data.id },
    });
  }

  // 9) 成功：落 completed session（source_recipe_id 关联，原 recipe 不被覆盖）。
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
      source_recipe_id: recipe.id,
      status: "completed",
      error_code: null,
      error_message: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return errorResponse("DATABASE_ERROR", "生成结果保存失败，请稍后重试", {
      retryable: true,
    });
  }

  // 10) 成功后 usage_count + 1（API-CONTRACT §5.8）。
  //     已基于已读到的 usage_count 自增；写失败不回滚 session（重跑已成功），仅忽略计数误差。
  await supabase
    .from("recipes")
    .update({ usage_count: (recipe.usage_count ?? 0) + 1 })
    .eq("id", recipe.id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  // 11) 成功响应：与 POST /api/forge 一致，返回新的 sessionId。
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
    },
  });
}
