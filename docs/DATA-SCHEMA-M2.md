# ForgeNote DATA-SCHEMA · M2

> 版本：M2 / v1.0  | 日期：2026-07-08  | 状态：in_progress（代码已实现）
> 前身 M1 DATA-SCHEMA 已归档至 `docs/archive/m1/ARCHIVED-DATA-SCHEMA-M1.md`。

---

## 1. 设计原则

1. 结构是幕后引擎，UI 不直接暴露数据结构。
2. 所有业务数据按 `user_id` 隔离（Supabase RLS）。
3. 结构数据可序列化/反序列化，支持 recipe 保存和重放。
4. recipe 只存结构（slot schema），不存 prose/content。

## 2. Structure Engine 类型

> 完整定义见 `src/lib/structure/types.ts` 和 `src/lib/structure/registry.ts`。

### 2.1 StructureDocument（核心文档）

```typescript
interface StructureDocument {
  id: string;                          // UUID
  taskId: string;                      // 关联 content_tasks.id
  vocabVersion: string;                // registry vocab version (e.g. "2026.07.0")
  prototypeKey: string;                // 内容原型 machine_key
  modalityStack: readonly ModalityKey[];  // 模态栈，narrative 必为第一
  slots: readonly StructureSlot[];     // 槽位策略列表
  pendingDecisions: readonly PendingDecision[];  // AI 不确定的待裁决项
  stabilityStatus: "unstable" | "stable";        // 稳定性
  structureHash?: string;              // 仅在 stable 时生成（FNV-1a 32bit）
}
```

### 2.2 ModalityKey

```typescript
type ModalityKey = "narrative" | "visual" | "temporal";
// temporal 当前 disabled
```

### 2.3 StructureSlot

```typescript
interface StructureSlot {
  key: string;              // slot machine_key (e.g. "hook", "context")
  strategyKey?: string;     // 选中的 strategy machine_key; undefined = pending
}
```

### 2.4 PendingDecision

```typescript
type PendingDecisionStatus =
  | "detected" | "defaulted" | "accepted_default"
  | "user_resolved" | "dismissed_as_optional" | "locked_for_render";

interface PendingDecision {
  key: string;
  status: PendingDecisionStatus;
  required: boolean;
  options?: readonly string[];
  resolvedValue?: string;
  usedDefault?: boolean;
}
```

### 2.5 StabilityCondition

```typescript
interface StabilityCondition {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  ok: boolean;
  detail?: string;
}

interface StabilityReport {
  stable: boolean;
  conditions: StabilityCondition[];
  blockers: string[];          // 人类可读的阻碍描述
  structureHash?: string;      // 仅 stable 时
  draftReadable: true;         // 始终 true —— 主内容不受 stability 阻塞
}
```

### 2.6 StructureToken（Registry）

```typescript
type TokenKind = "prototype" | "modality" | "slot" | "strategy";
type TokenStatus = "candidate" | "stable" | "deprecated" | "disabled";

interface StructureToken {
  key: string;                              // machine_key
  kind: TokenKind;
  version: string;
  status: TokenStatus;
  allowedParents?: readonly string[];       // strategy→slot; slot→modality
  labels: Record<Locale, { label: string; description?: string }>;
  aliases?: readonly string[];
  deprecatedBy?: string;
}
```

## 3. Registry Token 清单

> 完整定义见 `src/lib/structure/registry.ts`。VOCAB_VERSION = `"2026.07.0"`。

### 3.1 Prototypes（5 个，all stable）

| key | 中文 | 必填叙事槽位 |
|---|---|---|
| `experience_recap` | 经验复盘 | hook, insight, resolution |
| `knowledge_explainer` | 知识解释 | hook, insight, resolution |
| `checklist_guide` | 清单指南 | hook, resolution |
| `opinion_argument` | 观点表达 | hook, insight, resolution |
| `case_breakdown` | 案例拆解 | hook, insight, resolution |

### 3.2 Modalities（2 active, 1 disabled）

| key | status |
|---|---|
| `narrative` | stable（基础模态） |
| `visual` | stable（叠加模态） |
| `temporal` | disabled |

### 3.3 Slots（7 个，all stable）

