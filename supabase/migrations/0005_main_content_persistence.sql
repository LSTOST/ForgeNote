-- ForgeNote G0S-08 — 主内容持久化（工作台可保存 / 可重开 / 成品可归档）。
-- 依据：docs/GATE0-SLICE-PLAN.md、docs/design/gate0-slice-gap.md（A1 零持久化）。
--
-- 背景：0003 建了 render_artifacts 但派生路由从未写入；主内容（MainContent + 用户编辑草稿）
-- 此前完全不落库，刷新即丢。本迁移补上主内容表；render_artifacts 写入在应用层补（同票）。
--
-- 严格 additive：新表一张，不动旧表。每个 task 只保留最新一份主内容（unique(task_id) 支持 upsert）。
-- 复合 FK 沿用 0004 的 owner 一致性模式（父表 (id, user_id) 唯一键已在 0004 建立）。
-- apply 走 Supabase SQL Editor（本机直连 5432 被代理挡）。

create table if not exists public.main_content_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null,
  structure_id uuid not null,
  content jsonb not null,                    -- 生成的 MainContent（form/version/sections/warnings；历史工作稿，非 Recipe）
  draft_sections jsonb,                      -- 用户编辑后的 sections（null = 尚未编辑；重生成会重置）
  output_locale text,                        -- 生成时使用的输出语言（自由文本，同 0002 语义）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint main_content_documents_task_key unique (task_id),
  constraint main_content_documents_task_owner_fkey
    foreign key (task_id, user_id) references public.content_tasks (id, user_id) on delete cascade,
  constraint main_content_documents_structure_owner_fkey
    foreign key (structure_id, user_id) references public.structure_documents (id, user_id) on delete cascade
);

create index if not exists main_content_documents_user_id_idx on public.main_content_documents (user_id);

create trigger main_content_documents_set_updated_at
  before update on public.main_content_documents
  for each row execute function public.set_updated_at();

alter table public.main_content_documents enable row level security;

create policy "Users can manage own main_content_documents"
  on public.main_content_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
