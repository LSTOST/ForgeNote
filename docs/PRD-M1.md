# ForgeNote 内容锻造台 — 产品需求文档（PRD · M1）

> 产品名：ForgeNote 内容锻造台 ｜ Slogan：把模糊想法，锻造成可发布内容
> 唯一权威文档，可进入 M1 设计 / 开发 / 拆票。涵盖：为什么做、给谁用、解决什么问题、做成什么样、每个功能怎么运行、怎么验收算做完。
> 版本：M1 / v4.0（合并版：ForgeNote 施工骨架 + 战略护城河 + P5 真实表现闭环 + 假设三级判定 + eval 门禁）
> 日期：2026-06-19 ｜ 状态：可进入 M1 开发 ｜ 目标：一个人可开发、可上线、可内测

---

## 0. 文档结论

| 核心问题 | 章节 | 结论 |
|---|---|---|
| 1. 为什么做 | 1、3 | 创作者不缺 AI 生成，缺**稳定、可复用、可验收**的内容生产流程；且模型越强，"生成后是否合格 + 像不像我 + 会不会爆"越是痛点。 |
| 2. 给谁用 | 2 | 先服务一个人运营小红书图文账号的内容创作者。 |
| 3. 解决什么问题 | 3 | 把模糊想法 → 可发布**内容包**（含每张卡片图 Prompt），并沉淀为可复用**配方**，再绑真实表现持续校准。 |
| 4. 做成什么样 | 5–7 | 单页 Forge 工作台 + 配方库 + 偏好页。 |
| 5. 每个功能怎么运行 | 8–13 | 每功能定义入口、规则、状态、异常、AC。 |
| 6. 怎么验收算做完 | 14、16、20 | 逐功能 AC + eval 门禁 + 端到端样例 + M1 DoD。 |

**M1 只验证一个行为**：用户是否愿意把 ForgeNote 当**日常内容生产工作台**（持续生成、保存、复用配方），而不是偶尔用一次的提示词工具。M1 不做团队/企业/通用提示词平台/自动发布/数据抓取。

---

# 第一部分 · 为什么做 / 给谁用 / 解决什么

## 1. 为什么做

### 1.1 背景

创作者已能直接用 ChatGPT/Claude，但对话式生成有硬伤：每次重述账号定位与风格、结构随机、卡片 Prompt/正文/话题/标题分散易漏项、好用的"生成方法"留不下来、结果能否发布全靠临时人工判断、质量依赖个人提示词经验不可复用。

ForgeNote 的机会**不是"帮你写更好的提示词"**，而是把一次内容生产结构化为可复用闭环：

```
模糊想法 → 假设补全 → 内容生成 → 结果验收 → 配方保存 → 下次复用 →（发布后）真实表现回流
```

### 1.2 第一性判断

内容生产的真实损耗在四处，且最持久的痛点不是"生成"而是"生成后是否合格"：

| 损耗 | 表现 | 解法 |
|---|---|---|
| 表达损耗 | 脑中有想法但说不完整 | 假设条补全上下文（§6） |
| 结构损耗 | AI 生成结构随机 | 自适应输出结构 + 配方 schema（§10） |
| 复用损耗 | 好用的一次生成沉淀不下来 | 配方库 + 偏好记忆（§9 F-10/F-13） |
| **判断损耗** | **会不会爆 / 像不像我 / 合不合规，模型不替你判** | **绑爆点结构与真实表现的验收 + 数据回流（§9 F-14/F-16）** |

> 核心不是 Prompt，是 **Recipe（内容配方）**；而 Recipe 的价值随"真实表现回流"复利增长。

### 1.3 五条不可妥协的设计原则（验收一切设计的标尺）

| # | 原则 | 含义 |
|---|---|---|
| P1 | 提问是最后手段 | 补上下文按用户努力排序：复用已知 > 推断默认并亮出 > 提问；提问数由信息价值算出，可能为 0（§10.4）。 |
| P2 | 输出结构随内容类型自适应 | 内容包/笔记/卡片 Prompt 结构不同，由类型识别驱动，非固定模板。 |
| P3 | 交付 = 内容包 + 可复用配方，且当场验收 | 用户要的是可发布内容；配方是副产品；不验收无法声称"可发布"。 |
| P4 | 上下文必须被记住 | 记忆是一等公民，让打扰随使用递减（M1 仅记显式修改）。 |
| P5 | **结果绑现实，数据要回流** | 验收不止"结构齐全"，要绑真实表现（互动/涨粉/合规）；表现回流持续校准"什么算合格"与爆款特征——这条闭环平台不替你跑，越用越准。 |

### 1.4 为什么是垂直结果工厂（反横向中间层）

| 维度 | 横向"AI 中间层"（会被淘汰） | 垂直"结果工厂"（ForgeNote） |
|---|---|---|
| 跟谁竞争 | 模型平台本身（它就是万能中间层） | 没人替你做的"最后一公里" |
| 模型变强时 | 价值被吃掉 | 价值升值（生成越好越缺"判断+贴合+流程"） |
| 护城河 | 无（提示词谁都能写） | 风格记忆 + 配方/资产库 + 验收标准 + 真实数据闭环，越用越深 |
| 交付物 | 一段提示词 | 一套可直接发布的内容包（结果） |

