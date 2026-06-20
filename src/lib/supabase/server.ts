// ForgeNote M1 — Supabase 服务端客户端（Batch A）。
// 仅限服务端：本模块通过 next/headers 读写 Auth cookie，绝不能被客户端组件 import。
// 依据：docs/DATA-SCHEMA.md（§6 RLS：业务表按 auth.uid() = user_id 隔离）、
//       docs/API-CONTRACT.md（§1 写入必须登录 / 数据按 user_id 隔离 / 不暴露 Key）。
//
// 设计：
// - 请求路径上的 route 使用「anon key + 用户 Auth cookie」创建客户端，
//   以登录用户身份读写，RLS 生效。不在请求路径使用 service role（不绕过 RLS）。
// - 缺少 Supabase 环境变量时不抛白屏：getAuthenticatedContext() 返回 null，
//   由 route 统一映射为 AUTH_REQUIRED（无可识别用户）。

import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** 已登录上下文：cookie 绑定的客户端 + 当前用户。 */
export interface AuthenticatedContext {
  supabase: SupabaseClient;
  user: User;
}

/** 读取公开的 Supabase 连接配置（仅 URL + anon key，均可公开）。 */
function readPublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * 创建一个绑定当前请求 Auth cookie 的 Supabase 客户端。
 * 缺少环境变量时返回 null（不抛白屏）。
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = readPublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // route handler 中可写出刷新后的 Auth cookie；
        // 若在不可写上下文（如 Server Component）调用则安全忽略。
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 忽略：无可变响应可写。
        }
      },
    },
  });
}

/**
 * 获取当前已登录上下文。
 * - 未配置 Supabase 或未登录 → 返回 null（route 映射为 AUTH_REQUIRED）。
 * - 已登录 → 返回 { supabase, user }，复用同一 cookie 绑定客户端做后续读写。
 */
export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}
