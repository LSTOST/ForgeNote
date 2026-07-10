#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const FALLBACK_REASON_KEYS = [
  "quality_not_enough",
  "too_slow",
  "missing_context",
  "platform_fit_unclear",
  "needed_free_chat",
  "other",
];

const weekOf = "2026-07-06";
const fixture = {
  tasks: [
    { id: "t1", status: "published", source_type: "own_idea", created_at: "2026-07-06T01:00:00.000Z" },
    { id: "t2", status: "ready", source_type: "radar", created_at: "2026-07-07T01:00:00.000Z" },
  ],
  radarCards: [
    { id: "r1", status: "selected", created_at: "2026-07-06T01:00:00.000Z" },
    { id: "r2", status: "proposed", created_at: "2026-07-06T01:00:00.000Z" },
  ],
  performanceRecords: [{ id: "p1", task_id: "t1", created_at: "2026-07-08T01:00:00.000Z" }],
  events: [
    { event_name: "structure_generated", task_id: "t1", event_payload: {}, created_at: "2026-07-06T01:00:00.000Z" },
    { event_name: "structure_slot_edited", task_id: "t1", event_payload: {}, created_at: "2026-07-06T01:00:00.000Z" },
    { event_name: "renderer_generated", task_id: "t1", event_payload: { renderer_id: "xiaohongshu" }, created_at: "2026-07-06T01:00:00.000Z" },
    { event_name: "render_artifact_copied", task_id: "t1", event_payload: {}, created_at: "2026-07-06T01:00:00.000Z" },
    { event_name: "chatgpt_fallback_logged", task_id: null, event_payload: { fallback_reason_key: "too_slow" }, created_at: "2026-07-06T01:00:00.000Z" },
  ],
};

const metricsSource = readFileSync(join(root, "src/lib/gate0/metrics.ts"), "utf8");
const eventsSource = readFileSync(join(root, "src/lib/gate0/events.ts"), "utf8");
const pageSource = readFileSync(join(root, "src/app/gate0/page.tsx"), "utf8");

const metrics = aggregateGate0WeeklyMetrics({ weekOf, ...fixture });
const sanitized = sanitizePayload({ note: "x".repeat(200), nested: { reason: "y".repeat(180) } });

const checks = [
  ["metrics source exports aggregator", metricsSource.includes("export function aggregateGate0WeeklyMetrics")],
  ["metrics source defines Gate 0 event names", metricsSource.includes("chatgpt_fallback_logged") && metricsSource.includes("render_artifact_copied")],
  ["events source sanitizes payload", eventsSource.includes("sanitizePayload") && eventsSource.includes("PAYLOAD_TEXT_LIMIT")],
  ["gate0 page reads safe tables only", ["content_tasks", "usage_events", "performance_records", "radar_cards"].every((t) => pageSource.includes(t))],
  ["mondayOf keeps Monday", mondayOf(new Date("2026-07-09T00:00:00.000Z")) === weekOf],
  ["taskCount", metrics.taskCount === 2],
  ["publishedTasks", metrics.publishedTasks === 1],
  ["radarAdoptionRate", metrics.radarAdoptionRate === 50],
  ["structureEditRate", metrics.structureEditRate === 100],
  ["copyExportRate", metrics.copyExportRate === 100],
  ["performanceFillRate", metrics.performanceFillRate === 100],
  ["fallback reason", metrics.fallbackReasons.too_slow === 1],
  ["sanitizer trims note", sanitized.note === "x".repeat(160)],
  ["sanitizer trims nested text", sanitized.nested.reason === "y".repeat(160)],
];

for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
}

const failed = checks.filter(([, ok]) => !ok).length;
console.log(failed === 0 ? "\ncheck:gate0 PASS" : `\ncheck:gate0 FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);

function mondayOf(d) {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

function aggregateGate0WeeklyMetrics(input) {
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
  const fallbackReasons = Object.fromEntries(FALLBACK_REASON_KEYS.map((k) => [k, 0]));
  for (const event of input.events) {
    if (event.event_name !== "chatgpt_fallback_logged") continue;
    const reason = event.event_payload?.fallback_reason_key;
    fallbackReasons[FALLBACK_REASON_KEYS.includes(reason) ? reason : "other"] += 1;
  }
  const radarSelected =
    input.radarCards.filter((c) => c.status === "selected").length + countEvents(input.events, "radar_card_selected");
  const performanceFilled = input.performanceRecords.length + countEvents(input.events, "performance_filled");
  return {
    taskCount: input.tasks.length,
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
    performanceFilled,
    performanceFillRate: rate(performanceFilled, publishedTaskIds.size),
    fallbackReasons,
  };
}

function taskIdSet(events, name) {
  return new Set(events.filter((e) => e.event_name === name && e.task_id).map((e) => e.task_id));
}

function countEvents(events, name) {
  return events.filter((e) => e.event_name === name).length;
}

function rate(numerator, denominator) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function sanitizePayload(payload) {
  const out = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      out[key] = value.slice(0, 160);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.filter((v) => typeof v === "string").map((v) => v.slice(0, 160)).slice(0, 20);
    } else if (value && typeof value === "object") {
      out[key] = sanitizePayload(value);
    }
  }
  return out;
}
