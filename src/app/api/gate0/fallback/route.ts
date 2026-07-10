import { z } from "zod";

import { logGate0Event } from "@/lib/gate0/events";
import { FALLBACK_REASON_KEYS } from "@/lib/gate0/metrics";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteErrorCode = "VALIDATION_FAILED" | "AUTH_REQUIRED" | "DATABASE_ERROR";

function httpStatusFor(code: RouteErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "AUTH_REQUIRED":
      return 401;
    default:
      return 500;
  }
}

function errorResponse(code: RouteErrorCode, message: string): Response {
  return Response.json({ ok: false, error: { code, message } }, { status: httpStatusFor(code) });
}

const bodySchema = z.object({
  reasonKey: z.enum(FALLBACK_REASON_KEYS),
  taskId: z.string().uuid().nullish(),
  note: z.string().max(160).optional(),
});

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("VALIDATION_FAILED", "请求体不是合法 JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return errorResponse("VALIDATION_FAILED", "请求参数不合法");

  const auth = await getAuthenticatedContext();
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能记录 fallback");
  const { supabase, user } = auth;

  try {
    await logGate0Event({
      supabase,
      userId: user.id,
      eventName: "chatgpt_fallback_logged",
      taskId: parsed.data.taskId ?? null,
      payload: { fallback_reason_key: parsed.data.reasonKey, note: parsed.data.note ?? "" },
    });
  } catch {
    return errorResponse("DATABASE_ERROR", "fallback 记录失败，请稍后重试");
  }

  return Response.json({ ok: true, data: { logged: true } });
}
