# ForgeNote Tickets

> 执行层唯一任务板。`PRD-M1.md` 定义产品，`PROJECT-STATUS.md` 记录当前快照，本文件负责把 M1 拆成可推进、可验收、可追踪的票。
> 基线：`main` / `origin/main` = `f5f76a0`（PR #17 / V-01-FIX-03 已合入并同步 V-01 Ready 状态）。**不回滚到 I-02B 旧状态。**

## 状态定义

| 状态 | 含义 |
|---|---|
| Backlog | 未开始，边界可调整 |
| Ready | 边界、依赖、验收标准已清楚 |
| In Progress | 正在实现 |
| Review | 已实现，待 Codex 切换 QA Agent 做真实用户路径验收 |
| Blocked | 被外部条件卡住 |
| Done | 通过自动验证、真实用户路径验收，并补齐验收证据后合入 |

## 更新规则

1. 每次只允许一个「下一张唯一任务」。
2. 每张票必须写清楚：目标、范围外、验收标准、验证命令、涉及文档。
3. 状态变更必须同步 `docs/PROJECT-STATUS.md`。
4. 设计 / API / 数据决策冲突时，以 `docs/DECISIONS.md` 为准。
5. 用户可见票必须按 `docs/OPERATING-MODEL.md` 的 Gate 3 写真实用户路径验收。
6. 票完成后，补一条验收记录到对应 `docs/acceptance/*.md`。

## 已完成（Done）

| 批次 | 状态 | 目标 | 验收文档 |
|---|---|---|---|
| I-01 | Done | Next.js 骨架 + 静态 `/forge` + CI | — |
| I-02A | Done | OpenRouter 接入契约 + 类型 + mock | — |
| I-02B | Done | OpenRouter 真实调用 + `POST /api/forge` + `/forge` 渲染 | `docs/acceptance/I-02B.md` |
| Batch A | Done | `/api/forge` 必须登录 + session 持久化 + `0001_init.sql` + RLS | `docs/acceptance/Batch-C.md` |
| Batch B | Done | Supabase 登录闭环（`/login`、`/auth/callback`、`/auth/signout`、受保护 `/forge`） | `docs/acceptance/Batch-C.md` |
| Batch C | Done | 假设条编辑器 + 结果操作区（复制 / 重生成 / 新建） | `docs/acceptance/Batch-C.md` |
| QA-01 | Done | 工具链与流程文档现代化恢复（doctor / smoke / RLS 检查 / RUNBOOK / DEPLOYMENT / PR 模板） | `docs/acceptance/Batch-C.md` |
| I-08 | Done | 保存配方最小闭环（`POST /api/recipes` + RecipePanel 命名/保存/反馈） | `docs/acceptance/I-08.md` |
| I-09 | Done | 配方库 `/recipes` 列表、搜索、类型筛选、删除 | `docs/acceptance/I-09.md` |
| I-10 | Done | 配方详情 `/recipes/[id]` + 换输入重跑（`POST /api/recipes/:id/rerun`） | `docs/acceptance/I-10.md` |
| I-15 | Done | v5 选择性折叠文案 / 产品表述收敛（图文卡片 / carousel 方向，additive） | `docs/acceptance/I-15.md` |
| I-16 | Done | output_locale 数据与生成链路（sessions 增 nullable text 列 + forge/rerun/session API + 生成约束 + UI 自由文本输入，additive） | `docs/acceptance/I-16.md` |
| I-11 | Done | 偏好页 `/profile`：edited assumptions 写入并下次带出（profile_preferences CRUD + /forge 带出 + 「记住为偏好」，无 migration） | `docs/acceptance/I-11.md` |
| I-12 | Done | F-16 表现回填 lite（`POST /api/sessions/:id/performance` + GET 读回 + OutcomePanel 入口，无 migration） | `docs/acceptance/I-12.md` |
| I-13 | Done | eval 门禁接入（`eval:forge` npm + safe-mode SKIP；手动/本地，不进 PR CI） | `docs/acceptance/I-13.md` |
| I-14 | Done | PostHog / Sentry 基础观测（零依赖 no-op scaffold + 可选 env + 文档） | `docs/acceptance/I-14.md` |
| I-17 | Done | UI copy resource extraction scaffold（src/lib/copy en+zh-Hans + typed helper，代表性接线，不改行为） | `docs/acceptance/I-17.md` |
| I-18 | Done | 补齐 UI copy 资源覆盖（活跃页面剩余硬编码 chrome 文案收敛到 `src/lib/copy/{zh-Hans,en}.ts`，承接 I-17，默认 zh-Hans 行为不变） | `docs/acceptance/I-18.md` |
| I-19 | Done | Production 上线就绪 + DB 指标读出（只读 `scripts/metrics.mjs`）；Gate 3 OAuth/基础设施实测 + Gate 4 生产指标读出；用户内容路径 Conditional Pass（Preview 同码已验，Owner 接受） | `docs/acceptance/I-19.md` |
| DSN-01 | Done | Open Design POC：onboarding-first `/forge` + account-level assumption chips；Codex review Conditional Pass，允许拆 I-20 | `docs/design/dsn-01-open-design/codex-review.md` |
| I-20 | Done | DSN-01 最小实现：onboarding-first `/forge` shell、可选过往帖、三条账号级方向假设、依据/置信度、编辑确认、`accountPost` 数据锚点；OpenRouter 401 修复后真实生成成功 | `docs/acceptance/I-20.md` |
| I-21 | Done | 生成成功/草稿失败后把 session 写入 `/forge?session=`，刷新仍能回看结果或恢复错误态；新建/重新定方向清理旧 session URL | `docs/acceptance/I-21.md` |
| I-22 | Done | 第一份内容方案可用性升级：生成契约/prompt、结果区、复制动作、保存配方前价值判断；Preview Gate 3 pass 后随 PR #10 合入 | `docs/acceptance/I-22.md` |
| I-23 | Done | 保存配方后的复用证据链：保存成功进入配方详情、换输入重跑后保持 I-22 结构；Preview Gate 3 pass 后随 PR #12 合入 | `docs/acceptance/I-23.md` |
| V-01-FIX-01 | Done | 修复 V-01 前置入口阻塞：/forge 首屏状态文案、第一步按钮语义、方向确认滚动露出、输出语言/表达偏好可见性与快捷选项；Preview Gate 3 pass | `docs/acceptance/V-01.md` |
| V-01-FIX-02 | Done | 修复 V-01 二次入口理解阻塞：空态“新建”、主文案压迫感、方向确认输入反馈、按钮/图标一致性；Preview Gate 3 pass | `docs/acceptance/V-01.md` |
| V-01-FIX-03 | Done | 修复 V-01 页面形态阻塞：/forge 桌面端重排为左=账号/内容资产，中=当前任务与内容方案，右=方向假设/生成控制/配方，底=当前 session/复用/表现；Preview Gate 3 pass | `docs/acceptance/V-01.md` |

