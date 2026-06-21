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
| PREFERENCE_NOT_FOUND | 404 | 偏好不存在（I-11；他人/不存在/非法 id 统一返回，不泄露存在性） |
| GENERATION_FAILED | 500 | AI 生成失败 |
| MODEL_NOT_CONFIGURED | 503 | 模型未配置（缺 `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`），见 MODEL-INTEGRATION §5 |
| DATABASE_ERROR | 500 | 数据库错误 |
| UNKNOWN_ERROR | 500 | 未知错误 |

## 4. 权限规则

| API | 登录 | 权限 |
|---|---|---|
| POST /api/forge | 必须 | 创建自己的 session |
| POST /api/forge/regenerate | 必须 | 只能重生成自己的 session |
| GET /api/sessions/:id | 必须 | 只能读自己的 session |
| POST /api/sessions/:id/performance | 必须 | 只能回填自己的 session 表现 |
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
| outputLocale | 否 | I-16：目标输出语言/表达偏好（自由文本，≤120 字，如 `zh-Hans` / `en-US`）。服务端 trim，空串视为 null；超长 → `VALIDATION_FAILED`。不传保持现有行为。非 enum、不与国家/平台绑定。 |

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
- MODEL_NOT_CONFIGURED
- DATABASE_ERROR

> sessionId 阶段性说明：I-02B 阶段为「真实生成只返回前端、不落库」，故**不返回** `sessionId`（阶段性行为）。Batch A 起 `POST /api/forge` 必须登录并将结果持久化为 session，成功响应**返回** `data.sessionId`。

> 鉴权（API-CONTRACT §4）：`POST /api/forge` 必须登录。无可识别用户 → 返回 `AUTH_REQUIRED`，**不调用模型、不落库**（不创建假 user、不绕过 RLS）。

> 降级规则（Day 0 / DECISIONS D-04）：生成失败（`GENERATION_FAILED` / `MODEL_NOT_CONFIGURED`）时仍持久化 Session 草稿（`status=draft`、`outcome=null`、`error_code` 为对应错误码），输入与假设保留，响应 `error.draft` 含落库后的 `sessionId`，用户可稍后重试。若草稿/结果写库失败 → 返回 `DATABASE_ERROR`，输入不丢。

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
    "outputLocale": null,
    "status": "completed",
    "createdAt": "2026-06-19T00:00:00Z"
  }
}
```

> I-16：`outputLocale` 为该 session 的目标输出语言/表达偏好（nullable；未指定为 `null`）。

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
  "rawInput": "想做一组小红书卡片，主题是退租拍照清单",
  "outputLocale": "en-US"
}
```

字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| rawInput | 是 | 新输入，1-8000 字 |
| outputLocale | 否 | I-16：目标输出语言/表达偏好（自由文本，≤120 字，规则同 §5.1）。不从 recipe 自动带，由本次重跑显式传入。 |

### Response

同 POST /api/forge，返回新的 sessionId（含 `outputLocale`）。

### 规则

- 原配方不被覆盖。
- 新 session 记录 sourceRecipeId。
- 新 session 记录本次 outputLocale（I-16，不写回 recipe）。
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

> 偏好注入（I-11）：`/forge` 页面（Server Component）按 RLS 读取当前用户偏好，映射为 `source="profile"` 的假设并作为初始假设带入生成（用户可在 Forge 内编辑 / 删除该会话的偏好假设）。**无偏好时 `/api/forge` 行为完全不变**（不强依赖偏好，旧请求兼容）。

## 5.9b POST /api/profile/preferences （I-11，新增）

创建 / 更新一条偏好（按唯一键 `(user_id, intent_type, dimension_key)` upsert，便于在 Forge 内「记住已改的假设」覆盖旧值）。

### Request

```json
{
  "intentType": "content_package",
  "dimensionKey": "tone",
  "dimensionLabel": "语气",
  "value": "成熟、克制、不焦虑"
}
```

