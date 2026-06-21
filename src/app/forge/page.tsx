import { redirect } from "next/navigation";

import {
  ForgeWorkbench,
  type ForgeData,
  type InitialSession,
} from "@/components/forge/ForgeWorkbench";
import { TopNav } from "@/components/layout/TopNav";
import type { Assumption } from "@/lib/ai/types";
import { POSITIONING, PRODUCT_NAME, SLOGAN } from "@/lib/constants";
import { getAuthenticatedContext } from "@/lib/supabase/server";

// 受保护页面：未登录（或未配置 Supabase）→ 跳 /login。
// 在 Server Component 中贴近数据源做鉴权（Next.js 16 认证指南 DAL 模式），
// 与 /api/forge 的 RLS 共同构成纵深防护，不依赖 proxy 做唯一防线。
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ForgePageProps {
  // I-10：换输入重跑后跳到 /forge?session=<新 sessionId> 查看结果。
  searchParams: Promise<{ session?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ForgePage({ searchParams }: ForgePageProps) {
  // 鉴权 + 取得绑定 Auth cookie 的 Supabase client（用于按 RLS 读取预载 session）。
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  const { supabase } = auth;

  // 可选：预载一个属于当前用户的 session（RLS 保证只读自己的；非法/他人 id 静默忽略）。
  let initialSession: InitialSession | null = null;
  const sessionId = firstParam((await searchParams).session).trim();
  if (UUID_RE.test(sessionId)) {
    const { data } = await supabase
      .from("sessions")
      .select(
        "id, raw_input, intent_type, assumptions, outcome, recipe_snapshot, verification, output_locale, status, error_message",
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (data) {
      const assumptions = Array.isArray(data.assumptions)
        ? (data.assumptions as Assumption[])
        : [];

      if (data.status === "completed" && data.outcome && data.recipe_snapshot) {
        const forgeData: ForgeData = {
          sessionId: data.id,
          intentType: data.intent_type,
          assumptions,
          questions: [],
          outcome: data.outcome,
          recipe: data.recipe_snapshot,
          verification: data.verification,
        };
        initialSession = {
          sessionId: data.id,
          rawInput: data.raw_input,
          data: forgeData,
          assumptions,
          status: "success",
          errorMessage: null,
          outputLocale: data.output_locale ?? null,
        };
      } else {
        // draft / 失败：回填输入并展示错误态，供用户重试（不丢输入）。
        initialSession = {
          sessionId: data.id,
          rawInput: data.raw_input,
          data: null,
          assumptions,
          status: "error",
          errorMessage:
            data.error_message ?? "这条 session 没有可展示的生成结果，请重试。",
          outputLocale: data.output_locale ?? null,
        };
      }
    }
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {PRODUCT_NAME}
          </h1>
          <p className="text-muted-foreground">{SLOGAN}</p>
          <p className="max-w-2xl text-sm text-muted-foreground/80">
            {POSITIONING}
          </p>
        </header>

        <ForgeWorkbench
          // 切换预载 session 时重挂以重置内部状态（避免沿用上一条 session）。
          key={initialSession?.sessionId ?? "fresh"}
          initialSession={initialSession}
        />
      </main>
    </>
  );
}