> I-18 已 squash merge 到 `main`（`b56cfa0`，PR #2），远端分支 `i-18-copy-coverage` 已删除；验收文档 `docs/acceptance/I-18.md` 已在 `main`。
> I-19 代码/文档侧已 squash merge 到 `main`（`acd94fe`，PR #4）；Production 配置（Vercel env→Production / Deployment Protection 关 / Supabase redirect+Google）+ 生产 OAuth 登录往返 + Gate 4 生产指标读出均已实测（2026-06-23），用户内容路径以 Preview 同码已验为依据由 Owner 接受 **Conditional Pass**，**I-19 → Done**。OPS-02 状态同步 PR 另出。
> PR #9 已 squash merge 到 `main`（`77e5b80`），DSN-01 / I-20 / I-21 全部进入 `main`。
> PR #10 已 squash merge 到 `main`（`a9c0f44`），I-22 进入 Done。
> PR #12 已 squash merge 到 `main`（`c62065f`），I-23 进入 Done。
> PR #13 已 squash merge 到 `main`（`b42a33b`），I-23 Done / V-01 Ready 状态同步进入 `main`。

## 下一张唯一任务

| 票号 | 状态 | 目标 | 范围外 | 依赖 |
|---|---|---|---|---|
| V-01-FIX-04 | Review | 修复非 Google 用户登录摩擦：邮箱密码成为主路径，Magic Link 降级为备用，避免每次登录都必须去邮箱点确认 | 新 OAuth、MFA/passkey、重置密码、账号合并、Supabase 后台配置变更、业务表/API/RLS/prompt 改动 | Gate 2 pass；Preview Gate 3 待跑 |

> **方向依据**：`docs/ForgeNote_修订版方向.md` 北极星——「创作者第一次用就觉得它比空白 ChatGPT 更懂我的账号」。I-20/I-22/I-23 已把三支柱串起来：假设条、可用内容方案、配方复用。下一步不能再堆功能，必须让真实用户走完整路径，拿到是否看得懂、是否保存、是否重跑的证据。

### V-01-FIX-04 执行票（当前唯一任务）

```text
票号：V-01-FIX-04
状态：Review
类型：V-01 前置登录摩擦修复（只改 /login 前端，不改业务范围）
目标：修复真实用户反馈：
      没有 Google 账号时，每次登录都要去邮箱点确认，入口不人性化。
      非 Google 用户必须有一个不用每次打开邮箱的登录路径。

范围内：
1. `/login` 邮箱登录主路径从 Magic Link 改为邮箱 + 密码：
   - 已注册用户：输入邮箱和密码后直接进入 `/forge`。
   - 新用户：可创建邮箱密码账号；如 Supabase 要求确认邮箱，只需首次确认一次。
2. Google 登录保留。
3. Magic Link 保留为备用入口，明确提示它仍需要打开邮箱。
4. 登录页文案解释清楚：确认过邮箱后，下次直接用密码，不用每次去邮箱点链接。
5. 只改客户端登录表单与 copy 资源。

范围外：
- 不新增 GitHub/Apple/微信等 OAuth。
- 不做 MFA/passkey、忘记密码/重置密码、账号合并。
- 不改 `/auth/callback`、业务 API、DB、RLS、prompt、Forge 工作台。
- 不改 Supabase 后台策略；若 Production 禁用 Email password，本票在 Preview/Production Gate 3 记录为外部配置阻塞。

验收标准：
- `/login` 第一屏仍有 Google 登录。
- 邮箱区域默认呈现“登录 / 注册”切换、邮箱、密码；Magic Link 不再是邮箱主路径。
- 已注册且邮箱已确认用户可通过邮箱 + 密码登录后进入 `/forge`。
- 新用户注册后若需要确认邮箱，页面明确提示“首次确认一次，之后用密码直接登录”。
- Magic Link 入口文案明确为备用，并说明仍需打开邮箱。
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- Preview Gate 3：匿名打开 `/login`，确认新登录入口；若有可用测试邮箱密码，跑通登录到 `/forge`；否则记录 Supabase/测试账号阻塞。

下一步：
- Gate 2 已通过：doctor / lint / typecheck / build / smoke:api / diff check。
- Local visual acceptance 未计入：Playwright 被 macOS sandbox 阻止，Chrome 本地导航被当前工具额度阻止。
- 下一步：开 PR，跑 Preview Gate 3。
- 合入后恢复 V-01 Production 真实用户验证。
```

### V-01-FIX-03 执行票（已完成）

