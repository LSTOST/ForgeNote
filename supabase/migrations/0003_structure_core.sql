-- ForgeNote M2-02 — Structure 管线核心数据模型（v3.16 重定义）。
-- 依据：docs/design/redefine-2026-07/CODEX-REVIEW.md（§"推荐 M2 架构基线"、§"DB 处理建议"）、
--       M2-BUILD-PLAN.md（M2-02 done 标准）、方向文档 v3.16 §2（三层系统）。
--
-- 产品链路：Intent -> Prototype -> Structure -> Renderer -> RecipeSchema -> Feedback。
-- 新增 7 张表 + usage_events 新事件支持（task_id）。
--
-- 严格 additive（Codex §DB 处理建议）：
-- - 不 drop、不改旧表（sessions / recipes 等）；旧数据保留，停写在 M2-04 应用层做。
-- - 每张业务表带 user_id（denormalized）以复用 0001 的 RLS 模式（auth.uid() = user_id）。
-- - 复用 0001 的 set_updated_at() 触发器函数。
-- - Recipe 只存生产方法 / schema，禁存正文（无 content/body 文本列）。
-- - 学习只吃 machine_key / source ledger / performance signal，不吃 human label。

-- ============================================================
-- 1. content_tasks —— 一条内容任务（Intent 层）
-- ============================================================
create table if not exists public.content_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_intent text not null,                 -- 用户的模糊想法（Intent；非成品正文）
  prototype_key text,                       -- 内容原型 machine_key（registry；nullable=尚未归类）
  source_type text not null default 'own_idea', -- own_idea | radar | recipe
  source_ref_id uuid,                       -- 来源引用（radar_card / recipe_schema id）
  title text,                               -- 展示用短标题（可空）
  status text not null default 'draft',     -- draft | structuring | ready | published | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_tasks_user_id_idx on public.content_tasks (user_id);
create index if not exists content_tasks_source_ref_id_idx on public.content_tasks (source_ref_id);
create trigger content_tasks_set_updated_at
  before update on public.content_tasks
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. structure_documents —— 结构事实源（Structure 层）
-- ============================================================
create table if not exists public.structure_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.content_tasks(id) on delete cascade,
  vocab_version text not null,              -- registry 词表版本（machine_key 稳定性）
  prototype_key text not null,              -- registry prototype machine_key
  modality_stack jsonb not null default '["narrative"]'::jsonb, -- ["narrative"] | ["narrative","visual"]
  slots jsonb not null default '[]'::jsonb, -- [{ key, strategy_key, ... }]，只存 machine_key
  pending_decisions jsonb not null default '[]'::jsonb, -- [{ key, status, required, ... }]
  stability_status text not null default 'unstable', -- unstable | stable
  structure_hash text,                      -- stable 时生成；render_artifact 记录该 hash 溯源
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists structure_documents_user_id_idx on public.structure_documents (user_id);
create index if not exists structure_documents_task_id_idx on public.structure_documents (task_id);
create trigger structure_documents_set_updated_at
  before update on public.structure_documents
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. render_artifacts —— 渲染层产物（Renderer 输出；历史输出，非 Recipe）
-- ============================================================
create table if not exists public.render_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.content_tasks(id) on delete cascade,
  structure_id uuid not null references public.structure_documents(id) on delete cascade,
  renderer_id text not null,                -- xiaohongshu | x_thread | image_prompt（M1 三个）
  renderer_version text not null,
  source_structure_hash text not null,      -- 溯源：对应哪个 stable structure
  format text not null,                     -- text | thread | carousel_copy | image_prompt
  output jsonb not null,                    -- 最终产物（历史输出，可含文本；不是 Recipe）
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists render_artifacts_user_id_idx on public.render_artifacts (user_id);
create index if not exists render_artifacts_task_id_idx on public.render_artifacts (task_id);
create index if not exists render_artifacts_structure_id_idx on public.render_artifacts (structure_id);

