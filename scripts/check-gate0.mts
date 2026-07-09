import { aggregateGate0WeeklyMetrics, mondayOf, sanitizeForCheck } from "@/lib/gate0/check-fixture";

const weekOf = "2026-07-06";
const metrics = aggregateGate0WeeklyMetrics({
  weekOf,
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
});

const checks: [string, boolean][] = [
  ["mondayOf keeps Monday", mondayOf(new Date("2026-07-09T00:00:00.000Z")) === weekOf],
  ["taskCount", metrics.taskCount === 2],
  ["publishedTasks", metrics.publishedTasks === 1],
  ["radarAdoptionRate", metrics.radarAdoptionRate === 50],
  ["structureEditRate", metrics.structureEditRate === 100],
  ["copyExportRate", metrics.copyExportRate === 100],
  ["performanceFillRate", metrics.performanceFillRate === 100],
  ["fallback reason", metrics.fallbackReasons.too_slow === 1],
  ["sanitizer trims note", sanitizeForCheck({ note: "x".repeat(200) }).note === "x".repeat(160)],
];

for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
}

const allPass = checks.every(([, ok]) => ok);
console.log(allPass ? "\ncheck:gate0 PASS" : "\ncheck:gate0 FAIL");
process.exit(allPass ? 0 : 1);
