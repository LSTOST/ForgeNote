# ForgeNote API-CONTRACT

> 范围：M1 API 输入输出、错误码、权限。Next.js App Router route handlers。

## 1. API 设计原则

1. 所有写入 API 必须登录。
2. 所有业务数据必须按 user_id 隔离。
3. API 不暴露模型 Key。
4. 失败返回稳定错误码。
5. AI 生成 API 优先返回完整 JSON，M1 可暂不做 streaming。

## 2. 通用响应格式

### 成功

```json
{
  "ok": true,
  "data": {}
}
```

### 失败

```json
{
  "ok": false,
  "error": {
    "code": "INPUT_EMPTY",
    "message": "输入内容不能为空"
  }
}
```

## 3. 错误码

| 错误码 | HTTP | 场景 |
|---|---:|---|
| AUTH_REQUIRED | 401 | 未登录 |
| PERMISSION_DENIED | 403 | 访问他人数据 |
| INPUT_EMPTY | 400 | 输入为空 |
| INPUT_TOO_LONG | 400 | 输入超过 8000 字 |
| VALIDATION_FAILED | 400 | 参数不合法 |
| SESSION_NOT_FOUND | 404 | Session 不存在 |
| RECIPE_NOT_FOUND | 404 | 配方不存在 |
| GENERATION_FAILED | 500 | AI 生成失败 |
| DATABASE_ERROR | 500 | 数据库错误 |
| UNKNOWN_ERROR | 500 | 未知错误 |

## 4. 权限规则

| API | 登录 | 权限 |
|---|---|---|
| POST /api/forge | 必须 | 创建自己的 session |
| POST /api/forge/regenerate | 必须 | 只能重生成自己的 session |
| GET /api/sessions/:id | 必须 | 只能读自己的 session |
| GET /api/recipes | 必须 | 只能读自己的 recipes |
| POST /api/recipes | 必须 | 只能保存自己的 recipe |
| GET /api/recipes/:id | 必须 | 只能读自己的 recipe |
| DELETE /api/recipes/:id | 必须 | 只能删自己的 recipe |
| POST /api/recipes/:id/rerun | 必须 | 只能重跑自己的 recipe |
| GET /api/profile/preferences | 必须 | 只能读自己的偏好 |
| PUT /api/profile/preferences/:id | 必须 | 只能改自己的偏好 |
| DELETE /api/profile/preferences/:id | 必须 | 只能删自己的偏好 |

## 5. API 列表

## 5.1 POST /api/forge

创建一次 Forge 生成任务。

### Request

```json
{
  "rawInput": "想做一组小红书卡片，主题是第一次独居备用金清单",
  "intentType": null,
  "assumptions": null,
  "sourceRecipeId": null
}
```

字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| rawInput | 是 | 用户原始输入，1-8000 字 |
| intentType | 否 | 用户手动指定内容类型 |
| assumptions | 否 | 用户传入假设条，首次为空 |
| sourceRecipeId | 否 | 如果从配方重跑传入 |

### Response

```json
{
  "ok": true,
  "data": {
    "sessionId": "uuid",
    "intentType": "content_package",
    "assumptions": [
      {
        "key": "platform",
        "label": "平台",
        "value": "小红书",
        "valueType": "text",
        "source": "inferred",
        "state": "default"
      }
    ],
    "outcome": {
      "positioning": "...",
      "titles": [],
      "body": "...",
      "cardStructure": [],
      "cardPrompts": [],
      "hashtags": [],
      "commentGuide": "..."
    },
    "recipe": {
      "name": "...",
      "intentType": "content_package",
      "audience": "...",
      "goal": "...",
      "tone": "...",
      "structure": [],
      "visualStyle": "...",
      "variables": [],
      "negativeRules": [],
      "acceptance": []
    },
    "verification": {
      "overallPassed": true,
      "checks": []
    }
  }
}
```

### 错误

- AUTH_REQUIRED
- INPUT_EMPTY
- INPUT_TOO_LONG
- GENERATION_FAILED

## 5.2 POST /api/forge/regenerate

