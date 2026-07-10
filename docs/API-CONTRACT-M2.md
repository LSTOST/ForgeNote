# ForgeNote API-CONTRACT · M2

> 版本：M2 / v1.0  | 日期：2026-07-08  | 状态：in_progress（代码已实现，未全部通过 Owner 验收）
> 前身 M1 API-CONTRACT 已归档至 `docs/archive/m1/ARCHIVED-API-CONTRACT-M1.md`。

---

## 1. 通用规则

- 所有写入 API 必须登录（Supabase RLS）。
- 所有业务数据按 `user_id` 隔离。
- 模型 Key 不出前端（`import "server-only"`）。
- 统一响应格式：`{ ok: boolean, data?: T, error?: { code: string, message: string } }`

## 2. 错误码

| 错误码 | HTTP | 场景 |
|---|---|---|
| AUTH_REQUIRED | 401 | 未登录 |
| INPUT_EMPTY | 400 | 必填字段为空 |
| INPUT_TOO_LONG | 400 | 输入超限 |
| VALIDATION_FAILED | 400 | 参数不合法 |
| STRUCTURE_NOT_FOUND | 404 | 结构文档不存在 |
| TASK_NOT_FOUND | 404 | 内容任务不存在 |
| ARTIFACT_NOT_FOUND | 404 | 渲染产物不存在 |
| SLOT_NOT_FOUND | 404 | slotKey 不合法 |
| DECISION_NOT_FOUND | 404 | decision key 不存在 |
| INVALID_STRATEGY | 400 | strategyKey 不合法 |
| INVALID_OPTION | 400 | resolvedValue 不在 options 中 |
| MODEL_NOT_CONFIGURED | 503 | 缺 OPENROUTER_API_KEY / OPENROUTER_MODEL |
| GENERATION_FAILED | 500 | AI 生成失败 |
| DATABASE_ERROR | 500 | 数据库错误 |

## 3. API 端点（当前实现）

### 3.1 POST /api/account/intake

粘贴账号资料 → 生成账号记忆。

**Request:**
```json
{
  "profileText": "string (required, max 8000)",
  "recentPosts": ["string (each max 8000, max 20)"],
  "performanceNotes": ["string (each max 8000, max 20)"],
  "platform": "string (optional, max 64)"
}
```
Total input cap: 40,000 chars.

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "saved": 12,
    "dropped": 2,
    "items": [{ "kind": "audience", "body": {}, "source": "pasted_post", "evidenceRefs": [], "evidenceCount": 3, "freshnessAt": "2026-07-08T00:00:00Z", "status": "active" }]
  }
}
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, INPUT_EMPTY, INPUT_TOO_LONG, MODEL_NOT_CONFIGURED, GENERATION_FAILED, DATABASE_ERROR

---

### 3.2 POST /api/radar/generate

基于账号记忆 → 生成每周选题卡。

**Request:**
```json
{
  "recentObservations": ["string (each max 8000, max 20)"],
  "count": 5
}
```
count: 1-8, default 5.

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "saved": 5,
    "dropped": 0,
    "cards": [
      {
        "topic": "独居第一年复盘",
        "prototypeKey": "experience_recap",
        "hookExample": "搬出来住一年才明白的5件事",
        "suggestedPlatform": "xiaohongshu",
        "evidenceSource": "account_match",
        "evidenceRefs": [],
        "status": "proposed"
      }
    ]
  }
}
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, MODEL_NOT_CONFIGURED, GENERATION_FAILED, DATABASE_ERROR

**内部流程:** 加载 account memory（最多 40 条，按 evidence_count desc + freshness desc）→ 构建 account summary → 调用 `generateRadarCards()` → 持久化到 `radar_cards`（`week_of` = 当前周一）。

---

### 3.3 POST /api/structure/generate

想法 → 结构化骨架 + 稳定性判定。

