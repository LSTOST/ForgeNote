# 交接文档 · Claude Code → Codex（2026-07-13）

> 目的：Claude Code 额度将尽，把当前开发状态完整交接给 Codex 继续。
> 事实源仍是 `docs/roadmap/roadmap.json`（`npm run progress`）；本文件是接手前的一次性上下文压缩。

## 0. 一句话现状

G0S-08~12（工作台持久化 + 小红书三件套 + 单工作台外壳 UI 一致性重整）代码完成、**已提交 `1b7ddde` 并 push origin main，Vercel 自动部署中**。等 Owner 在生产站 forge-note-gold.vercel.app 走查新界面后，G0S-08~12 才可标 code_done/accepted。Gate 0 的真实功能票 G0S-02~07 仍 todo。

## 1. 刚 ship 的（commit 1b7ddde，62 文件）

- **G0S-08 持久化**：`main_content_documents`（迁移 0005，已在生产库执行）+ `GET/PUT /api/content/tasks[/:id][/draft]` + 最近内容重开 + `render_artifacts` 归档 + 复制去 role key。
- **G0S-09 小红书成品**：派生输出 `title`+`body` 两单元，卡片提示词解除 visual 模态门禁，选小红书一键双出（`src/lib/content/derive.ts`）。
- **G0S-10 动线重排**：消除 7 处重复 + 3 处死物，主操作跟随内容流，底栏取消。
- **G0S-11 修复**：首页最近内容真实列表、顶栏去重、移除输出语言（仅中文）、账号菜单。
- **G0S-12 单外壳**：`src/app/(product)/layout.tsx` + `src/components/layout/AppShell.tsx` 持久外壳；radar/account/gate0 收为壳内视图（保留路由 URL 与 `?idea=`/`?taskId=` 深链）；first-run 重定向 `/workspace`（空状态 = 原开工输入）；`/profile` 隐藏（路由保留、无导航入口）；旧 TopNav 与 Ember 删除；字体衬线标题+无衬线正文；圆角/阴影 token 收敛；`docs/design/g0s12-ui-consolidation/AUDIT.md` 136 项分歧清零。

## 2. 立刻要做的（接手第一步）

1. **等 Owner 生产走查**：验四点——工作台无重复项、四视图切换左栏不重载、收起后有「展开」、新写一条同视图复位。通过 → 把 G0S-08~12 标 `code_done`（有 Codex review）；Owner 真实路径用满则 `accepted` + 挂 `docs/acceptance/*.md`。
2. **未提交项**：`docs/roadmap/roadmap.json`（部署 note）待提交；`.cursor/` **不要提交**（Cursor 本地配置，非产品）。

## 3. Gate 0 剩余功能票（按序）

> ⚠️ **硬约束（Owner 拍板的开发流程，不许跳）**：G0S-12 只对「已存在的产品」走完了 UX 设计流程（收敛成一致外壳 + 设计系统）。下列**新功能**里凡有新 UX 的，**每张票必须先走轻量设计再编码**：① 旅程触点（这一步在 UX-BASE 主循环的哪一步）→ ② 在既有单外壳里画线框（放进 `docs/design/` 或 WIREFRAMES 增补节）→ ③ Owner 过目 → ④ 才实装。**禁止直接跳到编码**，否则重犯「一边做一边改」。设计系统与规范已定（DESIGN v2 / UIUX-M2 / UX-WRITING §13），新功能在既有 token 与组件内做，不新造视觉。

| 票 | 内容 | 需先做 UX 设计？ | 关键点 |
|---|---|---|---|
| G0S-02 | 账号大脑喂入「独居生活指南」品牌资料 | 否（用既有 /account） | 把品牌定位/栏目/叙事/禁忌喂进 `account_memory_items`，验证生成结果受约束 |
| G0S-03 | 手动选题入口 | 否（已基本可用） | 中区 textarea + `?idea=` 已通，补顺手性，用真实 canvas 选题验 30 秒开工 |
| G0S-04 | 资产挂载最小版 | **是** | 手册/清单/网盘链接挂哪、成品里怎么展示、导出怎么带出——先线框 |
| G0S-05 | 归档 + 表现回填接真实数据 | **是** | 回填入口从 /gate0 接到内容流的哪个点、发布→回填的衔接——先线框 |
| G0S-06 | 公众号长文 renderer（切片 2） | **是** | 公众号在产出区怎么和小红书并列、长文预览形态——先线框 + golden test |
| G0S-07 | 手册配套物料模板化（切片 3） | **是** | 商品详情页 + 长文介绍的生产入口——先线框 |

