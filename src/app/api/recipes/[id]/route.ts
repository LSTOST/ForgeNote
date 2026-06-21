// ForgeNote M1 — DELETE /api/recipes/:id（I-09：配方库删除）。
// 软删除当前登录用户可见的单条 recipe。RLS + user_id 条件共同保证不会影响他人记录。
// 依据：docs/API-CONTRACT.md（§2 通用响应 / §3 错误码 / §4 权限 / §5.7）、
//       docs/DATA-SCHEMA.md（§3.3 deleted_at / §6 RLS）、Next.js 16 Route Handlers。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

type RecipeRouteErrorCode =
  | "AUTH_REQUIRED"
  | "RECIPE_NOT_FOUND"
  | "DATABASE_ERROR";

function httpStatusFor(code: RecipeRouteErrorCode): number {
  switch (code) {
    case "AUTH_REQUIRED":
      return 401;
    case "RECIPE_NOT_FOUND":
      return 404;
    case "DATABASE_ERROR":
    default:
      return 500;
  }
}

function errorResponse(code: RecipeRouteErrorCode, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: httpStatusFor(code) },
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1) 鉴权：删除是写操作，必须登录（API-CONTRACT §4）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能删除配方");
  }
  const { supabase, user } = auth;

  // 2) 校验路径 id。非法 UUID 直接按不存在处理，不暴露内部校验细节。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("RECIPE_NOT_FOUND", "配方不存在");
  }

  // 3) 软删除：只更新当前用户、未删除、且 RLS 可见的记录。
  //    他人/不存在/已删除均返回空 → RECIPE_NOT_FOUND。
  const { data, error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return errorResponse("DATABASE_ERROR", "删除配方失败，请稍后重试");
  }
  if (!data) {
    return errorResponse("RECIPE_NOT_FOUND", "配方不存在");
  }

  return Response.json({ ok: true, data: { deleted: true } });
}