**Request:**
```json
{
  "rawIntent": "string (required)",
  "prototypeKey": "string (optional, max 64)",
  "sourceType": "own_idea | radar | recipe",
  "sourceRefId": "string | null (UUID)",
  "title": "string (optional, max 200)"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "taskId": "uuid",
    "structureId": "uuid",
    "structure": { "id": "uuid", "taskId": "uuid", "vocabVersion": "2026.07.0", "prototypeKey": "experience_recap", "modalityStack": ["narrative", "visual"], "slots": [...], "pendingDecisions": [...], "stabilityStatus": "stable", "structureHash": "abc123" },
    "stability": { "stable": true, "blockers": [], "conditions": [{ "id": 1, "name": "...", "ok": true }] },
    "dropped": []
  }
}
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, INPUT_EMPTY, INPUT_TOO_LONG, MODEL_NOT_CONFIGURED, GENERATION_FAILED, DATABASE_ERROR

---

### 3.4 PATCH /api/structure/[id]/slot

编辑 slot 的 strategy。

**Request:**
```json
{
  "slotKey": "hook",
  "strategyKey": "problem_hook"
}
```

**Response (200):** 同 structure/generate（返回更新的 StructureDocument + stability report）。

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, STRUCTURE_NOT_FOUND, SLOT_NOT_FOUND, INVALID_STRATEGY, DATABASE_ERROR

---

### 3.5 PATCH /api/structure/[id]/decision

解决一个 pending decision。

**Request:**
```json
{
  "key": "some_decision_key",
  "resolvedValue": "chosen_option"
}
```

**Response (200):** 同 slot 更新（返回更新的 StructureDocument + stability report）。

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, STRUCTURE_NOT_FOUND, DECISION_NOT_FOUND, INVALID_OPTION, DATABASE_ERROR

---

### 3.6 POST /api/content/main

Structure → 平台无关可读主内容（无 stability 门禁，draftReadable = always true）。

**Request:**
```json
{
  "structureId": "uuid (required)",
  "language": "string (optional, max 32)"
}
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "outline": { "direction": "经验复盘 · 叙事", "points": [{ "slotKey": "hook", "label": "钩子", "strategyLabel": "问题钩子" }] },
    "mainContent": { "form": "prose", "version": "1.0", "sourceStructureId": "uuid", "sourceStructureHash": "abc123", "sections": [{ "role": "hook", "slotKeys": ["hook"], "heading": "引子", "text": "..." }], "warnings": [] },
    "accountBrain": { "audience": "...", "voice": "...", "memoryCount": 12 }
  }
}
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, STRUCTURE_NOT_FOUND, MODEL_NOT_CONFIGURED, GENERATION_FAILED

---

### 3.7 POST /api/content/derive

用户编辑后的主内容 → 派生到平台格式。

**Request:**
```json
{
  "structureId": "uuid (required, 用于 RLS ownership check)",
  "rendererId": "xiaohongshu | x_thread | image_prompt",
  "sections": [
    { "role": "hook", "heading": "引子", "text": "..." }
  ],
  "language": "string (optional, max 32)"
}
```
sections: 1-40 条，每条 text max 8000。

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "artifact": {
      "rendererId": "xiaohongshu",
      "version": "1.0",
      "format": "carousel_copy",
      "units": [{ "role": "cover", "text": "..." }, { "role": "card_1", "text": "..." }],
      "warnings": []
    }
  }
}
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, STRUCTURE_NOT_FOUND, MODEL_NOT_CONFIGURED, GENERATION_FAILED

**派生原则（iron rule）：** 只调整格式/长度/平台惯例，**绝不改变主题或关键信息点**。

---

### 3.8 POST /api/gate0/fallback

记录 Owner 逃回 ChatGPT / 裸聊的原因。只写事件，不存正文。

**Request:**
```json
{
  "reasonKey": "quality_not_enough | too_slow | missing_context | platform_fit_unclear | needed_free_chat | other",
  "taskId": "uuid | null",
  "note": "string (optional, max 160)"
}
```