**价值迁移**：模型把"生成"做成快免费商品；价值迁移到生成之外的三件事——**判断**（验收，P3+P5）、**贴合**（风格+配方，P4）、**流程**（复用飞轮）。ForgeNote 把旗插在这三件，把"生成"当可替换商品（单模型即可，不在生成层与平台竞争）。

## 2. 给谁用

### 2.1 M1 楔子用户（只服务这一类人）

```
一个人运营小红书 / 图文账号，经常需要把生活经验、知识清单、产品想法
整理成可发布内容（尤其图文卡片）的人。
```

| 细分 | 画像 | 高频场景 |
|---|---|---|
| 起号期 | 0–1 万粉，摸索人设与选题 | 每周定选题、出卡片+笔记、看数据调整 |
| 腰部博主 | 1–10 万粉，需稳定爆点与一致人设 | 批量产出、维持调性、复用爆款结构 |

### 2.2 M1 不服务

大型企业市场部、多人内容团队、MCN、纯视频号、强自动发布需求、只想要提示词模板的人。
（团队/企业沿同一垂直向上扩是 M2+，见 §15 里程碑；不横向扩到别的行业。）

> **战略方向（见 DECISIONS「v5 选择性折叠」D-06）**：产品方向为**国际 + 图文卡片/carousel + 多语言**（放弃大陆）。M1 **保留 v4 小红书代码不推翻**，仅按 D-07 增量折叠：i18n 文案外化（票 I-15）、`output_locale` 预留（票 I-16）、商业化定位（§4.3）；平台中立 taxonomy 改名 / 去小红书化 / Stripe 延后（D-08）。`content_package` 已是卡片式，本身与 carousel 兼容。

## 3. 解决什么问题

| 创作者真实痛点 | 现状 | ForgeNote 解法 |
|---|---|---|
| 有想法但不知怎么展开 | 直接问 AI，结果随机 | 假设条补全受众/目标/风格/形式 |
| 标题/正文/卡片 Prompt/话题分散 | 多次对话、易漏项 | 一次生成完整内容包 |
| 写得出但不知"行不行、会不会爆" | 凭感觉验收 | 绑爆点结构 + 真实表现的验收（P3/P5） |
| AI 写的"不像我"，人设漂移 | 每次重述规范 | 配方复用 + 偏好记忆（P4） |
| 过往爆款用不上 | 散在聊天记录 | 配方库 + 爆款特征沉淀 |
| 发完不知为何爆/不爆 | 无反馈 | 表现数据回流更新"什么算合格"（P5） |

**M1 核心问题（只解决一个）**：把一个模糊内容想法，转成一套**可复制、可保存、可复用**的小红书图文内容包。
**M1 不解决**：自动判断会不会爆（需平台数据，M1 不做数据产品，仅做手动回填 lite）、自动发布、多账号、团队协作、复杂内容分析。

---

# 第二部分 · 产品形态与引擎

## 4. 产品目标与指标

### 4.1 用户目标

输入一个粗糙想法后，约 3 分钟内得到：内容定位、标题备选、小红书正文、卡片结构、**每张卡片 Prompt**、话题标签、评论区引导、可复用配方。

### 4.2 M1 指标（第一天即可测的行为指标 + 闭环先行指标）

| 指标 | 计算 | M1 目标 |
|---|---|---:|
| 首次生成成功率 | outcome_generated / forge_started | ≥ 90% |
| 内容包复制率 | outcome_copied / outcome_generated | ≥ 50% |
| 配方保存率 | recipe_saved / outcome_generated | ≥ 30% |
| 配方重跑率 | recipe_rerun / recipe_saved | ≥ 15% |
| 7 日二次使用率 | 7 日内再用 / 首日用户 | ≥ 20% |
| 生成失败率 | — | ≤ 10% |
| **表现回填率（P5 先行）** | 标注了发布表现的 session / 已发布 session | ≥ 20%（验证闭环可启动） |

> 行为指标证明"是否当工作台用"；表现回填率证明"护城河飞轮是否转起来"。M1 不以收入为目标。

### 4.3 商业化假设（M1 不收费，但验证可收费性 — DECISIONS D-07(c)）

M1 不收费，但写明将来怎么赚，避免做出结构上没法收费的东西。

- **变现模型**：freemium 个人订阅（国际 → Stripe，M2 开收）。免费档限额（每月 N 次生成 / 配方库容量）；付费档解锁更多生成、批量重跑、高级视觉风格预设、爆款特征库、多 locale。
- **为什么付**：内容创作是成熟付费品类；工具帮创作者省时间、涨粉、变现。
- **M1 与收费的关系**：保存率 / 重跑率 / 7 日留存 = 付费意愿先行指标。M1 不收费，但在验证"可收费性"；免费档限额要让重度用户自然触顶。
- **单位经济**：每次生成 token 成本须远小于订阅定价；埋点监控 per-生成成本。
- **向上扩**：内容团队 / MCN 席位档 = M2。

## 5. 做成什么样：产品形态

