# DSN-03 · Implementation Slices（实现切片建议）

> **只提议、不实现**（Claude Design 不写产品代码）。Codex 审定边界、记 DECISIONS、再拆给 Claude Code。
> 每个切片必须：① ticket id 提议 ② 覆盖的 path/state ③ 可能触及文件 ④ 明确非目标 ⑤ Gate 3 验收路径。
> 粒度规则：**大于「改一个按钮」，小于「整页重设计」**。每片可追溯到 `ux-map`/`state-map`/`design-system-baseline`。

---

## Slice 1 — 假设条：账号级判断（减字版交互）

- **ticket**: DSN-03-S1 — Assumption chips as account-level judgements
- **覆盖**: Path 2；S-10 方向待确认、S-11 假设已编辑；debt B1/N1
- **baseline**: §6 面板（减字 chip）、§1 置信度用形态不堆色、§8 动效不进密集区
- **范围内**: 假设摘要 + 置信度（确定/推断/拿不准 用实/半/虚形态）+ 「依据」点开（「我假设受众是 X，因为 Y」）+ 只对「拿不准」默认展开纠偏；编辑→计数 `1/3`、该条转「确定」、否决/恢复
- **可能触及**: `components/forge/DirectionPanel.tsx`、`AssumptionsPanel.tsx`、`lib/copy/{zh-Hans,en}.ts`（`direction`/`assumptions`）
- **非目标**: 不改 `/api/forge`、prompt 内容、DB；不做学习闭环；不改假设的数据结构（沿用 rationale/confidence）
- **Gate 3**: 登录态输入想法 → 看到 3 条带依据/置信度的假设 → 点开一条依据 → 改一条 → 计数 `1/3` → 生成；移动端折叠摘要可用

## Slice 2 — 结果区可发级层级 + 保存价值时刻

- **ticket**: DSN-03-S2 — Publish-ready result hierarchy & save-value moment
- **覆盖**: Path 3；S-13 已生成、S-16 保存待定、S-17 已保存；debt B2/N2
- **baseline**: §6 内容方案块用「可操作对象」卡片、§4 一屏一主操作、§7 成功态
- **范围内**: 结果按 发布正文 / 逐页卡片文案 / 配图方向 / 发布前检查 组织；复制（正文 / 逐页文案）；保存区先列「会复用哪些判断」再命名；保存成功 → 「查看配方」入口
- **可能触及**: `components/forge/OutcomePanel.tsx`、`RecipePanel.tsx`、`lib/copy`（`outcome`/`recipePanel`）
- **非目标**: 不改 `content_package` 表/命名、不改 prompt 契约（呈现层为主；如需 prompt 加强另立 Codex 票）、不做视觉渲染
- **Gate 3**: 生成成功 → 四段结构可见 → 复制逐页文案可用 → 保存区看懂复用判断 → 保存 → 出现查看配方 → `/forge?session=` 刷新仍在

## Slice 3 — 设计语言基线落地（样式层统一，防 patch）

- **ticket**: DSN-03-S3 — Design baseline as implementation constraints
- **覆盖**: 全局（/login + /forge + /recipes + /profile）；debt N3
- **baseline**: 全文，尤其 §1 颜色角色、§4 按钮层级、§5 输入、§8 动效边界、§10 反 patch 守则
- **范围内**: 把颜色角色/间距/按钮层级/输入/焦点环/状态样式收敛为一套可复用 token 与组件约定；移除一锅米黄、隐藏主操作、装饰卡堆；角色动效限定 login/空态
- **可能触及**: `app/globals.css`（token）、`components/ui/*`（button/input）、各页 className 收敛；**不改逻辑**
- **非目标**: 不改任何业务逻辑/API/RLS/路由；不引新依赖/新字体；不动 prompt
- **Gate 3**: 四个主页面视觉一致（同按钮层级/输入/焦点环），无一锅暖色、无隐藏主操作、无横向溢出；Preview 桌面+移动检查

## Slice 4 — 登录认证缺口实现（承接 DSN-02）

- **ticket**: DSN-03-S4 —（= 重排后的 DSN-02 实现）Remember-30d + password reset + remove Magic Link
- **覆盖**: Path 1/6；S-02–S-07；debt N4
- **baseline**: §4/§5（输入/按钮）、§8（登录动效允许）；DSN-02 brief + state-map
- **范围内**: 移除 Magic Link；记住 30 天（会话时长）；忘记密码全流程 + 重置路由；老用户迁移先于下线可用
- **可能触及**: `components/auth/LoginForm.tsx`、`app/login/page.tsx`、新增重置页/路由、`auth/callback`、`lib/copy.login`、Supabase 控制台（Owner）
- **非目标**: 不加第三方登录/2FA；不改业务表/RLS/prompt；不做营销页
- **Gate 3**: Preview 真实登录态走通 密码登录 / 注册验证 / 忘记密码重置 / 记住30天；失败不泄露账号是否存在；**先锁 Codex 技术边界（session 时长 / redirect / 迁移顺序）**

## Slice 5 — 渐进显形最小骨架

- **ticket**: DSN-03-S5 — Progressive workbench reveal (minimal)
- **覆盖**: Path 2/5；IA 引导态↔工作台态；S-08、S-21/22；debt B3/N5
- **baseline**: IA §2 显形触发、§9 移动单列、§8 动效（仅空态）
- **范围内**: 引导态首屏（价值问句 + 大输入 + 3 示例 + 「我会替你补」标签）；按「存了第一条账号记忆→左栏 / 有第一个 session→底部 / 存了第一个配方→右栏」**逐块显形**，连续不跳变；表现回填寄生 session 底部
- **可能触及**: `components/forge/ForgeWorkbench.tsx`、`IdeaInput.tsx`、（底部）`PerformancePanel`/OutcomePanel 入口、`lib/copy.idea/shell`
- **非目标**: 不建 `/history` 页；不做资产库真实列表；不做自动学习；不改生成契约
- **Gate 3**: 新账号首屏只见引导态（无空面板）；产生 session 后底部连续性出现；保存配方后右栏配方区出现；刷新连续

---

## 排序建议（交 Owner/Codex 拍板）

```text
先 S4（认证缺口，保 Path1 转化，已设计）
并行 S1 + S2（解锁 V-01 前提：假设条 + 可发级产物）
然后 S3（基线落地，防 patch 螺旋）
再 S5（渐进显形，连续生长）
S3 可与 S1/S2 部分并行（token 先行，组件随各 slice 收敛）
```

## 可追溯性矩阵（slice → path/state/baseline）

| slice | paths | states | baseline 锚点 |
|---|---|---|---|
| S1 | P2 | S-10,S-11 | §1,§6,§8 |
| S2 | P3 | S-13,S-16,S-17 | §4,§6,§7 |
| S3 | 全局 | （横切所有）| §1,§4,§5,§8,§10 |
| S4 | P1,P6 | S-02–S-07 | §4,§5,§8 |
| S5 | P2,P5 | S-08,S-21,S-22 | IA§2,§8,§9 |

> 约束：任何新票若不能填进本矩阵（指明 path + state + baseline），Codex 退回，不允许直接 patch。
