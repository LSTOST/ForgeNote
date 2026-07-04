#!/usr/bin/env node
// ForgeNote RLS 检查（QA-01）——只读校验当前 schema（supabase/migrations/0001_init.sql）：
// 五张业务表是否启用 RLS 且至少有一条 policy。纯 SELECT 系统目录，不写、不改任何数据。
// 需要：DATABASE_URL（或 SUPABASE_DB_URL）为可连的 Postgres 连接串 + 本机 psql。
// 安全：不打印连接串、不打印任何业务/secret 数据，仅输出每表的启用状态与 policy 计数。

import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const expectedTables = [
  // 0001 Batch A（旧 M1，保留）
  "profiles",
  "sessions",
  "recipes",
  "profile_preferences",
  "usage_events",
  // 0003 M2-02 Structure 管线核心
  "content_tasks",
  "structure_documents",
  "render_artifacts",
  "recipe_schemas",
  "account_memory_items",
  "radar_cards",
  "performance_records",
];

if (!databaseUrl) {
  console.error("缺少 DATABASE_URL 或 SUPABASE_DB_URL（Postgres 连接串）。");
  console.error("提示：Supabase 的 NEXT_PUBLIC_SUPABASE_URL 是 REST 端点，不是 psql 连接串。");
  process.exit(1);
}

const psql = spawnSync("psql", ["--version"], { encoding: "utf8" });
if (psql.error) {
  console.error("未找到 psql，请先安装 PostgreSQL 客户端工具。");
  process.exit(1);
}

function query(sql) {
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-Atc", sql], {
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim().split("\n").filter(Boolean);
}

const tableList = expectedTables.map((table) => `'${table}'`).join(",");
const rlsRows = query(`
  select c.relname || '|' || c.relrowsecurity::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in (${tableList})
  order by c.relname;
`);

const policyRows = query(`
  select tablename || '|' || count(*)::text
  from pg_policies
  where schemaname = 'public' and tablename in (${tableList})
  group by tablename
  order by tablename;
`);

const rls = new Map(rlsRows.map((row) => row.split("|")));
const policies = new Map(
  policyRows.map((row) => {
    const [table, count] = row.split("|");
    return [table, Number(count)];
  }),
);

let failed = 0;
for (const table of expectedTables) {
  if (rls.get(table) !== "true") {
    console.error(`FAIL ${table}: 未启用 RLS`);
    failed += 1;
    continue;
  }
  if (!policies.get(table)) {
    console.error(`FAIL ${table}: 无 RLS policy`);
    failed += 1;
    continue;
  }
  console.log(`OK   ${table}: RLS 已启用，${policies.get(table)} 条 policy`);
}

console.log(`\nRLS check: ${expectedTables.length - failed}/${expectedTables.length} tables ok`);
process.exit(failed > 0 ? 1 : 0);