-- ============================================================
-- 4. recipe_schemas —— 结构配方（只存生产方法 / schema，禁存正文）
-- ============================================================
create table if not exists public.recipe_schemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vocab_version text not null,
  prototype_key text not null,
  modality_stack jsonb not null default '["narrative"]'::jsonb,
  slot_schema jsonb not null,               -- 结构骨架（slot key + strategy key，machine_key）
  renderer_policy jsonb not null default '{}'::jsonb, -- 输出策略（默认平台、语气、长度习惯…）
  performance_signal_refs jsonb not null default '[]'::jsonb, -- 只存 signal 引用，不内嵌原始表现
  usage_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- 注意：本表刻意不含任何正文/内容列。正文属于 Content Asset / render_artifacts，不属于 Recipe。
);
create index if not exists recipe_schemas_user_id_idx on public.recipe_schemas (user_id);
create trigger recipe_schemas_set_updated_at
  before update on public.recipe_schemas
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. account_memory_items —— 账号大脑（可查看/可关闭/可纠正 + source ledger + freshness）
-- ============================================================
create table if not exists public.account_memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                       -- audience | voice | proven_pattern | rule | topic | visual_pref
  body jsonb not null,                      -- 结构化信念（不存正文文章）
  source text not null,                     -- source ledger: pasted_post | user_observation | curated | cross_platform | account_match
  evidence_count integer not null default 0,
  freshness_at timestamptz,                 -- 证据新鲜度
  status text not null default 'active',    -- active | revised | dismissed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists account_memory_items_user_id_idx on public.account_memory_items (user_id);
create trigger account_memory_items_set_updated_at
  before update on public.account_memory_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. radar_cards —— 选题雷达卡（M2-00 裁决：无伪热度数字，用来源标签）
-- ============================================================
create table if not exists public.radar_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_of date,                             -- 归属周
  topic text not null,                      -- 选题方向
  prototype_key text,                       -- 建议内容原型
  hook_example text,                        -- 钩子示例
  suggested_platform text,                  -- 建议平台（metadata，M2-00 放宽允许显示）
  evidence_source text not null,            -- account_match | recent_signal | historically_effective | low_evidence（来源标签，非伪热度）
  evidence_refs jsonb not null default '[]'::jsonb, -- 依据来源引用
  status text not null default 'proposed',  -- proposed | selected | skipped
  created_at timestamptz not null default now()
);
create index if not exists radar_cards_user_id_idx on public.radar_cards (user_id);
create index if not exists radar_cards_week_of_idx on public.radar_cards (week_of);

-- ============================================================
-- 7. performance_records —— 发布后表现回填（原始记录留此表，Recipe 只引用）
-- ============================================================
create table if not exists public.performance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.content_tasks(id) on delete set null,
  render_artifact_id uuid references public.render_artifacts(id) on delete set null,
  platform text,                            -- 归因平台
  published_at timestamptz,
  metrics jsonb not null default '{}'::jsonb, -- range 化指标（like_range 等）
  vs_median text,                           -- 相对本账号中位（如 "4.2x"；文本，避免伪精确）
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists performance_records_user_id_idx on public.performance_records (user_id);
create index if not exists performance_records_task_id_idx on public.performance_records (task_id);
create trigger performance_records_set_updated_at
  before update on public.performance_records
  for each row execute function public.set_updated_at();

-- ============================================================
-- 8. usage_events —— 新事件支持（Gate 0 埋点；表结构复用，加 task_id）
--    新事件词表在应用层维护（task_created / radar_card_selected / structure_generated /
--    renderer_generated / recipe_saved / chatgpt_fallback_logged / published_marked …）。
--    payload 禁存正文，只存 machine_key / counts / duration / fallback_reason_key。
-- ============================================================
alter table public.usage_events
  add column if not exists task_id uuid references public.content_tasks(id) on delete set null;
create index if not exists usage_events_task_id_idx on public.usage_events (task_id);

-- ============================================================
-- 9. RLS —— 所有新表启用，用户只能操作自己 user_id 的数据（沿用 0001 模式）
-- ============================================================
alter table public.content_tasks enable row level security;
alter table public.structure_documents enable row level security;
alter table public.render_artifacts enable row level security;
alter table public.recipe_schemas enable row level security;
alter table public.account_memory_items enable row level security;
alter table public.radar_cards enable row level security;
alter table public.performance_records enable row level security;

create policy "Users can manage own content_tasks"
  on public.content_tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own structure_documents"
  on public.structure_documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own render_artifacts"
  on public.render_artifacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own recipe_schemas"
  on public.recipe_schemas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own account_memory_items"
  on public.account_memory_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own radar_cards"
  on public.radar_cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own performance_records"
  on public.performance_records for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
