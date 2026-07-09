import type { SupabaseClient } from "@supabase/supabase-js";

import type { Gate0EventName } from "./metrics";

const PAYLOAD_TEXT_LIMIT = 160;

export async function logGate0Event(args: {
  supabase: SupabaseClient;
  userId: string;
  eventName: Gate0EventName;
  taskId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await args.supabase.from("usage_events").insert({
      user_id: args.userId,
      task_id: args.taskId ?? null,
      event_name: args.eventName,
      event_payload: sanitizePayload(args.payload ?? {}),
    });
  } catch {
    // Gate 0 telemetry must never break the creation path.
  }
}

export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      out[key] = value.slice(0, PAYLOAD_TEXT_LIMIT);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.filter((v) => typeof v === "string").map((v) => v.slice(0, PAYLOAD_TEXT_LIMIT)).slice(0, 20);
    } else if (value && typeof value === "object") {
      out[key] = sanitizePayload(value as Record<string, unknown>);
    }
  }
  return out;
}
