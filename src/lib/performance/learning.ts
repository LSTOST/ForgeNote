export const PERFORMANCE_RANGE_VALUES = ["0", "1-10", "11-50", "51-100", "101-500", "500+", "unknown"] as const;

export type PerformanceRange = (typeof PERFORMANCE_RANGE_VALUES)[number];
export type LearningSignal = "validated" | "invalidated" | "new_signal";

export interface PerformanceLearningInput {
  taskId?: string | null;
  platform?: string | null;
  metrics: Record<string, unknown>;
  vsMedian?: string | null;
  note?: string | null;
  learningSignal: LearningSignal;
}

export function buildPerformanceMemoryBody(input: PerformanceLearningInput): Record<string, unknown> {
  return sanitizeObject({
    signal: input.learningSignal,
    platform: input.platform ?? "",
    taskId: input.taskId ?? "",
    vsMedian: input.vsMedian ?? "",
    metrics: input.metrics,
    learning: summarizeLearning(input.learningSignal, input.note),
  });
}

export function summarizeLearning(signal: LearningSignal, note?: string | null): string {
  const prefix: Record<LearningSignal, string> = {
    validated: "本次表现验证了一个账号规律",
    invalidated: "本次表现推翻或削弱了一个账号规律",
    new_signal: "本次表现提供了一个新的账号信号",
  };
  const trimmed = (note ?? "").trim().slice(0, 240);
  return trimmed ? `${prefix[signal]}：${trimmed}` : prefix[signal];
}

function sanitizeObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      if (value.trim()) out[key] = value.slice(0, 280);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeObject(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[key] = nested;
    }
  }
  return out;
}