```text
票号：V-01-FIX-03
状态：Done
类型：V-01 前置页面形态修复（只改前端布局，不改产品范围）
目标：修复 Owner 真实用户试用暴露的页面形态错位：
      当前 /forge 仍是上到下的纵向流，不是此前讨论的左 / 中 / 右 / 底工作台。
      用户进入后必须感到这是内容工作台，而不是纵向表单。

范围内：
1. 桌面端 `/forge` 改为最小工作台壳：
   - 左：账号与内容资产入口（当前任务 / 配方库 / 账号偏好 + 轻量资产说明）。
   - 中：当前内容任务与内容方案（输入框、生成结果）。
   - 右：方向假设、输出语言/表达偏好、生成控制、保存配方。
   - 底：当前 session、复用、表现回填的连续性状态条。
2. 移动端保留自然纵向降级，不让桌面工作台硬挤小屏。
3. 只重排现有组件：IdeaInput、DirectionPanel、OutcomePanel、RecipePanel、output_locale 控件。
4. DirectionPanel 支持右栏 compact 模式，假设条纵向排列。

范围外：
- 不改 /api/forge、prompt、DB、RLS。
- 不做资产库真实列表、完整历史版本列表、多面板拖拽、视觉渲染、自动学习、runtime i18n、内容日历。
- 不改变 I-20/I-22/I-23 的生成契约。

验收标准：
- 桌面首屏必须清楚呈现左 / 中 / 右 / 底四区，而不是单列上到下。
- 中区只承载当前任务输入与内容方案；方向判断和配方保存不再并排或堆在中区下方。
- 右区在输入前有方向占位，输入并「先确认方向」后出现 compact 假设条与生成按钮。
- 生成成功后内容方案仍在中区，保存配方区在右区，底部显示当前 session 连续性。
- 移动端不溢出、不重叠，按合理纵向顺序降级。
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- Preview Gate 3 跑 `/forge` 输入 → 先确认方向 → 右区方向反馈 → 中区生成内容方案 → 右区保存配方可用。

下一步：
- Gate 2 已通过：doctor / lint / typecheck / build / smoke:api / diff check。
- Preview Gate 3 已通过：PR #17 Preview 登录态 `nb19870729@gmail.com` 完成 `/forge` 宽屏布局确认 → 输入 `first cat budget checklist carousel` → 先确认方向 → 右栏 compact 方向反馈 → 生成内容方案 → `/forge?session=e83a0f3d-24f7-4350-b62a-af756ab07ca5`。
- 下一步：恢复 V-01，安排真实非构建者用户跑 Production 主路径。
```

### V-01-FIX-02 执行票（已完成）

```text
票号：V-01-FIX-02
状态：Done
类型：V-01 前置入口理解修复（只改前端交互，不改产品范围）
目标：修复 Owner 二次 dry run 暴露的 /forge 入口理解问题：
      用户必须在第一屏看懂怎么开始；点击“先确认方向”后必须看见输入内容带来的变化；
      按钮和图标必须匹配当前温暖文字工作台风格。

范围内：
1. 空态不展示无意义的“新建”；有草稿/结果后改为更明确的“清空重写”。
2. 降低首屏主文案字号，避免压迫工作台输入区。
3. 方向确认区展示“本次想法”，并让三条默认方向围绕当前输入生成，避免看起来像内置模板。
4. 粘贴过往帖入口使用粘贴语义图标，不使用附件/上传感图标。
5. 主 CTA、生成按钮、输出偏好快捷项改为同一套温暖动作色，降低冷 SaaS 割裂感。

范围外：
- 不改 /api/forge、prompt、DB、RLS。
- 不做资产库、视觉渲染、自动学习、runtime i18n、内容日历。
- 不改变 I-20/I-22/I-23 的生成契约。

验收标准：
- 空白 /forge 首屏不出现“新建”按钮。
- 主标题不再以 hero 级字号压过输入任务。
- 输入“第一次养猫预算清单”后点“先确认方向”，方向区必须显示本次想法，并出现围绕该主题的受众/内容形式/表达角度。
- “贴一条你发过的帖”入口图标语义是粘贴，不是上传/附件。
- 主要动作按钮视觉与温暖工作台背景一致。
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- Preview Gate 3 跑 `/forge` 输入 → 先确认方向 → 方向区反馈 → 生成内容方案。

下一步：
- Gate 2 已通过：doctor / lint / typecheck / build / smoke:api / diff check。
- Preview Gate 3 已通过：PR #16 Preview 登录态完成输入 → 先确认方向 → 方向区反馈 → 生成内容方案 → `/forge?session=4b73c107-f22e-42e3-b156-624704b7b109`。
- 下一步：恢复 V-01，安排真实非构建者用户跑 Production 主路径。
```

### V-01-FIX-01 执行票（已完成）

```text
票号：V-01-FIX-01
状态：Done
类型：V-01 前置阻塞修复（只改前端交互，不改产品范围）
目标：修复 Owner dry run 暴露的 /forge 入口混乱：
      用户输入想法后，必须清楚知道第一步是确认方向，第二步才是真生成；
      空态不能显示“正在写”；输出语言/表达偏好必须可见、有快捷选项、输入有反馈。

范围内：
1. 顶部 idle 状态从“正在写这次的想法”改为“输入一个想法开始”。
2. 首屏主按钮从“生成内容方案”改为“先确认方向”，避免误导。
3. 点击首屏主按钮后自动滚到方向确认区，让真正的“生成内容方案”按钮露出。
4. “输出语言 / 表达偏好”从折叠 details 改为可见控件，并提供快捷选项：
   中文 / English / Instagram carousel / LinkedIn carousel / 清空。

范围外：
- 不改 /api/forge、prompt、DB、RLS。
- 不做资产库、视觉渲染、自动学习、runtime i18n、内容日历。
- 不改变 I-20/I-22/I-23 的生成契约。

验收标准：
- 空态顶部不再显示“正在写这次的想法”。
- 用户填入想法后，首屏按钮明确为“先确认方向”。
- 点击后方向确认区出现并进入视野；用户能看到第二步“生成内容方案”。
- 输出语言/表达偏好区域默认可见；点击快捷选项会填入输入框；清空可用。
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- Preview 或 Production 上再跑 V-01 主路径。

下一步：
- Gate 2 已通过：doctor / lint / typecheck / build / smoke:api。
- Preview Gate 3 已通过：PR #15 Preview 登录态完成输入 → 先确认方向 → 方向确认 → 生成内容方案 → `/forge?session=c9a89de2-149a-401f-b6c8-cc689f9e7ae7`，结果含发布正文、5 页卡片文案、配图方向、发布前检查、全部通过。
- 下一步：恢复 V-01，安排真实非构建者用户跑 Production 主路径。
```

