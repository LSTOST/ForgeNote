-- ForgeNote M2 — Codex 代码 review blocker 修复（1/2/4）。
-- 依据：CODEX-CODE-REVIEW-M2.md（P1 blocker 1/2/4）。additive，不破坏旧表；apply 走 SQL Editor。
--
-- 修 3 件：
--  ① 父子归属一致（blocker 1）：child.user_id 必须 = parent.user_id，靠复合外键强制
--     （防已登录用户插入 structure_documents.task_id=别人的 task 造成跨用户脏引用）。
--  ② account_memory_items 增 evidence_refs（blocker 2）：证据引用持久化、可复核。
--  ③ content_tasks 增 error 列（blocker 4）：生成失败可写 failed + 原因，避免僵尸 structuring。
--  外加：关键 enum 的 CHECK 约束（Codex 数据模型 P2：直接 REST 写入时不再全靠应用自觉）。
--
-- 范围说明：本迁移对 cascade 链（structure_documents / render_artifacts）加复合 FK。
--  performance_records / usage_events 用 on delete set null，与"复合 FK + user_id 非空"冲突
--  （set null 会把 user_id 也置空），其 owner 一致性留待后续用 trigger 处理（见文末 TODO）。

-- ============================================================
-- ① 父子归属一致：复合外键 (child.parent_id, child.user_id) → (parent.id, parent.user_id)
-- ============================================================

-- 复合 FK 要求被引用列有 unique 约束。id 已是 PK，但仍需显式 (id, user_id) 唯一键。
alter table public.content_tasks add constraint content_tasks_id_user_key unique (id, user_id);
alter table public.structure_documents add constraint structure_documents_id_user_key unique (id, user_id);

-- structure_documents.task_id → content_tasks（换成复合 FK，保留 cascade）
alter table public.structure_documents drop constraint if exists structure_documents_task_id_fkey;
alter table public.structure_documents
  add constraint structure_documents_task_owner_fkey
  foreign key (task_id, user_id) references public.content_tasks (id, user_id) on delete cascade;

-- render_artifacts.task_id → content_tasks；structure_id → structure_documents（均复合 + cascade）
alter table public.render_artifacts drop constraint if exists render_artifacts_task_id_fkey;
alter table public.render_artifacts drop constraint if exists render_artifacts_structure_id_fkey;
alter table public.render_artifacts
  add constraint render_artifacts_task_owner_fkey
  foreign key (task_id, user_id) references public.content_tasks (id, user_id) on delete cascade;
alter table public.render_artifacts
  add constraint render_artifacts_structure_owner_fkey
  foreign key (structure_id, user_id) references public.structure_documents (id, user_id) on delete cascade;

-- ============================================================
-- ② account_memory_items.evidence_refs（证据引用持久化，可复核）
-- ============================================================
alter table public.account_memory_items
  add column if not exists evidence_refs jsonb not null default '[]'::jsonb;

-- ============================================================
-- ③ content_tasks 生成失败可写 error（避免僵尸 structuring）
-- ============================================================
alter table public.content_tasks add column if not exists error_code text;
alter table public.content_tasks add column if not exists error_message text;

-- ============================================================
-- ④ 关键 enum CHECK 约束（直接 REST 写入也挡住非法值）
-- ============================================================
alter table public.content_tasks
  add constraint content_tasks_status_chk check (status in ('draft', 'structuring', 'ready', 'published', 'archived', 'failed'));
alter table public.content_tasks
  add constraint content_tasks_source_type_chk check (source_type in ('own_idea', 'radar', 'recipe'));
alter table public.structure_documents
  add constraint structure_documents_stability_chk check (stability_status in ('unstable', 'stable'));
alter table public.account_memory_items
  add constraint account_memory_items_source_chk check (source in ('pasted_post', 'user_observation', 'curated', 'cross_platform', 'account_match'));
alter table public.account_memory_items
  add constraint account_memory_items_status_chk check (status in ('active', 'revised', 'dismissed'));
alter table public.radar_cards
  add constraint radar_cards_evidence_source_chk check (evidence_source in ('account_match', 'recent_signal', 'historically_effective', 'low_evidence'));
alter table public.render_artifacts
  add constraint render_artifacts_renderer_chk check (renderer_id in ('xiaohongshu', 'x_thread', 'image_prompt'));

-- ============================================================
-- TODO（后续票）：performance_records / usage_events 的 owner 一致性
--   用 BEFORE INSERT/UPDATE trigger 校验 referenced content_tasks.user_id = user_id，
--   保留其 on delete set null 语义（不能用复合 FK，会把非空 user_id 置空）。
-- ============================================================
