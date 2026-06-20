# ForgeNote 决策记录（DECISIONS）

> 范围：记录开工前拍板的工程决策，作为 PRD / UIUX / DATA-SCHEMA / API-CONTRACT 的权威依据。
> 文档之间如有冲突，以本文件为准。

---

## Day 0（2026-06-19）

四条决策已拍板，用于消解 PRD / DATA-SCHEMA / API-CONTRACT 之间的不一致。只做一致性对齐，不扩展新功能。

### D-01 intent_type canonical values

M1 统一使用以下四个值，**禁止** 使用 `xiaohongshu_card_prompt`：

```
content_package    # 主线，M1 围绕它开发
xiaohongshu_note   # 兜底，不做复杂优化
card_prompt        # 兜底，不做复杂优化
generic_content    # 兜底，不做复杂优化
```

- 主线只围绕 `content_package`。
- 其余三个仅作兜底，不做复杂优化。

影响文件：`DATA-SCHEMA.md`（§2.1 枚举改名）。PRD 已用 `card_prompt`，无需改。

### D-02 F-16 表现回填（lite）

F-16 纳入 M1，但只做 lite：**仅用户手动回填**，不抓取平台数据、不自动分析。

`sessions` 预留字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| published_at | timestamptz | 发布时间 |
| like_range | text | 点赞区间 |
| favorite_range | text | 收藏区间 |
| comment_range | text | 评论区间 |
| follower_gain_range | text | 涨粉区间 |
| performance_note | text | 一句话复盘，可选 |

所有 range 枚举统一为：

```
0
1-10
11-50
51-100
101-500
500+
unknown
```

- M1 **不做** `perf_score`，M2 再做。
- 新增 API：`POST /api/sessions/:id/performance`。
- 新增事件：`performance_filled`。

影响文件：`DATA-SCHEMA.md`（sessions 字段 + range 枚举 + event_name）、`API-CONTRACT.md`（新增接口 + 权限）、`PRD-M1.md`（§11 sessions/recipes 对齐、§17 待决项收敛）。

### D-03 偏好接口

以 `API-CONTRACT.md` 为准，保留：

```
GET    /api/profile/preferences
PUT    /api/profile/preferences/:id
DELETE /api/profile/preferences/:id
```

- **不单独暴露** 新增偏好的 POST 接口。
- 用户「保存配方」或「保存生成结果」时，系统从 edited assumptions 自动写入 `profile_preferences`。
- （`DELETE /api/profile/preferences` 清空全部保留，用于偏好页「清空全部」入口。）

影响文件：无需改动接口（现状已符合）；仅确认无 POST 偏好接口。

### D-04 降级与草稿

生成失败时：

- 允许保存 Session 草稿。
- `status = draft`
- `outcome = null`
- `error_code = GENERATION_FAILED`
- 用户可稍后重试，输入与假设不丢失。

影响文件：`DATA-SCHEMA.md`（sessions 增 `error_code`）、`API-CONTRACT.md`（§5.1 降级规则说明）、`UIUX-M1.md`（§7.4 错误态草稿说明）、`PRD-M1.md`（§17 待决项 #4 收敛）。

### D-05 F-16 配方优先识别延后

F-16 AC③「同 intentType 下高表现配方在库中优先识别/排序」依赖 perf_score，而 D-02 已定 M1 不做 perf_score。

- M1：仅**存储 + 展示**回填数据（在来源 session 与配方详情可见）。
- M2：再做高表现配方的标记/排序（随 perf_score 落地）。

影响文件：`PRD-M1.md`（F-16 AC③、§13.3 样例 #6）。

---

## UI 实现与设计交付流程（2026-06-20）

明确 v0 / Claude Code / Codex / Copilot 的分工与边界，作为 M1 页面设计与落地的权威依据。本节只规范交付流程，不改产品功能、不改页面代码。

### 工具分工

| 工具 | 职责 | 边界 |
|---|---|---|
| v0 | 生成核心页面的视觉首稿、布局方向、组件组合 | 不直接接管整个代码仓库；不接后端、认证、数据库或业务逻辑 |
| Claude Code | 将确认后的 v0 设计落地到真实 Next.js 项目，并补齐状态、交互、响应式与可访问性 | 必须遵守 `UIUX-M1.md`、`DATA-SCHEMA.md`、`API-CONTRACT.md` |
| Codex | 在复杂功能前做实现方案审查；在 PR 后按 PRD/UIUX 验收 | 不负责主力页面开发 |
| GitHub Copilot | 自动 PR 基础代码审查 | 不作为产品验收依据 |

### 页面设计策略

M1 页面分两类：

1. 核心体验页面：先用 v0 出视觉首稿，再由 Claude Code 接入项目
   - `/forge`
   - `/recipes/[id]`（后续配方详情页）

2. 工具型页面：直接由 Claude Code 按 `UIUX-M1.md` 实现
   - `/login`
   - `/recipes`
   - `/profile`
   - `/history`

### v0 使用规则

1. v0 仅生成单页视觉方案，不生成完整产品。
2. 每次只设计一个页面或一个关键组件。
3. v0 输出不得直接覆盖现有仓库。
4. 设计确认后，Claude Code 参考 v0 输出重写为项目内组件。
5. 所有业务状态、按钮行为、错误态、加载态，以 `UIUX-M1.md` 为唯一准则。
6. v0 生成的文案、假数据、API、认证逻辑均不作为实现依据。

影响文件：无（仅规范交付流程，不改动接口、数据模型或页面代码）。

---

## 模型网关决策（2026-06-20）

I-02A 确立 M1 模型接入路线，作为后续 I-02B 真实调用的权威依据。本节只新增决策，不改既有决策语义。

- ForgeNote M1 使用 OpenRouter 作为唯一模型网关。
- M1 使用单模型，不做模型路由。
- 业务代码不绑定模型厂商。
- 后续以 OpenAI SDK 作为兼容客户端接入 OpenRouter。
- 模型名与 API Key 只通过 `OPENROUTER_MODEL` 和 `OPENROUTER_API_KEY` 环境变量控制。
- 本次 I-02A 只建立类型、mock 和接入规则，不调用真实模型。

影响文件：`MODEL-INTEGRATION.md`（新增）、`.env.example`（新增）、`src/lib/ai/types.ts`（新增）、`src/lib/ai/mock-generator.ts`（新增）。

---

## 仍待拍板（未纳入 Day 0）

- `card_count` 默认与上限是否随 output_type 变（仅卡片 vs 完整包）。（PRD §17-1）
- 合规禁用词表来源（自维护初版 + 后续可配）。（PRD §17-3）
- UIUX 暂无 F-16 表现回填界面规格，需后续补充（不在本次一致性修正范围）。