### DSN-01 执行票（Open Design POC，Claude Design 保底）

```text
票号：DSN-01
状态：Done（Open Design POC + Codex review Conditional Pass + Owner 指令推进 I-20）
类型：设计票（Open Design POC 原型；Codex review；Owner 拍板；不写代码；Claude Design 保底）
目标：设计「假设条 = 可见的账号级判断」的交互，以及支撑它的首屏冷启动体验，
      让首次用户在第一屏就感到「AI 已经懂我的账号，而且我几乎不用解释」。
      产出设计方向 / 原型 / 规格，供后续实现票落地。

范围内：
1. 假设条交互重设计——从「一行可改的表单默认值」升级为：
   - 假设以「AI 的账号级判断」呈现，而非配置项；
   - 展示判断依据（如「我假设受众是 X，因为 Y」）；
   - 纠偏像「掌舵」而非「填表」：确认 / 修改 / 否决的低成本操作；
   - 修改/否决后如何即时反映到下一次生成的预期。
   要解决现状痛点：编辑率仅 ~17%，说明假设条没被理解、不觉得值得动。
2. 首屏冷启动体验——设计「<1 分钟到『哇』」的首次路径：
   - 粘一个粗想法，或贴 1–2 条过往帖 → 立刻给出账号级假设；
   - 用「过往帖」冷启动账号画像，是把账号记忆在第一次就兑现的最便宜方式；
   - 首屏信息架构、引导、空态 → 首个结果的过渡。
3. 交付物：
   - 设计方向说明（为什么这样，对应北极星与支柱1）；
   - Open Design 高保真可点击原型（可导出 HTML 或截图/录屏作为评审证据）；若 POC 不达标，改用 Claude Design 产出同等原型；
   - 状态与边界标注：空态 / 加载 / 错误 / 无账号上下文时的 fallback；
   - 与现有 /forge 的差异点清单（哪些改、哪些留）。
4. 顺带给「执行潦草」最小修正建议清单（供实现票处理）：
   内部 taxonomy 外泄（如「内容包 / 小红书笔记 / 卡片 Prompt」摆给用户）、
   dev 口吻文案（如副标题「M1 不做自动发布」）。

范围外（守边界）：
- 不写代码、不改 prompt / schema / API / RLS。
- 不做视觉渲染卡片（修订版方向已排除，Canva 赛道）。
- 不重设计内容包（支柱2，另票）、不碰配方 / 学习闭环 / 发布 / 日历 / 多账号。
- 不做过度账号建模（复杂画像、自动学习）——本票只要「第一次就显得懂」的最小可行形态。

涉及文件：
- 设计交付物（Open Design 项目 / 导出 HTML / 截图 / 设计说明）位置由 Owner 指定；
- Open Design 执行 brief：`docs/design/DSN-01-brief.md`；
- Open Design 运行/费用/交付协议：`docs/design/OPEN-DESIGN-DSN-01-RUNBOOK.md`；
- 设计说明落 docs/（如 docs/design/DSN-01-assumptions.md，建库时定）。
- 不改任何 src / 状态文档由后续实现票同步。

验收标准（DSN-01 Done）：
- 假设条新交互（呈现 + 依据展示 + 纠偏方式）原型完成，Codex review 通过（可落地、不越界、最小可行），Owner 拍板。
- 首屏冷启动路径设计完成，含「贴过往帖 → 账号画像 → 假设」的最小可行形态。
- 明确哪些进下一张实现票、哪些延后。
- Open Design 生成代码不直接进入 ForgeNote；后续由 Claude Code 按项目现有 Next.js / shadcn / Tailwind 结构重写实现。
- Open Design POC 需先证明三件事：能稳定运行、能按 ForgeNote neutral/shadcn 风格出图、产物比直接用 Claude Design 不更慢/更差。否则不替代 Claude Design。
- Open Design 的模型费用不走 Claude Pro；若用 Open Design，Owner 手动提供 BYOK/AMR，Codex 不读取、不粘贴、不保存 secret。
- DSN-01 产物必须落 `docs/design/dsn-01-open-design/`，并包含 `handoff.md` 与 `codex-review.md` 后才能拆 I-20。

风险：
- 设计越界（要求图像生成 / 复杂账号建模 / 发布）会拖累实现——Codex review 守「最小可行」。
- 「账号级判断」若只是换皮文案而无真实依据，会沦为噱头——设计须说明依据从哪来（输入 + 过往帖），为实现票的 prompt 设计定锚。

下一步：
- 已拆并落地 I-20 最小实现；内容包（支柱2）作为其后的设计/实现票，不抢占本票。
```

### I-20 执行票（已完成）

