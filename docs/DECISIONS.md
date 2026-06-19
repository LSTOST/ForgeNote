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

## 仍待拍板（未纳入 Day 0）

- `card_count` 默认与上限是否随 output_type 变（仅卡片 vs 完整包）。（PRD §17-1）
- 合规禁用词表来源（自维护初版 + 后续可配）。（PRD §17-3）
- UIUX 暂无 F-16 表现回填界面规格，需后续补充（不在本次一致性修正范围）。
