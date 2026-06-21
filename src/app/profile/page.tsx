import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";

import {
  ProfilePreferences,
  type PreferenceItem,
} from "@/components/profile/ProfilePreferences";
import { Card } from "@/components/ui/card";
import { TopNav } from "@/components/layout/TopNav";
import { copy } from "@/lib/copy";
import { getAuthenticatedContext } from "@/lib/supabase/server";

// 受保护页面：未登录（或未配置 Supabase）→ `/login`（与 /forge、/recipes 一致的 DAL 鉴权）。
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }

  // RLS 仅返回当前用户的偏好。
  const { data, error } = await auth.supabase
    .from("profile_preferences")
    .select("id, intent_type, dimension_key, dimension_label, value, source, updated_at")
    .order("updated_at", { ascending: false });

  const preferences: PreferenceItem[] = (data ?? []).map((row) => ({
    id: row.id,
    intentType: row.intent_type,
    dimensionKey: row.dimension_key,
    dimensionLabel: row.dimension_label,
    value: row.value,
    source: row.source,
    updatedAt: row.updated_at,
  }));

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.profile.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {copy.profile.description}
          </p>
        </header>

        {error ? (
          <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-destructive/30 p-8 text-center">
            <CircleAlert className="size-8 text-destructive" aria-hidden />
            <h2 className="text-base font-medium">偏好读取失败</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              数据库暂时不可用，请稍后重试。
            </p>
          </Card>
        ) : (
          <ProfilePreferences
            key={preferences.map((p) => p.id).join(",")}
            initialPreferences={preferences}
          />
        )}
      </main>
    </>
  );
}
