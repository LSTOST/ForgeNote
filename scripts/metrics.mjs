#!/usr/bin/env node
// ForgeNote 验证指标读出（I-19）——只读聚合，从现有库表算出 M1 验证闭环的 6 个指标。
// 依据：docs/OPERATING-MODEL.md「指标闭环」。首批用户样本下无需第三方 SDK，直接用 SQL 读出。
//
// 连接方式：与 db:test-rls 同款——DATABASE_URL（或 SUPABASE_DB_URL）+ 本机 psql，零生产依赖。
//
// 安全（硬边界）：
//   - 只 SELECT 计数 / 布尔聚合，绝不取 raw_input / outcome / recipe_snapshot /
//     performance_note 等输入全文或生成正文；跨进程边界的只有整数。
//   - 不打印连接串、不打印任何 secret；脚本本身不内嵌任何 key。
//   - 只读：不 INSERT / UPDATE / DELETE，不改 schema、不绕过 RLS（连接账号权限由部署侧约束）。
//
// safe-mode：未提供 DATABASE_URL → 明确 SKIP exit 0，不在缺库环境制造无意义失败。
//
// 用法：
//   DATABASE_URL='postgres://...' npm run metrics
//   npm run metrics            # 无 DATABASE_URL → SKIP exit 0

import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// safe-mode：无连接串视为跳过，不计失败。
if (!databaseUrl) {
  console.log(
    "SKIP: 未设置 DATABASE_URL / SUPABASE_DB_URL（指标读出需 Postgres 连接串）。视为跳过，不计失败。",
  );
  console.log(
    "运行方式：DATABASE_URL='postgres://...:5432/postgres' npm run metrics",
  );
  console.log(
    "提示：Supabase 的 NEXT_PUBLIC_SUPABASE_URL 是 REST 端点，不是 psql 连接串。",
  );
  process.exit(0);
}

const psql = spawnSync("psql", ["--version"], { encoding: "utf8" });
if (psql.error) {
  console.error("未找到 psql，请先安装 PostgreSQL 客户端工具。");
  process.exit(1);
}

// 单次往返：全部为标量子查询，只返回整数计数（不含任何文本列）。
// 列顺序见下方解构。assumptions 仅读结构字段 e->>'state'，不读取假设内容值。
const sql = `
select
  (select count(distinct user_id) from public.sessions),
  (select count(distinct user_id) from public.sessions where status = 'completed'),
  (select count(*) from public.sessions where status = 'completed'),
  (select count(*) from public.sessions s
     where s.status = 'completed'
       and exists (select 1 from jsonb_array_elements(s.assumptions) e
                   where e->>'state' = 'edited')),
  (select count(*) from public.sessions s
     where s.status = 'completed'
       and exists (select 1 from public.recipes r where r.source_session_id = s.id)),
  (select count(*) from public.recipes where deleted_at is null),
  (select count(*) from public.recipes where deleted_at is null and usage_count > 0),
  (select count(*) from public.sessions where source_recipe_id is not null),
  (select count(*) from (
     select user_id from public.sessions
     group by user_id
     having count(distinct (created_at at time zone 'utc')::date) > 1) t),
  (select count(*) from public.sessions s
     where s.status = 'completed'
       and (s.published_at is not null
            or s.like_range is not null
            or s.favorite_range is not null
            or s.comment_range is not null
            or s.follower_gain_range is not null
            or s.performance_note is not null));
`;

const result = spawnSync(
  "psql",
  [databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-F", "|", "-c", sql],
  { encoding: "utf8", env: process.env },
);
if (result.status !== 0) {
  // 不回显连接串；psql 的错误已足够定位。
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const cells = result.stdout.trim().split("|").map((v) => Number(v));
const [
  usersTotal,
  usersActivated,
  sessionsCompleted,
  sessionsEdited,
  sessionsWithRecipe,
  recipesTotal,
  recipesRerun,
  rerunOriginSessions,
  usersReturned,
  sessionsPerfFilled,
] = cells;

function pct(num, den) {
  if (!den) return `${num}/${den} (—，样本为 0)`;
  return `${num}/${den} (${((num / den) * 100).toFixed(1)}%)`;
}

console.log("ForgeNote 验证指标（只读聚合；OPERATING-MODEL「指标闭环」）\n");
console.log(`activation_rate       ${pct(usersActivated, usersTotal)}  有 completed session 的用户 / 有任意 session 的用户`);
console.log(`assumption_edit_rate  ${pct(sessionsEdited, sessionsCompleted)}  含 edited 假设的 completed session / completed session`);
console.log(`recipe_save_rate      ${pct(sessionsWithRecipe, sessionsCompleted)}  产生配方的 completed session / completed session`);
console.log(`recipe_rerun_rate     ${pct(recipesRerun, recipesTotal)}  usage_count>0 的配方 / 在库配方（未删除）`);
console.log(`return_session_rate   ${pct(usersReturned, usersTotal)}  跨 >1 自然日有 session 的用户 / 有任意 session 的用户`);
console.log(`performance_fill_rate ${pct(sessionsPerfFilled, sessionsCompleted)}  回填过表现的 completed session / completed session`);
console.log(`\n参考：来自配方重跑的 session 数 = ${rerunOriginSessions}（source_recipe_id 非空）`);
console.log("\n说明：小样本下指标噪声大，本脚本只负责「能读出」，不设达标阈值（见 I-19 票）。");

process.exit(0);