```text
票号：I-20
状态：Done
类型：实现票（DSN-01 最小落地）
目标：让 `/forge` 首次路径从「表单生成器」变成 onboarding-first 内容工作台：
      用户先输入模糊想法，可选贴一条过往帖；系统先给三条账号级方向假设，
      用户低成本确认/修改后再进入既有生成链路。

范围内：
1. `/forge` 首屏 app shell：去掉营销 header，直达工作台。
2. IdeaInput：模糊想法主输入；可选 account_post/过往帖冷启动；本地草稿 autosave。
3. DirectionPanel：三条假设（受众 / 内容形式 / 表达角度），展示 rationale + confidence，可编辑并计数。
4. API/type/prompt 数据锚点：
   - `Assumption.rationale`
   - `Assumption.confidence`
   - `ForgeGenerationRequest.accountPost`
   - `POST /api/forge` 兼容 `accountPost` / `account_post`
5. 用户可见 copy 去内部 taxonomy：不把「内容包 / 小红书笔记 / 卡片 Prompt / Schema」作为主路径文案暴露。

范围外：
- 不直接复用 Open Design HTML/CSS/JS。
- 不做工作台终态/terminal layout。
- 不做内容包重设计、视觉渲染卡片、发布、日历、多账号。
- 不做复杂账号画像/自动学习；过往帖只用于本次推断。
- 不改 DB schema / RLS / `content_package` 底层契约。

涉及文件：
- `src/components/forge/ForgeWorkbench.tsx`
- `src/components/forge/IdeaInput.tsx`
- `src/components/forge/DirectionPanel.tsx`
- `src/app/forge/page.tsx`
- `src/app/api/forge/route.ts`
- `src/lib/ai/types.ts`
- `src/lib/ai/generate.ts`
- `src/lib/ai/mock-generator.ts`
- `src/lib/copy/zh-Hans.ts`
- `src/lib/copy/en.ts`
- `docs/acceptance/I-20.md`

验收标准：
- 自动验证：lint / typecheck / build 通过。
- 登录态 Chrome：`/forge` 首屏直达工作台；输入想法后进入方向确认，而不是直接生成。
- 方向确认只出现三条假设：受众 / 内容形式 / 表达角度。
- 每条假设有置信度与依据；编辑任一条后 count 变 `1/3`，该条置信度变「确定」。
- 点击最终生成时进入既有生成链路；若模型失败，错误态必须保留输入与假设并可重试。

验证命令：
  npm run lint
  npm run typecheck
  npm run build

实测结果：
- 自动验证通过。
- 真实 Chrome 登录态通过：输入 → 方向确认 → 编辑「受众」为「新手父母」→ `已确认 1/3`。
- 初次最终生成被 ForgeNote 本地 OpenRouter `401` 阻塞，错误态正常显示；Owner 恢复 ForgeNote runtime key 后，`OPENROUTER_MODEL=openai/gpt-4o-mini` 路径生成成功，session `63ec12d9-2f8c-4b76-9ed1-6474b837e5a4`；见 `docs/acceptance/I-20.md`。

下一步：
- I-20 Done。下一张票重新定边界；不要把视觉渲染、自动学习、内容包重设计塞回 I-20。
```

### I-21 执行票（已完成）

```text
票号：I-21
状态：Done
类型：实现票（I-20 用户路径连续性修正）
目标：补齐 onboarding-first `/forge` 生成后的持久化回看路径：
      生成成功后当前 URL 必须变成 `/forge?session=<id>`，用户刷新页面仍能看到刚生成的结果；
      生成失败但草稿已落库时，也要把草稿 session 写进 URL，刷新后恢复输入与错误态。

范围内：
1. `ForgeWorkbench` 在 `POST /api/forge` 成功后用返回的 `sessionId` 更新 URL。
2. `POST /api/forge` 返回草稿失败时读取 `draft.sessionId`，更新 URL 并保留错误态。
3. 用户点击「新建」或重新进入方向确认时清理旧 `?session=`，避免把新任务误绑定到旧结果。
4. 利用既有 `/forge?session=` Server Component 预载逻辑，不新增 API / DB / RLS。

范围外：
- 不改 prompt / schema / RLS / `content_package` 契约。
- 不做 session history、版本列表、资产库、视觉配方、内容包重设计。
- 不引入新依赖，不扩大 DSN-01 / I-20 范围。

涉及文件：
- `src/components/forge/ForgeWorkbench.tsx`
- `docs/acceptance/I-21.md`
- `docs/TICKETS.md`
- `docs/PROJECT-STATUS.md`

验收标准：
- 生成成功后浏览器地址栏从 `/forge` 变成 `/forge?session=<uuid>`。
- 刷新该 URL 后，服务端预载 session，结果区、配方区和 session id 仍可见。
- 生成失败且 API 返回 draft session 时，URL 也变成 `/forge?session=<uuid>`，刷新后恢复输入与错误态。
- 点击「新建」回到 `/forge`，不保留旧 session query。

验证命令：
  npm run lint
  npm run typecheck
  npm run build

实测结果：
- 自动验证通过。
- 代码路径核对通过：I-21 复用既有 `/forge?session=` 预载逻辑；本票不新增数据库/API 面。
```

### I-22 执行票（已完成）

