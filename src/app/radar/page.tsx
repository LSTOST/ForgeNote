// ForgeNote M2-06 — /radar 本周可写选题页（Server Component）。未登录 → 跳 /login。

import { redirect } from "next/navigation";

import { Radar } from "@/components/radar/Radar";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Radar />
    </main>
  );
}