| key | parent | 中文 |
|---|---|---|
| `hook` | narrative | 钩子 |
| `context` | narrative | 情境 |
| `evidence` | narrative | 证据 |
| `insight` | narrative | 洞察 |
| `resolution` | narrative | 收束 |
| `layout` | visual | 布局 |
| `visual_hierarchy` | visual | 视觉层级 |

### 3.4 Strategies（17 个，all stable）

按 parent slot 分组，见 `src/lib/structure/registry.ts`。

## 4. Account Memory 类型

> 完整定义见 `src/lib/account/types.ts`。

### 4.1 AccountMemoryItem

```typescript
type MemoryKind = "audience" | "voice" | "proven_pattern" | "rule" | "topic" | "visual_pref";
type MemorySource = "pasted_post" | "user_observation" | "curated" | "cross_platform" | "account_match";
type MemoryStatus = "active" | "revised" | "dismissed";

interface AccountMemoryItem {
  kind: MemoryKind;
  body: Record<string, unknown>;    // 结构化 belief，永远非全文
  source: MemorySource;
  evidenceRefs: string[];
  evidenceCount: number;
  freshnessAt: string;              // ISO timestamp
  status: MemoryStatus;
}
```

## 5. Content Pipeline 类型

> 完整定义见 `src/lib/content/`。

### 5.1 ContentOutline（确定性的，客户端安全）

```typescript
type MainContentForm = "prose" | "cards" | "script";

interface OutlinePoint {
  slotKey: string;
  label: string;
  strategyLabel: string | null;
}

interface ContentOutline {
  direction: string;       // 人类可读方向描述
  points: OutlinePoint[];
}
```

### 5.2 MainContentSection（LLM 生成）

```typescript
interface MainContentSection {
  role: string;            // slot machine_key（溯源用，不展示给用户）
  slotKeys: string[];
  heading: string;         // 人类可读小标题
  text: string;            // 可编辑正文
}

interface MainContent {
  form: MainContentForm;
  version: string;
  sourceStructureId: string;
  sourceStructureHash: string;
  sections: MainContentSection[];
  warnings: string[];
}
```

### 5.3 DraftSection + DerivedArtifact

```typescript
interface DraftSection {
  role: string;      // max 64
  heading: string;   // max 200
  text: string;      // max 8000
}

interface DerivedArtifact {
  rendererId: RendererId;      // "xiaohongshu" | "x_thread" | "image_prompt"
  version: string;
  format: string;               // "carousel_copy" | "thread" | "image_prompt"
  units: { role: string; text: string }[];
  warnings: string[];
}
```

### 5.4 主内容持久化（G0S-08，migration 0005）

`main_content_documents` 表：每个 content_task 保留**最新一份**主内容（`unique(task_id)`，upsert）。

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | RLS 隔离；复合 FK 沿用 0004 owner 一致性模式 |
| task_id | uuid | `(task_id, user_id)` → `content_tasks(id, user_id)` cascade；unique |
| structure_id | uuid | `(structure_id, user_id)` → `structure_documents(id, user_id)` cascade |
| content | jsonb | 生成的 MainContent（历史工作稿，非 Recipe） |
| draft_sections | jsonb | 用户编辑后的 sections；null = 未编辑；**重生成会重置为 null** |
| output_locale | text | 生成时的输出语言（自由文本，同 0002 语义） |

写入方：`POST /api/content/main`（upsert）、`PUT /api/content/tasks/:id/draft`（只更新 draft_sections/output_locale）。
同票起 `POST /api/content/derive` 开始真正写入 `render_artifacts`（0003 建表后此前从未写入），`output = { units }`。

## 6. Recipe 类型

> 完整定义见 `src/lib/recipe/types.ts`。

Recipe 只存结构 schema，**禁止** 包含 prose 或完整内容。

```typescript
interface RecipeSchema {
  name: string;
  vocabVersion: string;
  prototypeKey: string;
  modalityStack: ModalityStack;
  slotSchema: SlotSchemaEntry[];        // 每个 entry: { slotKey, strategyKey }
  rendererPolicy: RendererPolicy;        // { defaultRenderer?, tone?, lengthHint?, hints? }
  performanceSignalRefs: PerformanceSignalRef[];  // [{ ref, kind? }]
}
```

## 7. Radar 类型

> 完整定义见 `src/lib/radar/types.ts`。