```text
票号：I-22
状态：Done
类型：实现票（支柱 2：第一份内容方案可用性）
目标：把 `/forge` 的首个生成结果从“看起来像 AI 文案输出”升级为“创作者能直接拿去改一遍就发布的结构化初稿”。
      本票一次性覆盖结果质量、结果呈现、复制动作和保存配方前的价值判断，不再拆成多个小 UI 补丁。

用户是谁：
- 登录后的单人创作者，第一次或第二次使用 ForgeNote。

用户任务：
- 输入一个模糊想法，确认方向后，拿到一份能直接用于图文卡片/carousel 发布准备的内容方案。

本票改变的真实路径：
  新用户进入 Forge Workspace
  → 输入模糊想法
  → 看懂假设条并改一项默认假设
  → 成功生成内容方案
  → 复制正文或逐页卡片文案
  → 判断是否值得保存为配方
  → 刷新后仍能找回结果

范围内：
1. 生成契约与 prompt 最小升级（不改 DB schema）：
   - 让 `cardStructure` / `cardPrompts` 从“提示词”更接近逐页卡片文案；
   - 每页至少包含：页面标题、页面正文/要点、配图方向；
   - `acceptance` / `verification` 更明确地检查“可发布初稿”而不是只检查字段存在。
2. 结果区呈现升级：
   - 主结果按「发布正文」「逐页卡片」「配图方向」「发布前检查」组织；
   - 复制动作从“复制卡片 Prompt”改成更用户向的“复制逐页卡片文案”；
   - session id 等内部调试信息不作为主视觉信息。
3. 保存配方前的价值判断：
   - 保存区提示用户这次会保存哪些可复用判断（受众 / 形式 / 角度 / 结构），而不是只给一个名字输入框；
   - 不做复杂评分，不做自动学习，只让用户能判断“这个值得不值得留”。
4. 验收证据：
   - 至少一条真实登录态生成样例；
   - 记录生成后的正文、逐页卡片、配图方向是否可用；
   - 记录复制动作和保存配方入口是否仍可用；
   - 刷新 `/forge?session=` 后结果仍在。

范围外：
- 不做资产库。
- 不做视觉渲染 / 图片生成 / Canva 式编辑器。
- 不做视觉配方系统。
- 不做自动学习 / 表现数据反推默认假设。
- 不改 `content_package` 表层命名、DB schema、RLS。
- 不做多账号、发布日历、自动发布。

涉及文件（预计）：
- `src/lib/ai/types.ts`
- `src/lib/ai/generate.ts`
- `src/lib/ai/mock-generator.ts`
- `src/components/forge/OutcomePanel.tsx`
- `src/components/forge/RecipePanel.tsx`
- `src/lib/copy/zh-Hans.ts`
- `src/lib/copy/en.ts`
- `docs/acceptance/I-22.md`
- 状态同步：`docs/TICKETS.md`、`docs/PROJECT-STATUS.md`

验收标准：
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- 登录态生成成功，结果至少包含：
  - 一段可直接作为发布正文起点的正文；
  - 5–8 页逐页卡片文案；
  - 每页或整体明确配图方向；
  - 发布前检查项。
- 用户可复制发布正文和逐页卡片文案。
- 用户看得出保存配方会保存哪些可复用判断。
- `/forge?session=<id>` 刷新后结果仍可见。

实测结果：
- 自动验证通过：doctor / lint / typecheck / build / smoke:api。
- Preview Gate 3 通过：真实登录态 `dennisliu1225@gmail.com` 下输入 → 方向确认 → 编辑受众「新手父母」→ 生成成功 session `ee77c9d6-55d5-407e-a990-e7b9164520fc` → 结果含发布正文、5 页逐页卡片文案、每页配图方向、发布前检查 `全部通过`、复制逐页卡片文案、保存配方前价值判断 → 刷新 `/forge?session=` 后结果完整恢复。
- PR #10 已 squash merge 到 `main`（`a9c0f44`）；I-22 Done。
```

### I-23 执行票（已完成）

```text
票号：I-23
状态：Done
类型：实现票（保存配方后的复用证据链）
目标：把 I-22 的“这次配方值不值得留”推进到真实复用路径：
      用户保存结构化内容方案后，能立即进入配方详情，并用新输入重跑；
      重跑后的 `/forge?session=` 仍呈现 I-22 的结构化结果，而不是退回松散 AI 输出。

用户是谁：
- 已在 `/forge` 得到一份可用内容方案的单人创作者。

用户任务：
- 判断这次结果值得保存 → 保存配方 → 查看配方 → 换一个新主题重跑 → 拿到同等结构的内容方案。

本票改变的真实路径：
  `/forge?session=<I-22结果>`
  → 保存配方
  → 保存成功后点击查看配方
  → `/recipes/<id>` 输入新主题重跑
  → `/forge?session=<newSessionId>`
  → 结果仍包含发布正文、逐页卡片文案、配图方向、发布前检查

范围内：
1. `RecipePanel` 保存成功后保留 `POST /api/recipes` 返回的 `recipeId`，显示“查看配方”入口，跳到 `/recipes/<recipeId>`。
2. 成功态文案明确这是进入复用路径，不只是一句“已保存”。
3. 复核配方详情/重跑路径对 I-22 结构的兼容性；如仅需 UI 文案或小修，限定在保存→详情→重跑链路。
4. 补 `docs/acceptance/I-23.md`：记录保存、进入详情、换输入重跑、`/forge?session=` 结构化结果恢复证据。

范围外：
- 不做资产库、视觉渲染、图片生成、视觉配方系统。
- 不做自动学习、表现数据反推默认假设、配方评分。
- 不改 DB schema / RLS / `content_package` 命名。
- 不做配方库重设计、多账号、内容日历、自动发布。

涉及文件（预计）：
- `src/components/forge/RecipePanel.tsx`
- `src/lib/copy/zh-Hans.ts`
- `src/lib/copy/en.ts`
- `docs/acceptance/I-23.md`
- 状态同步：`docs/TICKETS.md`、`docs/PROJECT-STATUS.md`

验收标准：
- 自动验证：doctor / lint / typecheck / build / smoke:api 通过。
- 登录态 `/forge?session=<I-22结果>` 可保存配方，保存成功后出现 `/recipes/<id>` 入口。
- 点击入口进入配方详情，详情页可见来源 session / 核心字段 / 重跑表单。
- 用新输入重跑成功后跳到 `/forge?session=<newSessionId>`。
- 新 session 结果仍至少包含：发布正文、5-8 页逐页卡片文案、配图方向、发布前检查。
- 原配方不被覆盖，`usage_count` 成功重跑后增加。

验证命令：
  npm run doctor
  npm run lint
  npm run typecheck
  npm run build
  FORGENOTE_BASE_URL=http://127.0.0.1:3000 npm run smoke:api

手工验收步骤：
  真实登录态打开一条 I-22 completed session → 保存配方 → 点击查看配方
  → 输入新主题重跑 → 落到新 `/forge?session=` → 检查 I-22 结构化结果与 usage_count。

风险：
- 旧配方 fields 可能只含旧版 `cardPrompts.prompt`；本票验收使用 I-22 后生成并保存的配方，旧数据兼容只做不白屏，不要求回填。

下一步：
- Gate 2 通过；Preview Gate 3 通过：保存后出现“查看配方”入口，进入详情后换输入重跑成功，新 `/forge?session=` 仍保留 I-22 结构，原配方 `usage_count` 0→1。
- PR #12 已 squash merge 到 `main`（`c62065f`）；I-23 Done。
```

