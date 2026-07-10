你将对 ForgeNote M2-09（四区工作台）执行 Codex review。你的角色是 Tech Lead + QA Agent。

## 前置阅读

在执行 review 前，先依次读取以下文件：

1. docs/OPERATING-MODEL.md
   — 重点理解 Gate 2（Implementation Correctness）和 Gate 3（User Path Acceptance）
   — 理解 Codex 在 QA Agent 模式下的验收要求（真实用户路径、acceptance/*.md 证据）

2. docs/roadmap/roadmap.json
   — 确认 M2-09 的 done criteria 和当前状态

3. docs/design/redefine-2026-07/CODEX-CODE-REVIEW-M2.md
   — 这是以 commit a92c245 为基线的上一次 review，包含 4 个 P1 blocker 和 4 个 P2 finding
   — 你必须在本次 review 中检查这些 blocker 是否已修复

4. docs/PRD-M2.md
   — 理解 M2 产品架构和功能范围

5. docs/UIUX-M2.md
   — 理解四区工作台的设计原则和交互规则

6. docs/DATA-SCHEMA-M2.md
   — 确认 M2 数据模型定义

7. docs/API-CONTRACT-M2.md
   — 确认 M2 API 契约

## Review 范围

M2-09 包含 4 个 Step，共 17 个文件（7 新增 + 10 修改）：

Step 1（引擎主内容层）:
  - src/lib/content/main-content.ts（new）
  - src/lib/content/outline.ts（new）
  - src/app/api/content/main/route.ts（new）
  - scripts/check-main-content.mts（new）
  - src/lib/render/slot-order.ts（new）

Step 2（中区改可读内容）:
  - src/components/workspace/Workspace.tsx（modified）

Step 3（右栏轻控制）:
  - src/components/workspace/Workspace.tsx（modified）

Step 4（从主内容派生）:
  - src/lib/content/derive.ts（new）
  - src/app/api/content/derive/route.ts（new）
  - scripts/check-derive.mts（new）
  - src/components/workspace/Workspace.tsx（modified）

其他影响文件:
  - src/app/workspace/page.tsx（modified）
  - src/lib/render/renderers/shared.ts（modified）
  - src/app/globals.css（modified）
  - src/app/first-run/page.tsx（modified）
  - src/components/account/AccountIntake.tsx（modified）
  - docs/roadmap/roadmap.json（modified）
  - package.json（modified）

## 六维检查清单

### R1: 上次 P1 blocker 是否已修复

逐条验证 CODEX-CODE-REVIEW-M2.md 中的 4 个 P1 blocker：
1. DB parent/child owner 一致性 — child 表是否缺 FK 约束确保 child.user_id = parent.user_id
2. Account memory evidenceRefs 持久化 — evidenceRefs 是否被正确写库、stripContentFields 是否处理嵌套长文本
3. Structure slot/modality + pending decision legality — slots 是否检查 modalityStack、pendingDecisions 是否允许自由文本、resolvedValue 是否校验 options
4. Stuck tasks on generation failure — POST /api/structure/generate 在模型失败时是否清理或标记 task，不会留下永久 structuring 态记录

如果这 4 个 blocker 尚未修复，本次 review 直接标记为 Blocked，并引用上一次 review 的阻塞 ID。

### R2: 新 API 路径安全

检查 POST /api/content/main 和 POST /api/content/derive：
- 鉴权是否在业务逻辑之前（auth before biz logic）
- RLS 是否按 user_id 隔离
- error code 是否与 API-CONTRACT-M2.md 一致（MODEL_NOT_CONFIGURED、GENERATION_FAILED 等）
- SQL injection 防护、input validation、异常处理
- structureId 是否用于 RLS ownership check（derive 路径）

### R3: 新管线数据模型

对照 DATA-SCHEMA-M2.md 检查：
- MainContent、MainContentSection、ContentOutline 类型是否与文档一致
- DerivedArtifact、DraftSection 类型是否与文档一致
- StructureDocument 的修改是否兼容现有消费者（stability.ts、renderers、Workspace.tsx）
- 新增字段是否有合理的 max length / validation

### R4: 工作台 UI 四态覆盖

检查 Workspace.tsx 中每个 zone 的状态覆盖：

左栏：空/加载/有数据/错误 — 必须覆盖
中区 Stage 0：冷启动/输入中/生成中/失败 — 必须覆盖
中区 Stage A：提纲展示/生成主内容 loading/失败 — 必须覆盖
中区 Stage B：编辑态/已编辑/保存 — 必须覆盖
右栏：结构加载/可编辑/待裁决/已裁决 — 必须覆盖
底栏：禁用/可派生/派生中/派生完成 — 必须覆盖

检查双向 hover 高亮（slot <-> 段落联动）是否正确实现。
检查 AI 助手胶囊是否保持占位态（不接后端、不报错）。

### R5: 主链路无回归

下列路径必须能完整走通（或至少不抛出未捕获异常）：
1. /login -> 邮箱密码登录 -> 跳转 /workspace
2. /workspace -> 输入想法 -> 点击 Generate Structure -> 中区显示提纲
3. 中区提纲 -> 点击 Generate Main Content -> 可读内容展示
4. 中区 -> 编辑 heading + text
5. 右栏 -> 点击 slot -> 选择 strategy -> 结构更新
6. 右栏 -> 点击 pending decision -> 选择 option -> 状态更新
7. 底栏 -> 选择平台 -> 点击 Derive -> 派生结果展示
8. /first-run -> account intake -> 跳转 /workspace

如有 mock/data 依赖导致路径无法完整测试，注明具体阻塞点。

### R6: 验证脚本
- npm run lint — 必须 0 error
- npm run typecheck — 必须 0 error
- npm run build — 必须 0 error
- npm run doctor — 必须 0 failed
- npm run check:main-content — 全绿
- npm run check:derive — 全绿
- npm run check:renderers — 全绿（renderer 是 shared foundation）

## 产出要求

### 产出 1: Review 报告

直接在对话中输出结构化报告，格式如下：

标题：M2-09 Codex Review 报告
日期：YYYY-MM-DD
基线：HEAD（当前最新 commit）

R1: 上次 P1 blocker 修复状态 — 每个 blocker: 已修复/部分修复/未修 + 行号引用

R2: 新 API 路径安全 — 逐条结论: 通过/建议修改/阻塞

R3: 新管线数据模型 — 逐条结论

R4: 工作台 UI 四态覆盖 — 表格形式: zone / 状态 / 覆盖 / 行号

R5: 主链路回归 — 每条路径: 可走通/依赖阻塞/断裂

R6: 验证脚本 — 每条命令: 通过/失败

总体结论: Pass / Conditional Pass / Fail-Blocked
如果 Conditional Pass，列出有条件通过的残余风险项。
如果 Fail-Blocked，列出所有阻塞项及修复建议。

### 产出 2: Acceptance 证据文件

创建 docs/acceptance/M2-09-workspace.md，格式：

标题：M2-09 四区工作台 — 验收证据
结论: Pass / Conditional Pass / Fail
日期: YYYY-MM-DD
验收人: Codex (Tech Lead + QA Agent)
范围: M2-09 Step 1-4 代码审查
未触及: Owner 真实路径验收（需模型 env + 前置阅读）

实现验收部分 — 逐条列举 key implementation facts

自动验证部分 — 每条命令一行：[x] npm run lint -> 通过（等）

Owner 浏览器验收（未执行，待 Owner 路径）— 留空说明待 Owner 以真实账号走通完整路径

残余风险 — 列明未覆盖路径、依赖阻塞、待 Owner 确认项

## 执行顺序

1. 先读取所有前置文档和源码文件
2. 运行验证命令
3. 逐维检查 R1 到 R6
4. 产出 review 报告
5. 创建 acceptance 文件