ForgeNote 是 Web 内容生产工作台。M1 三个核心区：**Forge 工作台**（输入想法、调假设、生成）、**配方库**（保存/查看/重跑）、**偏好页**（管理记住的偏好）。

**核心体验**：用户不学提示词，只需 ① 写下粗糙想法 ② 看系统补的假设对不对 ③ 改掉不对的 ④ 拿到可发布内容包 ⑤ 保存配方下次复用 ⑥（发布后）回填表现。

**核心差异点**

| 普通 AI 对话 | ForgeNote |
|---|---|
| 反复解释需求 | 假设条补全上下文 |
| 一次性回答 | 内容包 + 配方双交付 |
| 结果不可复用 | 配方保存/重跑 |
| 偏好散落聊天记录 | 偏好页集中管理 |
| 质量靠临时判断 | 结构验收 + 真实表现回流 |

## 6. 核心引擎（forge-engine）

引擎四函数 + 记忆副作用，前端/API 共用同一契约。

```
classifyIntent(rawInput, profile)        → { intentType, confidence, lossDimensions, outputSchema }
recoverContext(rawInput, lossDims, prof) → { assumptions[], questions[] }   // 三级判定见 §10.4
synthesize(rawInput, resolvedContext, outputSchema) → { outcome, recipe }
verify(outcome, recipe.acceptance)       → { checks[], overallPassed }
onUserReaction(session, reaction)        → 更新 profile（M1 仅记显式修改）
```

- 生成层模型无关（单模型即可，M1 用 OpenAI 或 Anthropic）；这让"生成"是可替换商品（§1.4）。
- M1 **不做自动防抖重生成**：用户改假设后点「应用修改并重新生成」再触发（务实、省 token）。

---

# 第三部分 · UI / UX 页面规格

## 7. 页面与交互

设计原则：结果优先（Outcome 第一视觉）、低学习成本（不出现 Prompt 术语）、假设可见（能改/删/恢复）、配方可复用、状态明确（生成中/失败/已保存/已复制/已重跑）。视觉：专业干净的内容工作台感，深绿或深蓝灰主色、浅灰白底、卡片式分组、桌面信息密度中偏高。断点 sm<768 / md / lg。全局四态：空/加载/错误/降级。

| 页面 | 路径 | 目标 |
|---|---|---|
| 登录页 | `/login` | Google / 邮箱 Magic Link 登录；未登录访问受保护页跳转此 |
| Forge 工作台 | `/forge` | 核心生成闭环 |
| 配方库 | `/recipes` | 查看/搜索/筛选/删除/重跑 |
| 配方详情 | `/recipes/[id]` | 看配方 + 换输入重跑 |
| 偏好页 | `/profile` | 管理记住的偏好 |
| 历史记录 | `/history` | 看历史 session（M1 可选/可延后） |

### 7.1 Forge 工作台（核心）

```
┌──────────────────────────────────────────┐
│ 顶部导航：ForgeNote / 配方库 / 偏好 / 用户 │
├──────────────────────────────────────────┤
│ 想法输入区（多行，自动增高，字数 0/8000）  │
├──────────────────────────────────────────┤
│ 内容类型 chip ▾  +  假设条区域            │
│ ❓需要你补充（≤3，仅高影响+猜不准才问）    │
├─────────────────────┬────────────────────┤
│ Outcome 生成结果(左) │ Recipe 内容配方(右) │
│  正文/标题/卡片Prompt│  自适应字段+验收清单 │
├─────────────────────┴────────────────────┤
│ 操作区：复制 / 保存配方 / 重新生成 / 新建   │
│ 状态：生成中…/✓已验证/降级⚠/已保存          │
└──────────────────────────────────────────┘
```

- 移动端（sm）：纵向堆叠（导航→输入→类型→假设→Outcome→Recipe→操作）。
- 核心组件：`IdeaInput / IntentChip / AssumptionChips / OutcomePanel / RecipePanel / VerificationPanel / ActionBar`。
- 页面状态：空态（示例想法）/输入中/生成中（骨架屏）/已生成/改假设后（显示「应用修改并重新生成」）/失败（重试）/已保存。
- 空态文案："写下一个模糊想法，ForgeNote 会把它整理成可发布内容。"
- 占位文案："例如：想做一组小红书卡片，主题是第一次独居备用金清单"。

### 7.2 假设条组件（AssumptionChips）

| 状态 | 含义 | 视觉 |
|---|---|---|
| default | 系统推断 | 灰底常规 |
| profile | 来自偏好 | 蓝点标记（hover 显"来自你的偏好"，**不暴露置信度数字**） |
| highlight | 高影响且亮出 | 强调边框 |
| edited | 已修改 | 值更新 + 细标记 |
| dismissed | 已删除 | 删除线变灰 + ↺恢复 |
| invalid | 非法输入（数值/枚举） | 红框行内错误，确认不可点 |

编辑器按 valueType 切换：text→输入框 / enum→下拉(options) / number→步进+校验 / bool→开关 / list→标签输入。提供「全部恢复默认」。

### 7.3 配方库 / 详情 / 偏好页

