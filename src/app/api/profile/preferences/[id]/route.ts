// ForgeNote M1 — PUT / DELETE /api/profile/preferences/:id（I-11）。
// 更新单条偏好的 value / 删除单条偏好。仅当前用户可见可改（RLS + user_id 条件）。
// 边界（I-11）：必须登录；他人 / 不存在的 id 一律 PREFERENCE_NOT_FOUND，不泄露存在性。
// 依据：docs/API-CONTRACT.md（§3 / §4 / §5.10 / §5.11）、docs/DATA-SCHEMA.md（§3.4 / §6 RLS）。

import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const MAX_VALUE = 500;
const updateSchema = z.object({ value: z.string().max(MAX_VALUE) });

type RouteErrorCode =
  | "VALIDATION_FAILED"
  | "AUTH_REQUIRED"
  | "PREFERENCE_NOT_FOUND"
  | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    case "PREFERENCE_NOT_FOUND":
      return 404;
    case "DATABASE_ERROR":
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: httpStatusFor(code) },
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1) 解析 body。
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_FAILED", "请求参数不合法");
  }

  // 2) 鉴权。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能修改偏好");
  }
  const { supabase, user } = auth;

  // 3) 校验路径 id。非法 UUID 按不存在处理（不泄露存在性）。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("PREFERENCE_NOT_FOUND", "偏好不存在");
  }

  // 4) value trim 非空。
  const value = parsed.data.value.trim();
  if (value.length === 0) {
    return errorResponse("VALIDATION_FAILED", "偏好值不能为空");
  }

  // 5) 仅更新当前用户可见的该行；RLS + user_id 共同保证不影响他人。
  const { data, error } = await supabase
    .from("profile_preferences")
    .update({ value })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return errorResponse("DATABASE_ERROR", "修改偏好失败，请稍后重试");
  }
  if (!data) {
    return errorResponse("PREFERENCE_NOT_FOUND", "偏好不存在");
  }

  return Response.json({ ok: true, data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  // 1) 鉴权。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    return errorResponse("AUTH_REQUIRED", "需要登录后才能删除偏好");
  }
  const { supabase, user } = auth;

  // 2) 校验路径 id。
  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponse("PREFERENCE_NOT_FOUND", "偏好不存在");
  }

  // 3) 硬删除当前用户的该行（偏好无软删除列；他人/不存在 → PREFERENCE_NOT_FOUND）。
  const { data, error } = await supabase
    .from("profile_preferences")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return errorResponse("DATABASE_ERROR", "删除偏好失败，请稍后重试");
  }
  if (!data) {
    return errorResponse("PREFERENCE_NOT_FOUND", "偏好不存在");
  }

  return Response.json({ ok: true, data: { deleted: true } });
}
