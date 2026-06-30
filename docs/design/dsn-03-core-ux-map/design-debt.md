# DSN-03 · Design Debt Triage（设计债分诊）

> 四桶：**Block V-01 / Next implementation / Later polish / Do not do**。
> 每条：affected path · why it matters · evidence source · proposed owner。
> 证据来源缩写：方向＝`ForgeNote_修订版方向.md`；OM＝`OPERATING-MODEL.md`；V01＝`acceptance/V-01.md`/指标；D01＝`dsn-01.../handoff.md`+`codex-review.md`；TIX＝`TICKETS.md`；本图＝DSN-03。

## 桶 1 — Block V-01（拦住真实用户验证，先清）

| # | 项 | path | why | evidence | owner |
|---|---|---|---|---|---|
| B1 | 假设条仍像「填表默认值」，未呈现为账号级判断 + 依据 | P2 / S-10,S-11 | `assumption_edit≈17%`，差异化没被感知；这是北极星「第一次赢」的核心 | 方向 §2/§4；V01 | Claude Design → Codex 拆票 → Claude Code |
| B2 | 内容方案是「文字+prompt」，非可发级结构化初稿 | P3 / S-13 | `recipe_save≈8%`，产物「不值得留」；支柱 2 未达 | 方向 §2/§4；TIX(I-22 已部分) | Codex（prompt/契约）+ Claude Code；Design 定结果层级 |
| B3 | 引导态↔工作台「渐进显形」未成体系，仍偏单页堆叠 | P2 / IA | 新人满屏空区劝退；老人需要四区。缺统一显形规则→继续局部 patch | 方向 §5.5；本图 IA | Claude Design（规则）→ Codex |
| B4 | 用户界面仍可能外泄内部 taxonomy / dev 口吻 | P1–P5 | 「内容包/卡片 Prompt/M1」等降低可信、增认知负担 | D01 codex-review；方向 §8 | Claude Design（文案）+ Claude Code |

> B1/B2 是 V-01「产品已可被公平测试」的前提（方向 §8：V-01 挂起，先把支柱 1/2 做到有感觉）。**DSN-03 不替代 V-01**，但先清 B1–B4 才谈得上拉真实用户。

## 桶 2 — Next implementation（DSN-03 后下一批，见 slices）

| # | 项 | path | why | evidence | owner |
|---|---|---|---|---|---|
| N1 | 假设条减字版交互（摘要/置信度/依据点开/只对拿不准展开） | P2 / S-10,11 | 把 B1 落成可实现交互 | 方向 §4 支柱1；本图 state-map | Claude Design → Claude Code |
| N2 | 结果区可发级层级（正文/逐页文案/配图方向/发布前检查）+ 保存价值时刻 | P3 / S-13,16 | 落 B2 的呈现层 | 本图 ux/state；TIX I-22/23 | Claude Design + Claude Code |
| N3 | 设计语言基线落地为实现约束（颜色角色/按钮层级/动效边界） | 全局 | 阻止 patch 螺旋；统一 login+forge | 本图 baseline；问题陈述 | Claude Code（按 baseline 重构样式层） |
| N4 | DSN-02 登录认证缺口（记住30天/忘记密码/去 Magic Link）实现 | P1/P6 / S-03–07 | 已设计未实现；保 Path 1 转化 | DSN-02；本图 state-map | Codex 定边界 → Claude Code |
| N5 | 渐进显形最小骨架（左/底/右随「第一条记忆/session/配方」逐块出现） | P2,P5 / IA | 落 B3，连续生长不跳变 | 方向 §5.5 | Claude Design（规则）→ Claude Code |

## 桶 3 — Later polish（有价值但不挡 M1）

| # | 项 | path | why | evidence | owner |
|---|---|---|---|---|---|
| L1 | 工作台态完整四区视觉细化 | P2 | 终态，逐块长出即可，不一次盖完 | 方向 §5.5 | Claude Design |
| L2 | 配方库/详情信息密度与轻标签化（Linear 风） | P4 | 提升可扫，但非阻塞 | 本图 baseline §6 | Claude Design + Code |
| L3 | 吉祥物动效扩展（更多空态/转场表情） | P1/空态 | 锦上添花；受动效边界约束 | 本图 baseline §8 | Claude Design |
| L4 | 移动端工作台态精修 | P2 | M1 引导态优先，工作台态移动延后 | 本图 IA | Claude Design |

## 桶 4 — Do not do（M1 明确不做，写死防回潮）

| # | 项 | why | evidence |
|---|---|---|---|
| X1 | 资产库 / 内容视觉渲染 / 出图卡片 | Canva 赛道，方向明确撤回「路 A」 | 方向 §1/§8；brief 非目标 |
| X2 | 表现→学习闭环（识别模式/自动更新假设） | 真护城河但属 M1 之后；M1 只存表现 | 方向 §4 延后 |
| X3 | 内容日历 / 自动发布 / 多账号 | 超出 M1 单人单路径 | 方向 §4 |
| X4 | 自动学习、观测 SDK、runtime i18n、Stripe | 延后；无指标证据前不堆 | 方向 §4；OM 指标闭环 |
| X5 | 改数据库 / API / RLS / prompt 契约（结构性） | DSN-03 非目标；prompt 内容调整另走 Codex 票 | brief 非目标 |
| X6 | 营销 landing page / 把 /login 做成营销页 | 偏离工具型产品 | brief 非目标；DSN-02 |
| X7 | 「改写已有笔记」等第二入口 | M1 只认 模糊想法→内容 | 方向 §5.5 单一主路径 |
| X8 | 未跟踪 `原型图/` 当交付依据 | 除非 Owner 明确要求 | brief 硬边界 |

---

## 分诊总结

- **先做**：B1、B2（解锁 V-01 前提）→ N1、N2、N4（落地）→ N3、N5（防 patch + 连续生长）。
- **别做**：桶 4 全部，尤其 X1（视觉渲染）与 X2（学习闭环）——这两个最容易被误当「下一步」。
- **不替代**：DSN-03 + 上述实现都**不替代** V-01 真实非构建者用户在 Production 跑一遍（OM Gate 3 / 方向 §8）。
