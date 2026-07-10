# ⚠ ARCHIVED — DO NOT USE FOR CURRENT IMPLEMENTATION

> **This M1 schema is OBSOLETE.** Current M2 data types: `docs/DATA-SCHEMA-M2.md`.
> M2 introduced structure tokens, content pipeline types, stability engine, account memory items.
> M1 content_package model no longer matches the codebase.
> Retained ONLY for historical DB context.

---

# ForgeNote DATA-SCHEMA
> 范围：M1 数据表、字段、枚举、关系。推荐使用 Supabase Postgres。

## 1. 数据设计原则

1. M1 只做个人版，所有业务数据按 user_id 隔离。
2. 所有表必须有 created_at 和 updated_at。
3. AI 生成结果存 jsonb，便于快速迭代 schema。
4. 配方是核心资产，必须能追溯来源 session。
5. 用户显式修改的偏好单独存储，M1 不做复杂自动学习。

## 2. 枚举

### 2.1 intent_type

```text
content_package
xiaohongshu_note
card_prompt
generic_content
```

> M1 主线只围绕 content_package；其余三个为兜底，不做复杂优化。不使用 xiaohongshu_card_prompt（见 DECISIONS D-01）。

### 2.2 assumption_source

```text
inferred
profile
manual
recipe
```

### 2.3 assumption_state

```text
default
edited
dismissed
```

### 2.4 session_status

```text
draft
generating
completed
failed
```

### 2.5 event_name

```text
login_success
forge_started
intent_detected
assumption_edited
assumption_dismissed
outcome_generated
outcome_copied
recipe_saved
recipe_rerun
preference_saved
verification_failed
performance_filled
```

### 2.6 performance_range

F-16 表现回填的所有 range 字段统一使用此枚举（见 DECISIONS D-02）。

```text
0
1-10
11-50
51-100
101-500
500+
unknown
```

## 3. 表结构

## 3.1 profiles

Supabase Auth 管理 users。业务扩展信息放 profiles。

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 3.2 sessions

记录一次 Forge 生成过程。

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_input text not null,
  intent_type text not null,
  assumptions jsonb default '[]'::jsonb,
  outcome jsonb,
  recipe_snapshot jsonb,
  verification jsonb,
  source_recipe_id uuid null,
  status text not null default 'draft',
  error_code text,
  error_message text,
  -- I-16（additive，migration 0002）：目标输出语言/表达偏好，nullable，无 default，无 enum，不 backfill。
  output_locale text,
  -- F-16 表现回填 lite（手动；range 枚举见 §2.6；M1 不做 perf_score）
  published_at timestamptz,
  like_range text,
  favorite_range text,
  comment_range text,
  follower_gain_range text,
  performance_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### sessions 字段说明

| 字段 | 说明 |
|---|---|
| id | session 主键 |
| user_id | 所属用户 |
| raw_input | 用户原始输入 |
| intent_type | 内容类型 |
| assumptions | 当前假设条快照 |
| outcome | 生成结果 |
| recipe_snapshot | 本次内容配方快照 |
| verification | 验收检查结果 |
| source_recipe_id | 如果来自配方重跑，记录配方 ID |
| output_locale | I-16：目标输出语言/表达偏好（自由文本，如 `zh-Hans` / `en-US` / 自由描述）。nullable，NULL=未指定（沿用现有行为）。不是 enum、不与国家/平台绑定、不 backfill。仅 sessions；recipes 本票不加（重跑按请求传入）。 |
| status | draft / generating / completed / failed |
| error_code | 失败错误码，如 GENERATION_FAILED（见 DECISIONS D-04） |
| error_message | 失败原因 |
| published_at | F-16 用户标注的发布时间（I-12 手动回填） |
| like_range | 点赞区间（枚举见 §2.6；I-12 手动回填） |
| favorite_range | 收藏区间 |
| comment_range | 评论区间 |
| follower_gain_range | 涨粉区间 |
| performance_note | 一句话复盘，可选 |

> I-12 落地：F-16 列在 0001_init.sql 已存在，**无需 migration**。`POST /api/sessions/:id/performance` 手动回填（partial 更新，只写提供字段），区间值须为 §2.6 枚举；M1 不算 perf_score、不自动抓取。

## 3.3 recipes

保存用户内容配方。