### V-01 执行票（下一张唯一任务）

```text
票号：V-01
状态：Ready
类型：验证票（真实用户路径，不写产品功能）
目标：让 1-3 个非构建者用户在 Production 走完 ForgeNote M1 主路径，
      证明当前闭环是否真的可被公平测试：首次生成、保存配方、从配方详情换输入重跑。

用户是谁：
- 非构建者真实用户，最好是有图文卡片 / carousel 发布需求的创作者或准创作者。

用户任务：
- 登录 Production → 输入一个真实模糊想法 → 看懂/必要时修改假设 → 生成内容方案
  → 判断是否保存配方 → 进入配方详情 → 换一个新输入重跑。

范围内：
1. 准备一份极短测试脚本和观察记录模板，落 `docs/acceptance/V-01.md`。
2. 使用 Production（优先）或明确标注的同码 Preview 执行真实路径。
3. 记录每个用户是否独立完成：
   - 登录
   - 首次生成
   - 假设条是否看懂/是否编辑
   - 是否复制或认为内容可用
   - 是否保存配方
   - 是否进入详情并重跑
4. 跑一次 `npm run metrics` 或等价只读指标读出，记录 activation / assumption_edit / recipe_save / recipe_rerun。
5. 输出结论：继续打磨当前闭环、修具体阻塞，或再考虑下一张产品实现票。

范围外：
- 不开发新功能。
- 不改 prompt / schema / RLS / API。
- 不做资产库、视觉渲染、自动学习、内容日历、Stripe、runtime i18n。
- 不把 Owner/Codex 自测冒充真实用户验证。

涉及文件：
- `docs/acceptance/V-01.md`
- `docs/PROJECT-STATUS.md`
- `docs/TICKETS.md`

验收标准：
- 至少 1 个非构建者用户完成或明确卡在 Production 主路径某一步。
- 记录用户身份类型、环境、输入主题、完成/失败步骤、可观察证据、残余风险。
- 指标读出记录到验收文档；无 DB 权限时必须记录具体阻塞，不得伪造。
- 得出下一步唯一判断：修阻塞、继续验证，或进入下一张实现票。

验证命令：
  npm run doctor
  npm run metrics

手工验收步骤：
  真实用户共享屏幕或现场操作；Codex 只观察和记录，不代替用户决定内容好坏。

风险：
- 样本极小，只能证明“是否能用/哪里卡”，不能证明市场需求。
- 若 Production env / OAuth / DB 指标权限再次卡住，本票结论必须写 Blocked 原因，不得改做无关功能。

下一步：
- `docs/acceptance/V-01.md` 测试脚本和记录模板已准备；下一步安排真实用户执行并记录结果。
- 2026-06-28 技术就绪复核（Claude Code）：`doctor` 0/0；Production `/login` 200、`/forge` 307→`/login`、Production `smoke:api` 全通过 → 平台层具备真实用户测试条件。`metrics` 本地 SKIP；直连 Production 库被本机代理 + guardrail 双挡，指标读出须 Owner 走 Supabase SQL Editor（V-01.md 已备等价只读 SQL）。
- 剩余两项均非 Claude Code 可独立完成、也非可修代码阻塞，是 Owner 决策点：
  (1) 约到至少 1 名真实非构建者用户跑 Production 登录→生成→保存→详情重跑并由观察者记录；
  (2) Owner 在 SQL Editor 读出 activation / assumption_edit / recipe_save / recipe_rerun 指标。
- 在拿到真实用户证据前，V-01 不得标 Done，结论暂不出 Pass / Conditional Pass / Fail。
- 2026-06-28 V-01-FIX-01 已合入并上线：Owner dry run 发现的 `/forge` 入口交互阻塞由 Codex 定义为 V-01 前置修复，PR #15 已 squash merge 到 `main`（`cf9d631`），Vercel 主线自动部署 Production。FIX-01 后 Production 就绪复核（Claude Code）：`doctor` 0/0、Production `smoke:api` 全通过、`/login` 200、`/forge`/`/recipes`/`/recipes/<uuid>` 均 307→`/login`。`docs/acceptance/V-01.md` 已补「Owner 真实用户执行清单」。
- 当前结论：**继续收集用户**。唯一缺口=至少 1 名真实非构建者用户在 Production 跑完登录→生成→保存→详情重跑并记录证据（+ Owner SQL Editor 指标读出）。无可由 Claude Code 修的代码阻塞。
```

<details><summary>I-19 执行票（已完成，存档）</summary>

