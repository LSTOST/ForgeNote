# DSN-03 · Handoff — Core UX Map + Design Baseline

> 角色：Claude Design（UX/UI、交互原型、信息层级）。**不写产品代码，不交 Claude Code 直接实现**——交付供 Codex 审定边界后拆票。
> 目的：把 ForgeNote 从「靠局部 fix 票推进」拉回「项目级体验母图 + 设计基线」，让**新实现票必须引用 path + state + baseline 规则**，否则不动手。

## 交付物索引（落 `docs/design/dsn-03-core-ux-map/`）

| 文件 | 内容 |
|---|---|
| `ux-map.md` | 6 条 M1 核心路径母图（≥5）：首次进入 / 第一次生成 / 方案→配方 / 配方复用 / 回访与表现 / 认证恢复；每条标 path×支柱×指标 |
| `ia.md` | 站点地图 + `/login` `/forge`(引导态/工作台态/渐进显形) `/recipes` `/recipes/[id]` `/profile` 的桌面+移动 IA |
| `state-map.md` | 22 个状态（S-01…S-22），每个含 visible message / primary / secondary / recovery / data continuity |
| `design-system-baseline.md` | 决策层级 + 颜色角色/字体/间距/按钮/输入/面板/状态/动效/移动 + 反 patch 守则 |
| `design-debt.md` | 四桶分诊（Block V-01 / Next / Later / Do not do），每条 path/why/evidence/owner |
| `implementation-slices.md` | 5 个可追溯切片（DSN-03-S1…S5）+ 排序 + slice→path/state/baseline 矩阵 |
| `handoff.md` | 本文 |
| `codex-review.md` | **由 Codex 产出**（Pass / Conditional Pass / Fail），不在本次交付内 |

> 相邻：登录认证视觉/交互详规见 `docs/design/dsn-02-login-auth/`（含吉祥物「内容创作演变小队」与动效规格）；DSN-03 把它纳入母图 Path 1/6 与状态机，实现归 Slice 4。

## 一页结论

- **问题**：`/login` 多轮 FIX、`/forge` 反复改形态，根因不是工程，是**缺项目级 UX/IA/设计基线**。
- **对策**：先固定**路径（6）× 状态（22）× 信息架构（桌面+移动）× 设计基线（层级+规则）**，再让实现票挂靠其上。
- **北极星不变**：第一次就让创作者觉得「AI 已经懂我的账号、我几乎不用解释」；三支柱＝假设条 / 可发级内容包 / 最小可见复用。
- **形态原则**：一个会长大的工作台，引导态（M1 主战场）↔ 工作台态（终态），**渐进显形、连续生长，不硬切两套页**。

## 如何用它阻止下一次 patch 螺旋

1. 新需求先归到 `ux-map` 某条 path 与 `state-map` 某个 state；说不出就先不做。
2. 任何视觉改动先对照 `design-system-baseline` 的决策层级与反 patch 守则；违反先回设计。
3. 实现只走 `implementation-slices` 的 5 片（或新片，但必须填进可追溯矩阵）。
4. Codex 审 `codex-review.md`：Pass / Conditional Pass 后才拆实现票。

## 验收自检（对照 brief Acceptance）

- ✅ ≥5 条 M1 路径端到端（本图 6 条）。
- ✅ 桌面 + 移动 IA 均给出（`ia.md`）。
- ✅ 核心状态含 visible copy / actions / recovery / data continuity（`state-map.md` 22 态）。
- ✅ 设计语言具体到能阻止 login 式 patch（`design-system-baseline.md` 决策层级 + 反 patch 守则 + 动效边界）。
- ✅ 实现切片可追溯到 path/state/baseline（`implementation-slices.md` 矩阵）。
- ⏳ 待 Codex `codex-review.md` 判 Pass / Conditional Pass。

## 边界与免责（硬约束，已遵守）

- 不做：资产库 / 内容视觉渲染 / 内容日历 / 自动学习 / Stripe / runtime i18n。
- 不改：数据库 / API / RLS / prompt 契约（结构性）。
- **不替代 V-01**：DSN-03 不是真实用户验证替代品；Production 仍需 ≥1 名真实非构建者用户跑通主路径（OM Gate 3 / 方向 §8）。先清 design-debt B1/B2 再拉用户。
- 未使用未跟踪 `原型图/`。

## 给 Owner / Codex 的待决点

1. 顶部品牌符号取舍（沿 DSN-02：吉祥物 vs 38px 闪电标）——不新设计 logo。
2. Slice 排序确认：建议 S4 先行（认证缺口）→ S1+S2 并行（解锁 V-01 前提）→ S3 → S5。
3. 认证技术边界（记住30天会话 / 重置 redirect / Magic Link 下线与迁移顺序）由 Codex 锁定并记 DECISIONS。
4. 落库：把本目录 7 文件移入 `ForgeNote/docs/design/dsn-03-core-ux-map/`（当前在设计项目根，便于预览）。