- **配方库** `/recipes`：卡片列表（名称/内容类型/更新时间/使用次数/操作），搜索+类型筛选，空态引导去 Forge。
- **配方详情** `/recipes/[id]`：左配方字段 / 右换输入重跑面板 / 底部来源 Session；操作：重命名、删除、换输入重跑、复制配方。
- **偏好页** `/profile`：按内容类型分组（偏好项/值/来源[手动]/更新时间），单项删除 + 重置某类 + 清空全部；说明文案："这些偏好来自你手动改过的假设，会让下次生成更贴近你的风格。"

---

# 第四部分 · 功能规格

## 8. M1 功能范围

| 编号 | 功能 | 优先级 |
|---|---|---|
| F-01 | 用户登录 | P0 |
| F-02 | 自由想法输入 | P0 |
| F-03 | 内容类型识别 | P0 |
| F-04 | 假设条生成与编辑（三级判定） | P0 |
| F-05 | 内容包生成 | P0 |
| F-06 | 卡片 Prompt 生成 | P0 |
| F-07 | 发布文案生成 | P0 |
| F-08 | 内容配方生成 | P0 |
| F-09 | 复制结果 | P0 |
| F-10 | 保存配方 | P0 |
| F-11 | 配方库 | P0 |
| F-12 | 换输入重跑 | P0 |
| F-13 | 偏好记忆（仅显式修改） | P1 |
| F-14 | 基础验收检查（结构 + 合规/禁用词） | P1 |
| F-15 | 历史记录 | P2 |
| **F-16** | **表现回填闭环 lite（P5 落地）** | **P1（飞轮种子）** |

**不做**：团队协作、自动发布、数据抓取分析、多账号、提示词市场、企业控制台、多模型路由平台。

## 9. 逐功能执行规格（入口 / 规则 / 状态 / 异常 / AC）

> 通用：`AC-<功能号>-<序>`，Given/When/Then 可测。参数见 §10.4 表。

### F-01 用户登录
- 入口：`/login`；未登录访问受保护页自动跳转。
- 规则：登录成功→`/forge`；失败→错误+重试；退出→清 session 回 `/login`。
- AC：① 未登录访问 `/forge` 跳 `/login` ② Google/Magic Link 成功后进 `/forge` ③ 用户 A 不能访问 B 的数据 ④ 退出后不能再访问受保护页。

### F-02 自由想法输入
- 规则：1–8000 字，多行/可粘贴；空输入禁用提交；提交→创建 Session→进 F-03。
- 异常：空→禁用；超长→提示"已超过 8000 字"；创建失败→保留输入+重试。
- AC：① 空不能提交 ② 超 8000 字不能提交 ③ 有效输入创建 Session ④ 提交失败输入不丢失。

### F-03 内容类型识别（自适应骨架）
- M1 类型：`content_package`（完整内容包，主线）/ `xiaohongshu_note`（图文笔记）/ `card_prompt`（卡片 Prompt）/ `generic_content`（兜底）。
- 识别：规则关键词 + LLM 兜底。置信度 < `τ_intent`(0.6) → 类型以可改 chip 呈现，下拉可选。
- AC：① 含"卡片+发布文案"识别为 content_package ② 结果可手动改 ③ 改类型后假设条与输出结构同步变 ④ 无法识别落 generic_content 不报错 ⑤ 低置信度时类型以可改 chip 呈现。

### F-04 假设条生成与编辑（三级判定）
- 规则：按 §10.4 三级判定对每个损耗维度产出 assumption 或 question；questions 超 `Q_MAX`(3) 取前 3，其余转 highlight 假设。chip 可改/删/恢复/全部恢复。
- 重生成：M1 手动——改后显示「应用修改并重新生成」，点击才重生。
- 字段示例（content_package）：platform / audience / tone / visual_style / card_count / output_type / negative_rules。
- AC：① 至少生成 4 个假设条 ② 可编辑 ③ 可删除且被删项不参与生成 ④ 改后重生用新值 ⑤ 来自偏好的 chip 标 profile ⑥ 高影响且默认不可信的维度才出现为 question ⑦ question 总数 ≤ 3。

### F-05 内容包生成
- 输出结构（content_package）：内容定位 / 标题备选 / 小红书正文 / 卡片结构 / **每张卡片 Prompt** / 发布话题 / 评论区引导 / 配方摘要。
- 流程：`rawInput + intentType + assumptions → buildPrompt → call LLM → parse → buildRecipe → verify → save session`。
- 异常：生成失败→重试；空→重生;解析失败→Markdown 原文展示并提示结构可能不完整；超时→稍后重试。
- AC：① 结果含标题/正文/卡片 Prompt/话题 ② 生成中显示 loading/骨架 ③ 失败可重试 ④ 刷新后可恢复最近 Session ⑤ 结果可复制。

### F-06 卡片 Prompt 生成（领域核心）
- 每张卡片 Prompt 含：序号 / 类型(封面/干货/转折/收尾) / 画面文案(主标题+副文+正文) / 视觉风格(背景/字体/颜色/插画) / 版式(结构/留白/层级) / 插画描述 / 禁止项。
- 默认视觉风格（可被偏好覆盖）：成熟生活手册式、暖米白背景、深炭黑标题、低饱和橙强调、浅灰线稿插画；不要广告感/课程感/焦虑营销。
- AC：① 每张有序号 ② 每张有主标题+副文 ③ 每张有视觉规范 ④ 卡片间风格统一 ⑤ 每张 Prompt 可单独复制。