**Response (200):**
```json
{ "ok": true, "data": { "logged": true } }
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, DATABASE_ERROR

---

### 3.9 POST /api/gate0/event

记录前端轻事件。当前只允许白名单事件：`render_artifact_copied`、`radar_card_selected`。

**Request:**
```json
{
  "eventName": "render_artifact_copied | radar_card_selected",
  "taskId": "uuid | null",
  "payload": {}
}
```

**Response (200):**
```json
{ "ok": true, "data": { "logged": true } }
```

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, DATABASE_ERROR

---

### 3.10 POST /api/performance/fill

发布后手动回填表现，并把“本周验证/推翻了什么”写回账号记忆。

**Request:**
```json
{
  "taskId": "uuid | null",
  "renderArtifactId": "uuid | null",
  "platform": "xiaohongshu",
  "publishedAt": "2026-07-09T00:00:00.000Z",
  "metrics": {
    "likeRange": "0 | 1-10 | 11-50 | 51-100 | 101-500 | 500+ | unknown",
    "favoriteRange": "0 | 1-10 | 11-50 | 51-100 | 101-500 | 500+ | unknown",
    "commentRange": "0 | 1-10 | 11-50 | 51-100 | 101-500 | 500+ | unknown",
    "followerGainRange": "0 | 1-10 | 11-50 | 51-100 | 101-500 | 500+ | unknown"
  },
  "vsMedian": "string (optional, max 32)",
  "note": "string (optional, max 500)",
  "learningSignal": "validated | invalidated | new_signal"
}
```

必须提供 `taskId` 或 `renderArtifactId` 至少一个。服务端用 RLS + `user_id` 校验归属。

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "performanceRecordId": "uuid",
    "memoryItemId": "uuid",
    "taskId": "uuid",
    "published": true
  }
}
```

**副作用:**

- 写 `performance_records`。
- 写 `account_memory_items(kind=proven_pattern, source=user_observation, evidence_refs=[performance:<id>])`。
- 若有 `publishedAt`，将 `content_tasks.status` 标为 `published`。
- 记录 `published_marked` / `performance_filled` usage event。

**错误:** VALIDATION_FAILED, AUTH_REQUIRED, TASK_NOT_FOUND, ARTIFACT_NOT_FOUND, DATABASE_ERROR

---

### 3.11 M1 遗留端点（可能仍有效）

| 端点 | 说明 |
|------|------|
| GET `/api/sessions/[id]` | 获取 M1 session（M2 流程不使用） |
| GET `/api/sessions/[id]/performance` | 获取表现回填数据 |
| GET/POST `/api/profile/preferences` | 用户偏好 |
| PUT `/api/profile/preferences/[id]` | 编辑偏好 |

## 4. 内部引擎契约

### 4.1 Content Pipeline（`src/lib/content/`）

```typescript
// outline.ts（确定性的，客户端安全）
buildOutline(structure: StructureDocument): ContentOutline
mainContentForm(structure: StructureDocument): MainContentForm

// main-content.ts（server-only，调用 LLM）
generateMainContent(input: MainContentInput): Promise<MainContent>
reSectionMainContent(sections: MainContentSection[]): MainContentSection[]  // 校验用户编辑后的内容
renderMainContent(mainContent: MainContent): string                         // 确定性拼接，无 AI

// derive.ts（server-only，调用 LLM）
deriveContent(input: DeriveInput): Promise<DerivedArtifact>
```

### 4.2 Structure Engine（`src/lib/structure/`）

```typescript
generateStructure(input: StructureGenerateInput): Promise<StructureDocument>
evaluateStability(doc: StructureDocument): StabilityReport
generateStructureHash(doc: StructureDocument): string | null  // FNV-1a 32bit
```

### 4.3 Renderers（`src/lib/render/`）

```typescript
interface Renderer {
  id: RendererId;
  version: string;
  supports(structure: Readonly<StructureDocument>): boolean;
  render(input: RendererInput): Promise<RenderArtifact>;
}
```
