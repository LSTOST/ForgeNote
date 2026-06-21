-- ForgeNote M1 — I-16：sessions.output_locale（v5 选择性折叠 additive 预留）。
-- 记录一次生成的“目标输出语言 / 地区表达偏好”（如 zh-Hans / en-US / 自由文本）。
-- 依据：docs/DECISIONS.md（D-07(b) output_locale 预留）、docs/DATA-SCHEMA.md（§3.2 sessions）、
--       docs/API-CONTRACT.md（§5.1 / §5.8 可选 outputLocale）。
--
-- 严格 additive：
-- - nullable，无 default（旧行保持 NULL，语义=“未指定，沿用现有行为”）。
-- - 无 enum / 无 check 约束（locale 允许自由文本，不与国家/平台/市场硬绑定）。
-- - 不 backfill 旧 sessions。
-- - 不改 RLS（沿用 0001 的 auth.uid() = user_id 策略）。
-- - 仅 sessions；recipes 本票不加（最小闭环不需要持久化 recipe 的 locale，重跑按请求传入）。

alter table public.sessions
  add column if not exists output_locale text;

comment on column public.sessions.output_locale is
  'I-16：目标输出语言/表达偏好（自由文本，nullable，无 default，无 enum）。NULL=未指定。';
