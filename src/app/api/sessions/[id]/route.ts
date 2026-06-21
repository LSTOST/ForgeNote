// ForgeNote M1 — GET /api/sessions/:id（Batch A）。
// 读取单个 session，必须登录，且只能读自己的（RLS 保证）。不做 history 列表。
// 依据：docs/API-CONTRACT.md（§4 权限 / §5.3 返回结构）、docs/DATA-SCHEMA.md（§3.2 / §6 RLS）、
//       Next.js 16 Route Handlers（context.params 为 Promise）。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

type SessionErrorCode = "AUTH_REQUIRED" | "SESSION_NOT_FOUND" | "DATABASE_ERROR";

function httpStatusFor(code: SessionErrorCode): number {
  switch (code) {
    case "AUTH_REQUIRED":
      return 401;
    case "SESSION_NOT_FOUND":
      return 404;
    case "DATABASE_ERROR":
    default:
      return 500;
  }
}

function errorResponse(code: SessionErrorCode, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: httpStatusFor(code) },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1) 鉴权：必须登录（API-CONTRACT §4）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能访问");
  }
  const { supabase } = auth;

  // 2) 校验路径 id。非法 UUID 直接按未找到处理（不泄露存在性）。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("SESSION_NOT_FOUND", "Session 不存在");
  }

  // 3) 查询。RLS 仅返回自己的行；他人/不存在的 id 都返回空 → SESSION_NOT_FOUND。
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, raw_input, intent_type, assumptions, outcome, recipe_snapshot, verification, output_locale, status, created_at",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    return errorResponse("DATABASE_ERROR", "读取 session 失败");
  }
  if (!data) {
    return errorResponse("SESSION_NOT_FOUND", "Session 不存在");
  }

  // 4) 映射为 API-CONTRACT §5.3 的 camelCase 返回结构。
  return Response.json({
    ok: true,
    data: {
      id: data.id,
      rawInput: data.raw_input,
      intentType: data.intent_type,
      assumptions: data.assumptions ?? [],
      outcome: data.outcome,
      recipeSnapshot: data.recipe_snapshot,
      verification: data.verification,
      outputLocale: data.output_locale ?? null,
      status: data.status,
      createdAt: data.created_at,
    },
  });
}
