-- ForgeNote M1 — 初始 schema + RLS（Batch A）。
-- 依据：docs/DATA-SCHEMA.md（§3 表结构 / §2 枚举 / §6 RLS）、docs/DECISIONS.md（D-02 / D-04）。
-- 范围：profiles / sessions / recipes / profile_preferences / usage_events。
-- 所有业务表启用 RLS，用户只能操作自己 user_id 的数据（auth.uid() = user_id）。
-- 注意：本迁移定义 auth.uid() RLS 策略；Batch A 的 route handler 通过 Supabase Auth
--       cookie 识别用户后以登录用户身份（anon key + 用户 session）写入，RLS 生效。

-- gen_random_uuid() 由 pgcrypto 提供（部分环境未默认启用）。
create extension if not exists pgcrypto;

-- ── 通用：updated_at 自动维护触发器 ──
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3.1 profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 新用户注册时自动建立 profiles 行（security definer 以绕过 RLS 写入自身行）。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3.2 sessions
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_input text not null,
  intent_type text not null,
  assumptions jsonb not null default '[]'::jsonb,
  outcome jsonb,
  recipe_snapshot jsonb,
  verification jsonb,
  source_recipe_id uuid null,
  status text not null default 'draft',
  error_code text,
  error_message text,
  -- F-16 表现回填 lite（手动；range 枚举见 DATA-SCHEMA §2.6；M1 不做 perf_score）
  published_at timestamptz,
  like_range text,
  favorite_range text,
  comment_range text,
  follower_gain_range text,
  performance_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_source_recipe_id_idx on public.sessions (source_recipe_id);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3.3 recipes
-- ============================================================
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  intent_type text not null,
  schema jsonb not null,
  fields jsonb not null,
  acceptance jsonb not null default '[]'::jsonb,
  variables jsonb not null default '[]'::jsonb,
  negative_rules jsonb not null default '[]'::jsonb,
  source_session_id uuid references public.sessions(id) on delete set null,
  usage_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes (user_id);
create index if not exists recipes_source_session_id_idx on public.recipes (source_session_id);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- sessions.source_recipe_id 引用 recipes（建表后补 FK，避免循环依赖）。
alter table public.sessions
  add constraint sessions_source_recipe_id_fkey
  foreign key (source_recipe_id) references public.recipes(id) on delete set null;

-- ============================================================
-- 3.4 profile_preferences
-- ============================================================
create table if not exists public.profile_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent_type text not null,
  dimension_key text not null,
  dimension_label text not null,
  value text not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, intent_type, dimension_key)
);

create index if not exists profile_preferences_user_id_idx on public.profile_preferences (user_id);

create trigger profile_preferences_set_updated_at
  before update on public.profile_preferences
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3.5 usage_events
-- ============================================================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  event_name text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_idx on public.usage_events (user_id);
create index if not exists usage_events_session_id_idx on public.usage_events (session_id);

-- ============================================================
-- 6. RLS：所有业务表用户只能操作自己 user_id 的数据
-- ============================================================
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.recipes enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.usage_events enable row level security;

-- profiles：用户只能读/改自己的 profile（insert 由 handle_new_user 触发器完成）。
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- sessions
create policy "Users can manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recipes
create policy "Users can manage own recipes"
  on public.recipes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profile_preferences
create policy "Users can manage own preferences"
  on public.profile_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- usage_events
create policy "Users can manage own usage events"
  on public.usage_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
