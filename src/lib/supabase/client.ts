// ForgeNote M1 — Supabase 浏览器端客户端（Batch B）。
// 仅用于客户端组件（登录页）：用 anon key 发起 Magic Link / OAuth 登录。
// 绝不引入 service role；URL + anon key 均为公开配置（受 RLS 保护）。
// 依据：docs/API-CONTRACT.md（§1 不暴露模型 Key / §3 数据按 RLS 隔离）、
//       docs/DECISIONS.md（Supabase Auth cookie 识别用户，不绕过 RLS）。

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 读取公开 Supabase 配置（NEXT_PUBLIC_*，构建期注入到客户端 bundle）。
 * 缺失时返回 null，由 UI 显示明确配置错误，不白屏。
 */
function readPublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** 客户端是否具备发起登录所需的公开配置。 */
export function isSupabaseConfigured(): boolean {
  return readPublicConfig() !== null;
}

/**
 * 创建浏览器端 Supabase 客户端。
 * 调用前应先用 isSupabaseConfigured() 守卫；配置缺失时抛出明确错误（而非白屏）。
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const config = readPublicConfig();
  if (!config) {
    throw new Error(
      "Supabase 未配置：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    );
  }
  return createBrowserClient(config.url, config.anonKey);
}