```text
票号：I-19
状态：Done（Gate 2 Pass / Production 配置 + OAuth 实测 / Gate 4 指标读出 / Gate 3 内容路径 Conditional Pass）
目标：把 M1 推到真实用户可登录使用的 Production，并按 OPERATING-MODEL Gate 3/4 拿到第一份真实使用证据；
      产出一个只读指标脚本，能从现有库表直接算出 M1 验证闭环的 6 个指标（无需第三方 SDK）。

范围内（代码/文档侧已交付，不触碰 Owner secret）：
1. 新增 scripts/metrics.mjs（只读）：连 DATABASE_URL（与 db:test-rls 同款连接方式），聚合输出
   - activation_rate：有 status='completed' session 的用户 / 有任意 session 的用户
   - assumption_edit_rate：session.assumptions 中存在 state='edited' 的占比（按 completed session）
   - recipe_save_rate：完成生成后产生 recipe 的占比
   - recipe_rerun_rate：source_recipe_id 非空的 session 占比 / 或 recipes.usage_count>0 占比
   - return_session_rate：同一 user 跨 >1 个自然日有 session 的占比
   - performance_fill_rate：completed session 中 performance 列非空的占比
   仅输出聚合计数/比率，**不 select 任何输入全文 / outcome / 复盘正文**；不打印 secret；无 DATABASE_URL → 明确 SKIP exit 0（对齐 db:test-rls / eval 的 safe-mode 语义）。
2. package.json 增 "metrics" script；scripts/doctor.mjs 增对 scripts/metrics.mjs 存在性检查。
3. docs/DEPLOYMENT.md 补「Production 上线段」：env 分区落实、Supabase Production redirect URL + Google OAuth（含 Client Secret，呼应 Preview 期 blocker 根因）、migration 0001+0002 应用确认、Deployment Protection 对真实用户的开放/ bypass 决策、上线前自动验证清单、回滚。
4. 新增 docs/acceptance/I-19.md：按 Gate 3 模板预置（环境=Production、用户身份、真实用户路径、预期、实测、证据、残余风险）。
5. docs/RUNBOOK.md 增 metrics 运行方式与判定语义（SKIP/读出）。

范围外（守边界）：
- 不引入 PostHog / Sentry SDK、不改 observability.ts 行为、不做 runtime i18n / locale 切换。
- 不加任何产品功能、不改 schema / migration / RLS / prompt / API / 既有路由。
- metrics 脚本不写库、不删数据、不绕过 RLS（只读聚合；用 service role 或直连只读账号由 DEPLOYMENT 说明，脚本本身不内嵌任何 key）。

涉及文件：
- 新增：scripts/metrics.mjs、docs/acceptance/I-19.md
- 修改：package.json（+metrics）、scripts/doctor.mjs、docs/DEPLOYMENT.md、docs/RUNBOOK.md
- 状态同步：docs/PROJECT-STATUS.md、docs/TICKETS.md

验收标准（Gate 2 实现正确性）：
- metrics 脚本：无 DATABASE_URL → SKIP exit 0、不报错、不打印 secret；有库时输出 6 个指标聚合，且 SQL 只取计数/布尔，不取输入全文。
- doctor / lint / typecheck / build 全通过；不新增运行时路由、不新增生产依赖（脚本可用现有 pg 依赖链，若需新依赖须先回 Codex 评估）。

验证命令：
  npm run doctor
  npm run lint && npm run typecheck && npm run build
  DATABASE_URL='postgres://...' npm run metrics   # 有库时
  npm run metrics                                  # 无库时期望 SKIP exit 0

手工验收步骤（Gate 3 真实用户路径，Production）：
  真实用户登录 → /forge 输入模糊想法 → 看懂/改一条假设 → 成功生成内容包 → 保存配方
  → 刷新后仍能找回结果 → 配方详情换输入重跑 → 记录发布表现 → 回看时表现仍在
  证据写入 docs/acceptance/I-19.md；并贴 npm run metrics 对 Production DB 的首批读出。

风险：
- Owner 侧 Production env / Supabase OAuth 未就绪会阻塞 Gate 3（与 Preview 期 Client Secret 同类）；Claude Code 先交付可验证的脚本/文档部分，Gate 3 待 Owner 配置后补证据。
- 指标定义在小样本下噪声大；I-19 只要求「能读出」，不要求达标阈值。

下一步：
- Owner 完成 Production 配置后，Codex 执行 Gate 3 真实用户路径与 Gate 4 指标读出。
- Claude Code 仅补 docs/acceptance/I-19.md 与状态文档证据；不得补新功能。
- I-19 Done 后再由 Codex/Owner 决定是否进入「观测 SDK 接入」或「runtime i18n」（仍需指标证据支撑）。
```

</details>

> 注（I-13 决策）：eval 为**手动 / 本地门禁**，**不进 PR CI**（真实模型调用 + 需登录态，进 CI 会因缺 key/登录态无意义失败）；CI 仍只跑 doctor / lint / typecheck / build。`npm run eval:forge` 无 cookie 时 SKIP exit 0。
> 注（I-14 决策）：观测为**零依赖 no-op scaffold**，未配 env 不影响 build / 运行；真实 SDK 接入留作后续票（`observability.ts` TODO）。
> 注（I-17 决策）：i18n 仅 **scaffold**（en/zh 资源 + typed helper + 代表性接线），默认 zh-Hans 行为不变；运行时切换 / 偏好持久化 / output_locale 联动留作后续票。

## M1 剩余执行队列

> M1 计划票 I-08~I-23 与 DSN-01 均已 Done。下一张唯一任务是 V-01：小范围真实用户验证。**产品方向已修订**（`docs/ForgeNote_修订版方向.md`）：不堆功能、不做视觉渲染；现在三支柱已串成路径，必须用真实用户证据判断下一步。观测 SDK / runtime i18n / 学习闭环按修订版方向延后。

## 每票模板

```text
票号：
状态：
目标：
范围内：
范围外：
涉及文件：
验收标准：
验证命令：
手工验收步骤：
风险：
下一步：
```