缺口全景见 `docs/design/g0s12-ui-consolidation/UX-BASE.md` §4（含重新生成覆盖确认、一键双出部分失败恢复等）与 `docs/design/gate0-slice-gap.md`。

## 4. Codex 必须先读（GEB 协议）

1. `AGENTS.md`（产品边界——**不加 billing/团队/自动发布/移动端/多模型**）
2. `docs/DECISIONS.md` **D-12/D-13/D-14**（当前方向：Owner 自用「独居生产台」，单语中文、小红书优先；CCOS 五份文档冻结为北极星愿景，非开发依据）
3. `docs/geb/CONTEXT.md` + `docs/geb/MAP.md`（代码↔语义文档映射）
4. `docs/GATE0-SLICE-PLAN.md`（切片计划）
5. 设计/文案：`docs/DESIGN.md` v2（§9 反模式硬约束）+ `docs/UX-WRITING.md` §13（中文排版）+ `docs/UIUX-M2.md`（单外壳规格）

## 5. 架构速查（改代码前必知）

- **单工作台外壳**：`(product)/layout.tsx`（服务端鉴权 + 载最近内容）→ `AppShell`（左栏，`usePathname` 切 active，路由切换不重载）→ 子路由页渲染进主区。
- **Workspace 组件**有 `embedded` prop：`(product)/workspace/page.tsx` 传 `embedded`，此时 Workspace 隐藏自身左栏/顶栏，只出中区+右栏。外壳「新写一条」在 /workspace 派发 `forgenote:new-content` 事件，Workspace 用 latest-ref effect 监听复位（别删这个监听，否则死按钮）。
- **深链**：`?idea=`（预填想法）、`?taskId=`（自动打开任务）由 workspace page 读 searchParams。
- **数据层**：迁移 0001~0005；RLS + 复合 FK owner 一致性（0004）；`main_content_documents`（0005）。改数据结构 → 更新 `docs/DATA-SCHEMA-M2.md`；改 API → `docs/API-CONTRACT-M2.md`；改 UI → `docs/UIUX-M2.md`；同一 PR 内。

## 6. 环境坑（踩过的）

- **迁移执行**：本机直连 Supabase 5432 被代理挡；迁移走 Supabase 后台 SQL Editor 手动执行（0005 已执行）。
- **本地登录会跳生产**：Supabase Auth 的 Redirect URLs **没有 localhost**，本地点 Google 登录时 OAuth 回调回退到 SITE_URL(生产)，把人甩到 forge-note-gold.vercel.app。要本地测需在 Supabase 后台 URL Configuration 加 `http://localhost:3100/**`，或用邮箱密码登录。（注：2026-07-13 Owner 看到旧界面的真因是 localhost dev server 旧缓存，非「在生产测」；`rm -rf .next` 重启修复。）
- **git push**：本机代理有时掐 push，且 Claude 侧分类器偶发瞬时拦截；重试常成功。gh API 正常穿代理。
- **⚠️ Cursor 平行编辑流**：仓库有 `.cursor/`，存在另一条会话在改 docs。**改 docs 前先看文档头部状态与 `git status`**，冲突以 `docs/DECISIONS.md` 为准（曾出现把冻结的 PRD-CCOS 误标 Active 的情况）。

## 7. 验证命令（收尾必跑）

`npm run lint && npm run typecheck && npm run build && npm run doctor`（本次全绿）。领域检查按 MAP 跑：`check:derive`/`check:main-content`/`check:structure`/`check:renderers` 等（注意 `check:radar`/`check:recipe` 在沙箱内有 tsx IPC EPERM 问题，需真实环境）。

## 8. 协作模式（本轮实况，供参考）

本轮 UI 重整用了闸门制：Claude 出指令包（`docs/design/g0s12-ui-consolidation/PHASE-*.md`）→ Owner 喂 Cursor 执行 → Claude 复核（抽查源码防编造 + 独立跑验证）→ Owner 过闸。原型闸门拦下过一次架构返工（多页→单外壳），证明有效。Codex 接手后由 Owner 决定继续用哪种模式。
