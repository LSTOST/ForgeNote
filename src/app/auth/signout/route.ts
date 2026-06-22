// ForgeNote M1 — POST /auth/signout（Batch B）。
// 退出登录：清除 Supabase Auth cookie（server signOut），跳回 /login。
// 用 POST，避免被预取/链接误触发；TopNav 以原生 <form method="post"> 提交。
// 依据：docs/UIUX-M1.md（§3 顶部导航退出入口）、@supabase/ssr cookie 写出。

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const supabase = await createSupabaseServerClient();
  // 未配置时无 cookie 可清，直接回登录页即可（不白屏、不报错）。
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", new URL(request.url).origin), {
    // 303：将 POST 重定向为 GET，浏览器以 GET 加载 /login。
    status: 303,
  });
}
