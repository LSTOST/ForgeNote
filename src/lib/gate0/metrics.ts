export const GATE0_EVENT_NAMES = [
  "task_created",
  "radar_card_viewed",
  "radar_card_selected",
  "own_idea_started",
  "brief_generated",
  "structure_generated",
  "structure_slot_edited",
  "decision_resolved",
  "renderer_generated",
  "render_artifact_copied",
  "recipe_saved",
  "recipe_reused",
  "published_marked",
  "performance_filled",
  "chatgpt_fallback_logged",
  "task_completed",
] as const;

export type Gate0EventName = (typeof GATE0_EVENT_NAMES)[number];

export const FALLBACK_REASON_KEYS = [
  "quality_not_enough",
  "too_slow",
  "missing_context",
  "platform_fit_unclear",
  "needed_free_chat",
  "other",
] as const;

export type FallbackReasonKey = (typeof FALLBACK_REASON_KEYS)[number];

export interface Gate0EventRow {
  event_name: string;
  event_payload: unknown;
  task_id: string | null;
  created_at: string;
}

export interface Gate0TaskRow {
  id: string;
  status: string | null;
  source_type: string | null;
  created_at: string;
}

export interface Gate0PerformanceRow {
  id: string;
  task_id: string | null;
  created_at: string;
}

export interface Gate0RadarCardRow {
  id: string;
  status: string | null;
  created_at: string;
}

export interface Gate0WeeklyMetrics {
  weekOf: string;
  nextWeekOf: string;
  taskCount: number;
  completedTasks: number;
  publishedTasks: number;
  radarCards: number;
  radarSelected: number;
  radarAdoptionRate: number | null;
  structureGenerated: number;
  structureEditedTasks: number;
  structureEditRate: number | null;
  rendererGenerated: number;
  copiedTasks: number;
  copyExportRate: number | null;
  recipeSaved: number;
  recipeReused: number;
  performanceFilled: number;
  performanceFillRate: number | null;
  chatgptFallbacks: number;
  fallbackReasons: Record<FallbackReasonKey, number>;
}

export function mondayOf(d: Date): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

export function nextWeek(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function isGate0EventName(value: string): value is Gate0EventName {
  return (GATE0_EVENT_NAMES as readonly string[]).includes(value);
}

export function isFallbackReasonKey(value: string): value is FallbackReasonKey {
  return (FALLBACK_REASON_KEYS as readonly string[]).includes(value);
}

export function aggregateGate0WeeklyMetrics(input: {
  weekOf: string;
  tasks: readonly Gate0TaskRow[];
  events: readonly Gate0EventRow[];
  performanceRecords: readonly Gate0PerformanceRow[];
  radarCards: readonly Gate0RadarCardRow[];
}): Gate0WeeklyMetrics {
  const taskIds = new Set(input.tasks.map((t) => t.id));
  const generatedTaskIds = taskIdSet(input.events, "structure_generated");
  const editedTaskIds = new Set([...taskIdSet(input.events, "structure_slot_edited"), ...taskIdSet(input.events, "decision_resolved")]);
  const rendererTaskIds = taskIdSet(input.events, "renderer_generated");
  const copiedTaskIds = taskIdSet(input.events, "render_artifact_copied");
  const publishedTaskIds = new Set([
    ...input.tasks.filter((t) => t.status === "published").map((t) => t.id),
    ...taskIdSet(input.events, "published_marked"),
  ]);
  const completedTaskIds = new Set([
    ...input.tasks.filter((t) => t.status === "archived").map((t) => t.id),
    ...taskIdSet(input.events, "task_completed"),
    ...publishedTaskIds,
  ]);

  const fallbackReasons = Object.fromEntries(FALLBACK_REASON_KEYS.map((k) => [k, 0])) as Record<FallbackReasonKey, number>;
  for (const event of input.events) {
    if (event.event_name !== "chatgpt_fallback_logged") continue;
    const reason = payloadString(event.event_payload, "fallback_reason_key");
    fallbackReasons[isFallbackReasonKey(reason) ? reason : "other"] += 1;
  }

  const radarSelected =
    input.radarCards.filter((c) => c.status === "selected").length + countEvents(input.events, "radar_card_selected");
  const performanceFilled = input.performanceRecords.length + countEvents(input.events, "performance_filled");

  return {
    weekOf: input.weekOf,
    nextWeekOf: nextWeek(input.weekOf),
    taskCount: taskIds.size,
    completedTasks: completedTaskIds.size,
    publishedTasks: publishedTaskIds.size,
    radarCards: input.radarCards.length,
    radarSelected,
    radarAdoptionRate: rate(radarSelected, input.radarCards.length),
    structureGenerated: generatedTaskIds.size,
    structureEditedTasks: editedTaskIds.size,
    structureEditRate: rate(editedTaskIds.size, generatedTaskIds.size),
    rendererGenerated: rendererTaskIds.size,
    copiedTasks: copiedTaskIds.size,
    copyExportRate: rate(copiedTaskIds.size, rendererTaskIds.size),
    recipeSaved: countEvents(input.events, "recipe_saved"),
    recipeReused: countEvents(input.events, "recipe_reused"),
    performanceFilled,
    performanceFillRate: rate(performanceFilled, publishedTaskIds.size),
    chatgptFallbacks: countEvents(input.events, "chatgpt_fallback_logged"),
    fallbackReasons,
  };
}

function taskIdSet(events: readonly Gate0EventRow[], name: Gate0EventName): Set<string> {
  return new Set(events.filter((e) => e.event_name === name && e.task_id).map((e) => e.task_id as string));
}

function countEvents(events: readonly Gate0EventRow[], name: Gate0EventName): number {
  return events.filter((e) => e.event_name === name).length;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function payloadString(payload: unknown, key: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}