基于已有 session 和最新假设重新生成。

### Request

```json
{
  "sessionId": "uuid",
  "rawInput": "原始输入",
  "intentType": "content_package",
  "assumptions": [
    {
      "key": "card_count",
      "label": "卡片数量",
      "value": "10 张",
      "valueType": "text",
      "source": "manual",
      "state": "edited"
    }
  ]
}
```

### Response

同 POST /api/forge，但 sessionId 不变，outcome、recipe、verification 更新。

### 错误

- AUTH_REQUIRED
- SESSION_NOT_FOUND
- PERMISSION_DENIED
- GENERATION_FAILED

## 5.3 GET /api/sessions/:id

获取单个 session。

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "rawInput": "...",
    "intentType": "content_package",
    "assumptions": [],
    "outcome": {},
    "recipeSnapshot": {},
    "verification": {},
    "status": "completed",
    "createdAt": "2026-06-19T00:00:00Z"
  }
}
```

## 5.4 GET /api/recipes

获取配方列表。

### Query

| 参数 | 说明 |
|---|---|
| q | 搜索关键词，可选 |
| intentType | 内容类型筛选，可选 |

### Response

```json
{
  "ok": true,
  "data": {
    "recipes": [
      {
        "id": "uuid",
        "name": "成熟生活手册式独居卡片配方",
        "intentType": "content_package",
        "usageCount": 3,
        "updatedAt": "2026-06-19T00:00:00Z"
      }
    ]
  }
}
```

## 5.5 POST /api/recipes

保存配方。

### Request

```json
{
  "sessionId": "uuid",
  "name": "独居生活手册式卡片配方"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "recipeId": "uuid"
  }
}
```

### 规则

- session 必须属于当前用户。
- session 必须有 recipe_snapshot。
- name 不能为空。
- 同名允许保存，不覆盖旧配方。

## 5.6 GET /api/recipes/:id

获取配方详情。

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "...",
    "intentType": "content_package",
    "schema": {},
    "fields": {},
    "acceptance": [],
    "variables": [],
    "negativeRules": [],
    "usageCount": 3,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## 5.7 DELETE /api/recipes/:id

软删除配方。

### Response

```json
{
  "ok": true,
  "data": {
    "deleted": true
  }
}
```

## 5.8 POST /api/recipes/:id/rerun

使用历史配方换输入重跑。

### Request

```json
{
  "rawInput": "想做一组小红书卡片，主题是退租拍照清单"
}
```

### Response

同 POST /api/forge，返回新的 sessionId。

### 规则

- 原配方不被覆盖。
- 新 session 记录 sourceRecipeId。
- recipe usage_count +1。

## 5.9 GET /api/profile/preferences

获取用户偏好。

### Response

```json
{
  "ok": true,
  "data": {
    "preferences": [
      {
        "id": "uuid",
        "intentType": "content_package",
        "dimensionKey": "tone",
        "dimensionLabel": "语气",
        "value": "成熟、清楚、不焦虑",
        "source": "manual",
        "updatedAt": "..."
      }
    ]
  }
}
```

## 5.10 PUT /api/profile/preferences/:id

修改偏好。

### Request

```json
{
  "value": "成熟、克制、不焦虑"
}
```

## 5.11 DELETE /api/profile/preferences/:id

删除单条偏好。

## 5.12 DELETE /api/profile/preferences

清空全部偏好。

### Request

```json
{
  "confirm": true
}
```

## 6. 内部 forge-engine 契约

目录：

```text
/src/lib/forge-engine
```

函数：

```ts
classifyIntent(rawInput: string): IntentType
buildAssumptions(input: BuildAssumptionsInput): Assumption[]
generateOutcome(input: GenerateOutcomeInput): Promise<Outcome>
buildRecipe(input: BuildRecipeInput): RecipeSnapshot
verifyOutcome(input: VerifyOutcomeInput): Verification
```

## 7. AI 生成约束

M1 要求模型返回 JSON。生成失败时，API 返回 GENERATION_FAILED。

模型调用不得在前端执行，必须放在 server route handler 或 server action。