### F-07 发布文案生成
- 正文结构：开头钩子 / 个人场景或问题背景 / 核心干货 / 具体建议 / 结尾互动。
- 默认禁止项：公众号·微信引流、私信领取、夸张承诺、焦虑营销、过多爆款黑话、过度鸡汤。
- AC：① 有开头钩子 ② 分段清楚 ③ 含 5–10 个话题 ④ 有评论区互动句 ⑤ 不出现默认禁止项。

### F-08 内容配方生成
- 配方字段：name / intentType / audience / goal / tone / structure / visualStyle / outputSections / variables(可替换) / negativeRules / acceptance。
- AC：① 每次生成都有配方摘要 ② 含可替换变量 ③ 能保存到库 ④ 能用于重跑。

### F-09 复制结果
- 范围：全文 / 正文 / 全部卡片 Prompt / 话题 / 配方。
- AC：① 复制进剪贴板 ② 成功有反馈 ③ 未生成时按钮不可用。

### F-10 保存配方
- 流程：点保存→命名（默认=主题+类型）→写入 recipes→成功提示。
- 异常：名称空→禁止；同名→允许+提示；失败→保留弹窗+重试；未登录→跳登录。
- AC：① 可保存 ② 保存后库出现 ③ 失败可重试 ④ 关联来源 Session。

### F-11 配方库
- 列表/搜索/类型筛选/查看详情/删除/重跑。
- AC：① 已保存配方显示 ② 搜索可用 ③ 筛选可用 ④ 可删除 ⑤ 删除后列表更新。

### F-12 换输入重跑
- 流程：配方详情→换输入重跑→输入新主题→沿用配方结构与风格→生成新 Session（不覆盖原配方，usage_count+1）。
- AC：① 从详情可发起 ② 新输入空不能重跑 ③ 生成新 Session ④ 原配方不被覆盖 ⑤ 重跑次数+1。

### F-13 偏好记忆（M1 仅显式修改）
- 规则：用户改过的 chip，在"保存配方或复制结果"后写入 profile_preferences；下次同 intentType 优先带出（来源=手动，权重高于推断）。**M1 不做自动学习**（连续保留 N 次自动学习推迟到 M2）。
- AC：① 改过的 chip 被记录 ② 下次同类自动带出 ③ 偏好页可见 ④ 删除后不再带出。

### F-14 基础验收检查（结构 + 合规，机器可判）
- 检查项随内容类型：内容包→标题/正文/卡片 Prompt/话题/评论区引导齐全；卡片→序号/标题/副文/视觉规范/禁止项；正文→开头/分段/话题数/互动；**合规→命中默认禁止词/引流词则标 ✗ 并定位**。
- 展示：逐项 ✓/✗ + 整体；✗ 项提供「按未通过项修正」（仅对该项局部重写）；失败不阻止复制。
- AC：① 生成后自动显示检查 ② 失败项清楚 ③ 失败不阻止复制 ④ 可点"按未通过项修正"并复验 ⑤ 命中禁用/引流词被判 ✗ 并定位。

### F-16 表现回填闭环 lite（P5 落地，护城河种子）
- **目的**：M1 不做平台数据抓取，但提供**手动回填**，让爆款特征库与验收标准从第一条笔记开始攒——这是平台不替你做、越用越准的飞轮。
- 入口：历史/配方详情/发布后提醒——对一条已生成内容标注「已发布」+ 表现（点赞/收藏/涨粉，粗粒度区间即可）+ 可选一句复盘。
- 回流：表现数据 → 更新该 intentType 的「爆款特征」与验收侧重 → 影响下次生成的默认假设与配方推荐（M1 影响"推荐哪个配方/默认风格"，不做复杂模型训练）。
- 数据：写 sessions 的 `published_at / like_range / favorite_range / comment_range / follower_gain_range / performance_note` 字段（range 枚举见 DATA-SCHEMA §2.6；M1 不做 perf_score，见 DECISIONS D-02）。
- AC：① 用户可对一条内容标注已发布+表现 ② 标注后该数据可在该 session/配方上看到 ③ M1 仅展示回填数据，不做"高表现配方优先识别/排序"——该项依赖 perf_score，随之延后到 M2（见 DECISIONS D-05）④ 未回填不影响其它功能。

---

# 第五部分 · 数据 / 接口 / 质量

## 10. 内容类型、损耗维度、Schema、判定规则

### 10.1 intent taxonomy（M1）
`content_package`（主线）、`xiaohongshu_note`、`card_prompt`、`generic_content`（兜底）。按**输出形态**分类，决定 outputSchema 与损耗维度。

### 10.2 lossDimensions（F-04 直接消费，content_package 示例）
`askable` = 默认不可信时是否允许提问。

