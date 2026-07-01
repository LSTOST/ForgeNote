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

/** 「保持 30 天登录」对应的 auth cookie 生命周期（秒）。 */
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface BrowserClientOptions {
  /**
   * 「保持 30 天登录」。
   * - true：auth cookie 写 maxAge=30 天，浏览器关闭后仍保留（DSN-02 默认）。
   * - false：不设 maxAge → 会话级 cookie，关闭浏览器即失效。
   * 说明（DSN-02 §8 最小实现）：此处控制的是 @supabase/ssr 在本次登录写入的 auth cookie
   * 过期时间；refresh token 的服务端最长寿命仍由 Supabase 项目设置决定，属 Codex 边界。
   */
  remember?: boolean;
}

/**
 * 创建浏览器端 Supabase 客户端。
 * 调用前应先用 isSupabaseConfigured() 守卫；配置缺失时抛出明确错误（而非白屏）。
 */
export function createSupabaseBrowserClient(
  options: BrowserClientOptions = {},
): SupabaseClient {
  const config = readPublicConfig();
  if (!config) {
    throw new Error(
      "Supabase 未配置：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    );
  }
  // remember 未显式传入时沿用默认（持久）；显式 false → 会话级 cookie。
  const cookieOptions =
    options.remember === false
      ? undefined
      : { maxAge: REMEMBER_MAX_AGE_SECONDS };
  return createBrowserClient(config.url, config.anonKey, { cookieOptions });
}
