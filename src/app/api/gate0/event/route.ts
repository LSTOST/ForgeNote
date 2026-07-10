import { z } from "zod";

import { logGate0Event } from "@/lib/gate0/events";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientEventName = "render_artifact_copied" | "radar_card_selected";

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
  eventName: z.enum(["render_artifact_copied", "radar_card_selected"] satisfies ClientEventName[]),
  taskId: z.string().uuid().nullish(),
  payload: z.record(z.string(), z.unknown()).optional(),
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
  if (!auth) return errorResponse("AUTH_REQUIRED", "需要登录后才能记录事件");
  const { supabase, user } = auth;

  try {
    await logGate0Event({
      supabase,
      userId: user.id,
      eventName: parsed.data.eventName,
      taskId: parsed.data.taskId ?? null,
      payload: parsed.data.payload,
    });
  } catch {
    return errorResponse("DATABASE_ERROR", "事件记录失败，请稍后重试");
  }

  return Response.json({ ok: true, data: { logged: true } });
}
