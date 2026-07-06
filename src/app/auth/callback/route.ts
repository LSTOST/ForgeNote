// ForgeNote M1 — GET /auth/callback（Batch B）。
// Supabase Auth 回调：用 PKCE code 换取 session 并写入 Auth cookie，成功跳 /forge。
// 失败（缺配置 / 缺 code / 交换失败）跳 /login?error=...，不白屏。
// 依据：@supabase/ssr exchangeCodeForSession（code verifier 存于 cookie）、
//       docs/UIUX-M1.md（§4.2 登录成功跳 /forge）、Next.js 16 Route Handlers。

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCallbackErrorMessage(providerError: string): string {
  const normalized = providerError.toLowerCase();

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("otp_expired")
  ) {
    return "登录链接已失效或已使用。请直接用邮箱和密码登录；如果还不能登录，请重新发送确认或重置邮件。";
  }

  return "登录未完成。请重试，或改用邮箱和密码登录。";
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Supabase 在用户拒绝授权或 provider 未配置时会带 error 回跳。
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  // 成功后的落点：默认 /workspace（M2-04：登录进 v3 工作台）；next 只保留给明确的同源回跳。
  // 只接受同源相对路径，防开放重定向。
  const nextParam = url.searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/workspace";

  const loginUrl = new URL("/login", url.origin);

  if (providerError) {
    loginUrl.searchParams.set("error", getCallbackErrorMessage(providerError));
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "登录回调缺少授权码，请重试。");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    loginUrl.searchParams.set("error", "Supabase 未配置，无法完成登录。");
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    loginUrl.searchParams.set("error", "登录失败，请重新发起登录。");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
