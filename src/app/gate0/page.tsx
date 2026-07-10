import { redirect } from "next/navigation";

import { Gate0FallbackForm } from "@/components/gate0/Gate0FallbackForm";
import { aggregateGate0WeeklyMetrics, mondayOf, nextWeek, type Gate0EventRow, type Gate0PerformanceRow, type Gate0RadarCardRow, type Gate0TaskRow } from "@/lib/gate0/metrics";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Gate0Page({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const auth = await getAuthenticatedContext();
  if (!auth) redirect("/login");

  const weekParam = (await searchParams).week;
  const weekOf = normalizeWeek(Array.isArray(weekParam) ? weekParam[0] : weekParam) ?? mondayOf(new Date());
  const next = nextWeek(weekOf);
  const { supabase } = auth;

  const [tasksRes, eventsRes, perfRes, radarRes] = await Promise.all([
    supabase.from("content_tasks").select("id, status, source_type, created_at").gte("created_at", weekOf).lt("created_at", next),
    supabase.from("usage_events").select("event_name, event_payload, task_id, created_at").gte("created_at", weekOf).lt("created_at", next),
    supabase.from("performance_records").select("id, task_id, created_at").gte("created_at", weekOf).lt("created_at", next),
    supabase.from("radar_cards").select("id, status, created_at").gte("created_at", weekOf).lt("created_at", next),
  ]);

  const metrics = aggregateGate0WeeklyMetrics({
    weekOf,
    tasks: (tasksRes.data ?? []) as Gate0TaskRow[],
    events: (eventsRes.data ?? []) as Gate0EventRow[],
    performanceRecords: (perfRes.data ?? []) as Gate0PerformanceRow[],
    radarCards: (radarRes.data ?? []) as Gate0RadarCardRow[],
  });

  return (
    <main className="min-h-dvh bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gate 0</p>
            <h1 className="mt-1 font-heading text-3xl font-medium">Owner 周看板</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {metrics.weekOf} → {metrics.nextWeekOf}
          </div>
        </div>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard label="真实内容任务" value={metrics.taskCount} />
          <MetricCard label="发布/完成" value={`${metrics.publishedTasks}/${metrics.completedTasks}`} />
          <MetricCard label="选题采用率" value={formatRate(metrics.radarAdoptionRate)} detail={`${metrics.radarSelected}/${metrics.radarCards}`} />
          <MetricCard label="ChatGPT fallback" value={metrics.chatgptFallbacks} />
          <MetricCard label="结构编辑率" value={formatRate(metrics.structureEditRate)} detail={`${metrics.structureEditedTasks}/${metrics.structureGenerated}`} />
          <MetricCard label="renderer 生成" value={metrics.rendererGenerated} />
          <MetricCard label="复制/导出率" value={formatRate(metrics.copyExportRate)} detail={`${metrics.copiedTasks}/${metrics.rendererGenerated}`} />
          <MetricCard label="表现回填率" value={formatRate(metrics.performanceFillRate)} detail={`${metrics.performanceFilled}/${metrics.publishedTasks}`} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Owner 周记模板</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <TemplateLine label="本周真实发布了什么" />
              <TemplateLine label="哪张选题卡/哪个想法被采用，为什么" />
              <TemplateLine label="结构哪里改得最多，说明 ForgeNote 哪里判断弱" />
              <TemplateLine label="是否逃回 ChatGPT 裸聊；如果是，原因是什么" />
              <TemplateLine label="发布后数据验证/推翻了哪条账号记忆" />
              <TemplateLine label="下周还愿不愿意先打开 ForgeNote" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">fallback 原因</h2>
            <div className="mt-4 space-y-2">
              {Object.entries(metrics.fallbackReasons).map(([key, count]) => (
                <div key={key} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{fallbackLabel(key)}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4">
          <Gate0FallbackForm />
        </section>

        <p className="mt-5 text-xs text-muted-foreground">
          当前看板只读 `content_tasks`、`usage_events`、`radar_cards`、`performance_records`，不读取正文。
        </p>
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

function TemplateLine({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-3 py-2">
      <span className="text-foreground">{label}</span>
      <span className="text-muted-foreground">：</span>
    </div>
  );
}

function normalizeWeek(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return mondayOf(new Date(`${value}T00:00:00.000Z`));
}

function formatRate(value: number | null): string {
  return value === null ? "n/a" : `${value}%`;
}

function fallbackLabel(key: string): string {
  const labels: Record<string, string> = {
    quality_not_enough: "质量不够",
    too_slow: "太慢",
    missing_context: "上下文不够",
    platform_fit_unclear: "平台适配不清楚",
    needed_free_chat: "需要自由对话",
    other: "其他",
  };
  return labels[key] ?? key;
}