```sql
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  intent_type text not null,
  schema jsonb not null,
  fields jsonb not null,
  acceptance jsonb default '[]'::jsonb,
  variables jsonb default '[]'::jsonb,
  negative_rules jsonb default '[]'::jsonb,
  source_session_id uuid references sessions(id) on delete set null,
  usage_count integer default 0,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### recipes 字段说明

| 字段 | 说明 |
|---|---|
| name | 用户命名的配方名 |
| intent_type | 内容类型 |
| schema | 配方渲染 schema |
| fields | 配方字段内容 |
| acceptance | 验收标准 |
| variables | 可替换变量 |
| negative_rules | 禁止项 |
| source_session_id | 来源 session |
| usage_count | 重跑次数 |
| deleted_at | 软删除 |

## 3.4 profile_preferences

用户手动修改过的偏好。

```sql
create table profile_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent_type text not null,
  dimension_key text not null,
  dimension_label text not null,
  value text not null,
  source text not null default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, intent_type, dimension_key)
);
```

### profile_preferences 字段说明

| 字段 | 说明 |
|---|---|
| intent_type | 对应内容类型 |
| dimension_key | 偏好维度 key，如 tone |
| dimension_label | 偏好维度中文名，如语气 |
| value | 偏好值 |
| source | M1 固定 manual |

## 3.5 usage_events

埋点事件。

```sql
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## 4. JSON Schema

## 4.1 Assumption

```json
{
  "key": "tone",
  "label": "语气",
  "value": "成熟、清楚、不焦虑",
  "valueType": "text",
  "source": "inferred",
  "state": "default"
}
```

字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| key | string | 维度 key |
| label | string | 展示名称 |
| value | string | 当前值 |
| valueType | text / number / enum | 值类型 |
| source | inferred / profile / manual / recipe | 来源 |
| state | default / edited / dismissed | 状态 |

## 4.2 Outcome

```json
{
  "positioning": "这组内容帮助第一次独居的人理解备用金怎么留。",
  "titles": ["第一次独居，先留这笔钱", "备用金不是可有可无"],
  "body": "小红书正文 markdown",
  "cardStructure": [
    {
      "index": 1,
      "type": "cover",
      "title": "第一次独居\n先留这笔钱"
    }
  ],
  "cardPrompts": [
    {
      "index": 1,
      "prompt": "兼容字段；I-22 起写逐页卡片文案",
      "body": "该页可直接上卡片的正文 / 要点",
      "visualDirection": "该页配图方向"
    }
  ],
  "hashtags": ["独居生活", "第一次独居"],
  "commentGuide": "你第一次独居时，有没有专门留备用金？"
}
```

## 4.3 RecipeSnapshot / Recipe fields

```json
{
  "name": "成熟生活手册式独居卡片配方",
  "intentType": "content_package",
  "audience": "第一次独居的人",
  "goal": "把生活经验整理成可收藏内容",
  "tone": "成熟、清楚、不焦虑",
  "structure": ["内容定位", "标题", "正文", "卡片 Prompt", "话题"],
  "visualStyle": "暖米白背景、深炭黑标题、低饱和橙强调、浅灰线稿",
  "variables": ["主题", "卡片数量", "目标人群", "核心建议"],
  "negativeRules": ["不要广告感", "不要课程感", "不要焦虑营销"],
  "acceptance": ["标题清楚", "卡片风格统一", "正文可发布"]
}
```

## 4.4 Verification

```json
{
  "overallPassed": true,
  "checks": [
    {
      "key": "has_title",
      "label": "是否有标题",
      "passed": true,
      "message": "已包含标题"
    },
    {
      "key": "has_hashtags",
      "label": "是否有话题",
      "passed": false,
      "message": "缺少话题标签"
    }
  ]
}
```

## 5. 表关系

```text
auth.users 1 ── 1 profiles
auth.users 1 ── N sessions
auth.users 1 ── N recipes
auth.users 1 ── N profile_preferences
auth.users 1 ── N usage_events
sessions 1 ── 0/1 recipes.source_session_id
recipes 1 ── N sessions.source_recipe_id
```

## 6. RLS 要求

所有业务表启用 RLS。

规则：

```text
用户只能 select / insert / update / delete 自己 user_id 的数据。
```

伪策略：

```sql
create policy "Users can manage own sessions"
on sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

recipes、profile_preferences、usage_events 同理。