```typescript
type EvidenceSource = "account_match" | "recent_signal" | "historically_effective" | "low_evidence";
type RadarCardStatus = "proposed" | "selected" | "skipped";

interface RadarCard {
  topic: string;
  prototypeKey?: PrototypeKey;
  hookExample?: string;
  suggestedPlatform?: string;
  evidenceSource: EvidenceSource;
  evidenceRefs: string[];
  status: RadarCardStatus;
}
```

## 8. Renderer 契约

> 完整定义见 `src/lib/render/contract.ts`。

```typescript
type RendererId = "xiaohongshu" | "x_thread" | "image_prompt";
type RenderFormat = "text" | "thread" | "carousel_copy" | "image_prompt";

interface AccountBrainSnapshot {
  audience?: string;
  voice?: string;
  rules?: readonly string[];
  provenPatterns?: readonly string[];
  visualPref?: string;
  platformSlice?: Readonly<Record<string, unknown>>;
}

interface Renderer {
  id: RendererId;
  version: string;
  supports(structure: Readonly<StructureDocument>): boolean;
  render(input: RendererInput): Promise<RenderArtifact>;
}
```

## 9. Owner 一致性约束

所有 M2 业务表都按 `user_id` 做 RLS；跨表引用还必须保证 child row 与 parent row 属于同一个用户。

迁移层规则：

- `structure_documents(task_id, user_id)` → `content_tasks(id, user_id)` 使用复合 FK，`on delete cascade`。
- `render_artifacts(task_id, user_id)` → `content_tasks(id, user_id)` 使用复合 FK，`on delete cascade`。
- `render_artifacts(structure_id, user_id)` → `structure_documents(id, user_id)` 使用复合 FK，`on delete cascade`。
- `performance_records.task_id` / `performance_records.render_artifact_id` 需要保留 `on delete set null`，不能用复合 FK，因此使用 `performance_records_owner_consistency` trigger 校验 referenced row owner。
- `usage_events.task_id` 同样保留 `on delete set null`，使用 `usage_events_task_owner_consistency` trigger 校验 referenced task owner。

## 10. Gate 0 usage_events 词表

Gate 0 看板只读 `usage_events` + M2 事实表，不存正文。事件 payload 只允许 machine key、计数、耗时、fallback reason 等短字段。

当前应用层事件：

- `task_created`
- `radar_card_selected`
- `structure_generated`
- `structure_slot_edited`
- `decision_resolved`
- `renderer_generated`
- `render_artifact_copied`
- `chatgpt_fallback_logged`

保留词表（后续接线）：`radar_card_viewed`、`own_idea_started`、`brief_generated`、`recipe_saved`、`recipe_reused`、`published_marked`、`performance_filled`、`task_completed`。

`chatgpt_fallback_logged.event_payload.fallback_reason_key` 只能是：

- `quality_not_enough`
- `too_slow`
- `missing_context`
- `platform_fit_unclear`
- `needed_free_chat`
- `other`

## 11. 发布后学习信号

M2-12 使用现有 `performance_records` 保存原始回填，再把学习结论写回 `account_memory_items`：

- `performance_records.task_id` / `render_artifact_id`：回填归因对象。
- `performance_records.metrics`：range 化指标，不存平台精确抓取数据。
- `performance_records.vs_median`：相对本账号中位表现的文本判断，如 `above` / `below` / `4.2x`。
- `performance_records.note`：Owner 手动复盘，max 500。
- `account_memory_items.kind = proven_pattern`。
- `account_memory_items.source = user_observation`。
- `account_memory_items.evidence_refs = ["performance:<performance_record_id>"]`。
- `account_memory_items.body.signal = validated | invalidated | new_signal`。

## 12. M1 遗留表（Supabase）

以下 M1 表可能仍存在于数据库但 M2 核心流程不使用：
- `sessions` — M1 forge 会话
- `recipes` — M1 content_package 配方
- `profile_preferences` — 用户偏好
- `usage_events` — 埋点事件

M2 流程使用的表（Supabase migration 中定义）：
- `content_tasks` — 内容任务（raw_intent, status, structure_id）
- `structure_documents` — 结构文档 JSON
- `account_memory` — 账号记忆
- `radar_cards` — 选题卡片
- `render_artifacts` — 平台版本归档（0003 建表；G0S-08 起由 /api/content/derive 实际写入）
- `main_content_documents` — 主内容 + 用户草稿（0005，G0S-08 新增，见 §5.4）