字段：`intentType` 必填且为 M1 canonical intent；`dimensionKey` / `dimensionLabel` / `value` trim 后非空（≤80/80/500 字），否则 `VALIDATION_FAILED`。`source` 固定 `manual`。

### Response

```json
{ "ok": true, "data": { "id": "uuid" } }
```

## 5.10 PUT /api/profile/preferences/:id

修改偏好 `value`（trim 非空）。

### Request

```json
{
  "value": "成熟、克制、不焦虑"
}
```

### Response

```json
{ "ok": true, "data": { "updated": true } }
```

他人 / 不存在 / 非法 id → `PREFERENCE_NOT_FOUND`。

## 5.11 DELETE /api/profile/preferences/:id

删除单条偏好（硬删除，偏好无软删除列）。

### Response

```json
{ "ok": true, "data": { "deleted": true } }
```

他人 / 不存在 / 非法 id → `PREFERENCE_NOT_FOUND`。

## 5.12 DELETE /api/profile/preferences

清空全部偏好。

### Request

```json
{
  "confirm": true
}
```

> 实现状态（I-11）：已实现 §5.9 GET / §5.9b POST(upsert) / §5.10 PUT / §5.11 DELETE。§5.12 清空全部本票未实现（最小闭环不需要），保留契约位待后续。

## 5.13 POST /api/sessions/:id/performance

F-16 表现回填 lite（手动）。用户对一条已生成内容标注发布表现（见 DECISIONS D-02）。

### Request

range 字段枚举：`0 / 1-10 / 11-50 / 51-100 / 101-500 / 500+ / unknown`。

```json
{
  "publishedAt": "2026-06-19T00:00:00Z",
  "likeRange": "11-50",
  "favoriteRange": "51-100",
  "commentRange": "1-10",
  "followerGainRange": "0",
  "performanceNote": "收藏比点赞高，干货向有效"
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| publishedAt | 否 | 发布时间 |
| likeRange | 否 | 点赞区间 |
| favoriteRange | 否 | 收藏区间 |
| commentRange | 否 | 评论区间 |
| followerGainRange | 否 | 涨粉区间 |
| performanceNote | 否 | 一句话复盘 |

### Response

```json
{
  "ok": true,
  "data": {
    "sessionId": "uuid",
    "published": true
  }
}
```

### 规则

- session 必须属于当前用户。
- M1 仅手动回填，不抓取平台数据、不自动分析。
- M1 不计算 perf_score（M2）。
- 写入后记录事件 performance_filled。

### 错误

- AUTH_REQUIRED
- SESSION_NOT_FOUND
- PERMISSION_DENIED
- VALIDATION_FAILED

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

## 8. Auth 流程路由（Batch B）

非 `/api/*` 业务接口，而是 Supabase Auth 登录闭环所需的 route handler。均不返回 JSON，统一以 HTTP 重定向驱动浏览器。anon key + Auth cookie 识别用户，不使用 service role，不绕过 RLS。

| 路由 | 方法 | 行为 |
|---|---|---|
| `/auth/callback` | GET | PKCE `code` → `exchangeCodeForSession` 写入 Auth cookie。成功 302 跳 `/forge`；缺配置 / 缺 code / provider 回带 error / 交换失败 → 跳 `/login?error=...` |
| `/auth/signout` | POST | `signOut()` 清除 Auth cookie，303 跳 `/login`（POST→GET）。前端以原生 `<form method="post">` 提交，无需客户端 JS |

登录入口（Google OAuth / 邮箱 Magic Link）由客户端 `/login` 页用 anon key 直接发起，`redirectTo` / `emailRedirectTo` 均指向 `/auth/callback`。

受保护页面：`/forge` 为 Server Component，渲染前校验登录态，未登录（或 Supabase 未配置）→ 重定向 `/login`。这是贴近数据源的鉴权，与 `/api/forge` 的 RLS 共同构成纵深防护。`/login` 在已登录时反向重定向 `/forge`。