| dimension | impact | valueType | options/格式 | 默认来源 | askable |
|---|---|---|---|---|---|
| platform | Med | enum | 小红书 | 固定 | 否 |
| audience（受众） | High | text | 自由（如"第一次独居的人"） | inferred/profile | **是** |
| goal（内容目标） | High | enum | 涨粉/收藏/种草/建立人设 | inferred | **是** |
| tone（语气） | High | text | 如"成熟、清楚、不焦虑" | inferred/profile | 否 |
| visual_style（视觉风格） | High | text | 如"成熟生活手册式" | inferred/profile | 否 |
| card_count（卡片数） | Med | number | 5–12，默认 7 | inferred | 否 |
| output_type（输出内容） | Med | enum | 卡片Prompt+发布文案 / 仅笔记 / 仅卡片 | inferred | 否 |
| negative_rules（禁止项） | Med | list | 不要广告感/焦虑营销… | profile/默认 | 否 |

### 10.3 outputSchema（前端按此渲染配方区）

```json
// content_package
{ "intentType":"content_package","version":1,
  "fields":[
    {"key":"positioning","label":"内容定位","type":"text","required":true,"order":1},
    {"key":"titles","label":"标题备选","type":"list","required":true,"order":2},
    {"key":"body","label":"小红书正文","type":"markdown","required":true,"order":3},
    {"key":"cards","label":"卡片结构与每张Prompt","type":"card_list","required":true,"order":4},
    {"key":"hashtags","label":"话题","type":"list","required":true,"order":5},
    {"key":"comment_hook","label":"评论区引导","type":"text","required":false,"order":6}
  ],
  "acceptance":[
    {"key":"has_title","type":"required_field","target":"titles","machine":true},
    {"key":"has_cards","type":"required_field","target":"cards","machine":true},
    {"key":"tags","type":"count","target":"hashtags","min":5,"max":10,"machine":true},
    {"key":"banned","type":"banned_words","machine":true}
  ] }
// card_prompt / xiaohongshu_note 各自一张定死 schema；generic_content = 七段式兜底（不打磨）
```

### 10.4 三级补全判定规则（实现 P1，F-04 引用）

```
对每个 lossDimension（带 impact）：
if 已知上下文(profile/历史/本次输入)可填 → assumption(source="profile")
elif impact ∈ {Med,Low}                    → assumption(source="inferred", highlight=false)
elif impact==High 且 confidence≥τ_assume    → assumption(source="inferred", highlight=true)  // 亮出引导核对
else (impact==High 且 confidence<τ_assume)  → question(optional=true)
最后 questions 按 (impact×不确定度) 降序取前 Q_MAX(3)，溢出转 highlight 假设。
```

### 10.5 参数表

| 代号 | 含义 | 默认 |
|---|---|---|
| `τ_intent` | 类型置信度阈值，低于则类型转可改 chip | 0.6 |
| `τ_assume` | 假设可信度阈值 | 0.5 |
| `Q_MAX` | 单次最多提问数 | 3 |
| 输入上限 | 单次输入字数 | 8000 |
| 首次/重生成上限 | 端到端生成耗时 | ≤ 15s |

## 11. 数据模型

> M1 用 `user_id` + Supabase RLS（一人开发务实选择）。`user_id` 即 personal 作用域；team/tenant 是 M2，届时加 `scope` 字段即可，不必现在预埋多租户。

```sql
sessions {
  id uuid pk, user_id uuid not null,
  raw_input text not null, intent_type text not null,
  assumptions jsonb, outcome jsonb, recipe_snapshot jsonb, verification jsonb,
  source_recipe_id uuid null, status text,
  error_code text, error_message text,
  published_at timestamp, like_range text, favorite_range text,   -- F-16 手动回填(range 枚举见 DATA-SCHEMA §2.6)
  comment_range text, follower_gain_range text, performance_note text,   -- M1 不做 perf_score(M2)
  created_at timestamp, updated_at timestamp }

recipes {
  id uuid pk, user_id uuid not null, name text not null, intent_type text not null,
  schema jsonb not null, fields jsonb not null, acceptance jsonb,
  variables jsonb, negative_rules jsonb, source_session_id uuid,
  usage_count int default 0,   -- perf_score 延后到 M2(M1 不做表现聚合，见 DECISIONS D-02)
  created_at timestamp, updated_at timestamp }

profile_preferences {
  id uuid pk, user_id uuid not null, intent_type text not null,
  dimension_key text not null, dimension_label text not null,
  value text not null, source text default 'manual',
  created_at timestamp, updated_at timestamp }

usage_events { id uuid pk, user_id uuid not null, session_id uuid null,
  event_name text not null, event_payload jsonb, created_at timestamp }
```
**RLS**：所有表启用，用户只能读写 `user_id = auth.uid()` 的记录。

## 12. API 契约 + 错误码

```
POST /api/forge                创建生成   { rawInput, intentType?, assumptions?, sourceRecipeId? }
                               → { sessionId, intentType, assumptions, outcome, recipe, verification }
POST /api/forge/regenerate     改假设重生 { sessionId, rawInput, intentType, assumptions }
POST /api/recipes              保存配方   { sessionId, name }
GET  /api/recipes              列表
GET  /api/recipes/:id          详情
DELETE /api/recipes/:id        删除
POST /api/recipes/:id/rerun    重跑       { rawInput }
GET  /api/profile/preferences  偏好列表
DELETE /api/profile/preferences/:id  删偏好
POST /api/sessions/:id/performance   表现回填(F-16)  { published, performance }
```
契约稳定：字段名稳定；`recipe.fields` 随 intentType 自适应，消费方按 schema 渲染。

