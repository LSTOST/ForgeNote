# ForgeNote Operating Model

> 目标：把 ForgeNote 从“能写功能”推进到“能证明功能可用、稳定、有人持续用”。

## 角色

| 角色 | 公司类比 | 拥有权 | 否决点 |
|---|---|---|---|
| Owner | 产品负责人 / CEO | 产品方向、优先级、最终拍板 | 需求不值得做、方向不对、验收证据不足 |
| Codex | 技术负责人 / 架构审查 / QA Agent | 技术边界、数据/API/RLS 正确性、验收协议、最终质量闸 | 架构越界、数据风险、用户路径跑不通、证据不足 |
| Claude Design | UX/UI 设计师 | 视觉方向、交互原型、信息层级 | 体验不清楚、界面无法支撑真实用户任务 |
| Claude Code | 前端工程师 | Next.js 项目实现、组件状态、响应式、可访问性 | 实现不符合票据、状态缺失、回归现有流程 |
| Vercel + CI | DevOps / 发布保障 | build、Preview、环境变量、运行时边界 | CI 红、Preview 不可用、env / auth / deployment 未验 |
| Real User Feedback | 用户研究 / 产品验证 | 真实使用反馈、阻塞点、用后行为 | 用户看不懂、用不下去、没有重复使用迹象 |
| Analytics | 增长与迭代判断 | 保存率、重跑率、回访率、表现回填率等指标 | 没有指标证据支撑继续加功能 |

## 运行原则

1. 功能完成不等于票完成；票完成必须有可复核证据。
2. 代码 review 只证明“实现大概率没写坏”，不能证明“产品真的可用”。
3. 用户路径验收优先于组件级截图；截图只能当辅助证据。
4. Preview 验收优先于本地验收；本地验收只能证明开发环境没坏。
5. 没有数据埋点或反馈入口的功能，不允许被判断为“值得继续投入”。

## 每票必须过的四道 Gate

### Gate 1: Product Intent

动手前必须回答：

- 用户是谁？
- 用户来这里要完成什么任务？
- 这张票改变了哪条真实路径？
- 不做这张票会损失什么？
- 本票范围外是什么？

如果答案模糊，Codex 必须先收敛票据，不能直接让 Claude Code 实现。

### Gate 2: Implementation Correctness

Claude Code 完成后，Codex 按工程标准检查：

- API / 数据模型 / RLS 是否符合 `docs/API-CONTRACT-M2.md` 与 `docs/DATA-SCHEMA-M2.md`。
- UI 状态是否覆盖空态、加载态、成功态、错误态、禁用态。
- Server / Client 边界是否符合当前 Next.js 文档。
- 是否回归 login / forge / recipes / profile 主链路。
- 是否引入多余依赖、隐式重构或越界功能。

### Gate 3: User Path Acceptance

Codex 切换为 QA Agent，按真实用户路径验收。不能只读代码。

M1 主路径基线：

```text
新用户进入 Forge Workspace
→ 输入模糊想法
→ 看懂假设条
→ 修改一项默认假设
→ 成功生成内容包
→ 保存配方
→ 刷新页面后仍能找到结果
→ 从配方详情换输入重跑
→ 记录发布表现
→ 回看时表现数据仍在
```

每张用户可见票必须从这条基线中选择受影响片段，并写入对应 `docs/acceptance/*.md`：

- 验收环境：本地 / Preview / Production。
- 用户身份：匿名 / 新用户 / 已登录用户。
- 操作步骤：按真实点击和输入顺序写。
- 预期结果：用户看见什么、数据保存到哪里。
- 实测结果：通过 / 失败 / 阻塞。
- 证据：命令输出摘要、Preview URL、session id、截图或录屏说明。
- 残余风险：没验到的路径必须明说。

### Gate 4: Release And Feedback

合并或上线前必须确认：

- CI 通过：doctor / lint / typecheck / build。
- Preview 可访问，且受影响路径在 Preview 上跑过。
- 必需 env 已配置到目标环境；secret 不打印。
- 数据库 migration 已应用，RLS 边界可验证。
- 观测或反馈机制存在：至少能回答用户是否保存、重跑、回访、回填表现。
- 如果没有数据证据，本票只能标记“功能可用”，不能标记“产品验证通过”。

## Codex 的 QA Agent 模式

当票进入 Review，Codex 必须显式切换判断标准：

| 技术负责人模式 | QA Agent 模式 |
|---|---|
| 代码是否正确 | 用户是否完成任务 |
| 类型是否通过 | 页面是否看得懂 |
| API 是否符合契约 | 错误时用户是否能恢复 |
| 数据是否安全 | 刷新、回看、跨页面是否连续 |
| 构建是否通过 | Preview 上是否真能跑 |

QA Agent 的结论只能有三种：

- Pass：真实路径跑通，证据足够。
- Conditional Pass：核心路径跑通，但有明确残余风险，不阻断本票。
- Fail / Blocked：路径跑不通，或关键证据缺失。

## 指标闭环

M1 后续迭代至少追踪这些指标：

| 指标 | 说明 | 价值 |
|---|---|---|
| activation_rate | 登录后完成首次生成的比例 | 用户是否跨过第一道门槛 |
| assumption_edit_rate | 生成前编辑假设条的比例 | 假设条是否被理解和使用 |
| recipe_save_rate | 生成后保存配方的比例 | 结果是否有复用价值 |
| recipe_rerun_rate | 从配方详情重跑的比例 | 配方机制是否成立 |
| return_session_rate | 用户是否回看历史结果 | 持久化是否带来价值 |
| performance_fill_rate | 用户是否回填发布表现 | 用户是否愿意建立反馈闭环 |

没有这些指标前，不要急着堆新功能。先证明当前闭环有人走完。