| 错误码 | HTTP | 场景 |
|---|---:|---|
| AUTH_REQUIRED | 401 | 未登录 |
| PERMISSION_DENIED | 403 | 访问他人数据 |
| INPUT_EMPTY / INPUT_TOO_LONG | 400 | 输入空 / 超 8000 |
| SESSION_NOT_FOUND / RECIPE_NOT_FOUND | 404 | 不存在 |
| GENERATION_FAILED | 500 | 生成失败 |
| VALIDATION_FAILED | 400 | 参数不合法 |
| RATE_LIMITED | 429 | 请求过快 |

## 13. 质量保障：eval 门禁 + 端到端样例

### 13.1 eval harness（防质量回归，换模型/调 prompt 必跑）
- 评测集：以 §13.3 端到端样例为种子，扩到每 intentType ≥ 20 条；字段 `input, expectedIntent, expectedAssumptions(子集), maxQuestions, outcomeRubric, verificationExpect`。
- 离线指标 + 门槛：类型准确率 ≥90%、假设命中率 ≥80%、提问数达标率 ≥95%、机器验证通过率 ≥90%、产出 rubric 均分 ≥4/5。
- rubric（"可发布"的可操作定义，1–5）：切题 / 结构完整 / 可直接发(无需大改) / 符合约束(长度/禁用词/合规) / 风格贴合(与假设/偏好一致)。
- **CI 门禁**：改引擎/prompt/模型 → 跑评测集，任一门槛回退 >3pp 阻断合入。

### 13.2 埋点
`login_success / forge_started / intent_detected / assumption_edited / assumption_dismissed / outcome_generated / outcome_copied / recipe_saved / recipe_rerun / preference_saved / verification_failed / performance_filled(F-16)`。

### 13.3 端到端样例（测试 + eval 种子）
1. **冷启动内容包**：输入"想做一组小红书卡片，主题是第一次独居备用金清单" → content_package、≥5 假设条、含标题/正文/卡片 Prompt/话题、配方含受众/语气/视觉/禁止项、可复制可保存。
2. **改卡片数重生**：7→10 张 → 点重生后 10 张卡片 Prompt、其余风格一致、改动被记录。
3. **配方重跑**：原"独居手册式卡片配方" + 新输入"退租拍照清单" → 沿用视觉风格、主题替换、新 Session、原配方不覆盖。
4. **偏好记忆**：语气 轻松种草→成熟不焦虑 → 下次同类默认该语气、偏好页可见、删除后不带出。
5. **验收失败修正**：缺话题标签 → 验收显 ✗、点"按未通过项修正"补话题、仍可忽略并复制。
6. **表现回填（P5）**：对样例1的内容标注"已发布·高收藏" → 回填数据写入该 session、并可在来源配方详情查看（M1 不计算 perf_score、不做库内优先识别/排序，延后 M2）。

---

# 第六部分 · 交付与执行

## 14. 非功能需求

- 性能：Forge 首屏 ≤2s、建 Session ≤500ms、首次/重生成 ≤15s、列表 ≤2s。
- 安全：API Key 不出前端；用户只能访问自己数据；写操作必登录；RLS 必启；输入默认不用于训练（除非明确授权）。
- 稳定：生成/保存失败可重试；刷新不丢当前 Session；按 user_id 隔离。
- 兼容：Chrome/Safari 最新版 + 移动端 Safari/Chrome。
- 可用性：模型失败/超时有降级或重试，不白屏。

## 15. 技术栈 / 工具链 / 拆票 / 里程碑

### 15.1 技术栈（一人可控）
Next.js + TypeScript · Tailwind + shadcn/ui · React Hook Form + Zod · Supabase(Postgres+Auth+RLS) · Vercel · OpenAI 或 Anthropic（单模型）· PostHog 埋点 · Sentry 监控 · GitHub。
**不用**：自建后端 / K8s / 微服务 / 自研登录 / 多模型路由 / 原生 App。

### 15.2 目录（关键）
```
/app: /login /forge /recipes /recipes/[id] /profile /api{forge, forge/regenerate, recipes, recipes/[id], recipes/[id]/rerun, profile/preferences, sessions/[id]/performance}
/components: /forge{IdeaInput,IntentChip,AssumptionChips,OutcomePanel,RecipePanel,VerificationPanel,ActionBar} /recipes /profile /layout
/lib/forge-engine: classifyIntent, buildAssumptions(三级判定), buildPrompt, generateOutcome, buildRecipe, verifyOutcome
/lib/supabase  /lib/eval(评测集+门禁)  /lib/types
```

### 15.3 一人开发工具链 + 日常流程
Codex（读文档、判断下一票、写执行指令、最终 review）· Claude Code（按票改代码、跑验证、反馈结果）· Claude Design（UI 方向/原型，不直接作为代码来源）· GitHub Issues · Vercel · Supabase · PostHog · Sentry。
日常：Codex 定唯一目标+AC → 写 Issue/执行票 → Claude Code 实现 → 本地手测/自动验证 → Codex review diff → 过 AC commit → Vercel Preview。

### 15.4 里程碑

| 里程碑 | 目标 | 验收 |
|---|---|---|
| M1.0 骨架 | 能登录、进 `/forge`、空页可跑 | 用户能登录进工作台；Vercel 可访问 |
| M1.1 生成闭环 | 输入→类型识别→假设条→LLM→Outcome+Recipe | 输入主题能看到完整内容包+配方 |
| M1.2 交互闭环 | chip 编辑/删除/重生、复制、保存配方 | 改假设得新结果并保存配方 |
| M1.3 复用闭环 | 配方库/详情/换输入重跑/偏好记忆 | 用历史配方生成新主题 |
| M1.4 飞轮+内测 | F-14 验收、F-16 表现回填、eval 门禁、错误/空态、移动端、埋点/监控、20 条样例 | 可发 5–20 个真实用户内测，且能开始回填表现 |

### 15.5 拆票（首批）
I-01 Next+TS+Tailwind · I-02 shadcn · I-03 Supabase Auth · I-04 建表+RLS · I-05 AppShell+导航 · I-06 Forge 静态 UI · I-07 IdeaInput · I-08 `/api/forge` · I-09 classifyIntent · I-10 buildAssumptions(三级判定)。
后续：LLM 生成 / Outcome+Recipe 面板 / chip 编辑 / 重生 / 复制 / 保存 / 库 / 详情 / 重跑 / 偏好 / 验收 / F-16 回填 / eval 门禁 / 错误空态 / 移动端 / PostHog / Sentry / 20 样例 / 部署。每票挂对应 AC 为完成标准。

## 16. M1 完成定义（DoD）

M1 完成，当且仅当：① 能登录 ② 能输入想法 ③ 识别内容类型 ④ 生成假设条（含三级判定，提问 ≤3）⑤ 编辑/删除/恢复假设 ⑥ 生成完整内容包（含每张卡片 Prompt）⑦ 含正文/标题/卡片 Prompt/话题 ⑧ 复制全文或分区 ⑨ 保存配方 ⑩ 配方库可查 ⑪ 换输入重跑 ⑫ 显式偏好下次带出 ⑬ 基础验收 + 合规检查可见 ⑭ **可手动回填表现（F-16）且能更新配方表现标记** ⑮ 失败/空输入有明确提示 ⑯ 只能访问自己数据（RLS）⑰ 20 条真实样例过 eval 门禁 ⑱ Vercel 生产可访问、PostHog 见关键事件、Sentry 捕获错误。

## 17. 待决问题（开工前拍板）
1. `card_count` 默认与上限是否随 output_type 变（仅卡片 vs 包）？（**待定**）
2. ~~F-16 表现区间阈值~~ → **已定（Day 0 / D-02）**：统一 range 枚举 `0 / 1-10 / 11-50 / 51-100 / 101-500 / 500+ / unknown`，M1 仅手动回填、不随粉丝量归一化。见 [DECISIONS](DECISIONS.md)。
3. 合规禁用词表来源（自维护初版 + 后续可配）。（**待定**）
4. ~~降级/失败时是否允许草稿态保存~~ → **已定（Day 0 / D-04）**：允许，`status=draft`、`outcome=null`、`error_code=GENERATION_FAILED`、可重试。见 [DECISIONS](DECISIONS.md)。

---

# 附录

## A. 关键设计决策与依据（防止退回直觉做法）

| 决策 | 被否决的做法 | 依据 |
|---|---|---|
| 垂直结果工厂（小红书创作者·可发布内容包） | 横向"什么都能优化"中间层 | 横向=在模型主场对打平台、价值随模型变强被吃掉；垂直=做没人替你做的最后一公里（§1.4） |
| 交付内容包含每张卡片 Prompt | 只给文案 | 小红书图文本质是轮播卡片，难点在每张图 Prompt + 视觉一致性（领域真实） |
| 验收绑真实表现 + 回流（P5/F-16） | 验收只做内部结构 QC | 生成商品化后唯一杀不死的护城河是把"什么算合格"绑现实并复利；M1 用手动 lite 起步 |
| 提问三级判定、可为 0（§10.4） | 固定问 N 个问题 | 提问是最高成本来源（P1） |
| eval 门禁（§13.1） | 仅人工抽测 | 换模型/调 prompt 会静默回退质量，需 CI 护栏 |
| M1 用 user_id+RLS，不预埋多租户 | 一开始就做 scope/多租户 | 一人 M1 验证留存优先；team/tenant 是 M2，届时加 scope 字段即可 |
| 单模型、模型无关 | 多模型路由平台 | 生成是可替换商品，一人开发不在此投入 |

## B. 术语表
- **内容包**：一次生成的完整可发布资产（定位/标题/正文/卡片Prompt/话题/评论区引导）。
- **配方（Recipe）**：生成某内容包所用的、可复用可参数化的结构化规格。
- **损耗维度**：某内容类型下"不补就会跑偏"的关键变量，带 impact。
- **假设条**：系统替用户补全并亮出的默认值，可改可否决。
- **表现回流（P5）**：发布后真实表现回填，持续校准验收标准与爆款特征——护城河飞轮。
