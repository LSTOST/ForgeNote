# Gate 0 切片差距清单（G0S-01 产出）

> 日期：2026-07-12
> 方法：代码层审计（`src/components/workspace/Workspace.tsx` 788 行全读）+ 域检查 + dev server 启动验证；**真实路径走查待 Owner 登录后补充**
> 结论先行：**引擎层健康，堵点集中在工作台 UI 的三块——持久化、产出物落地、流程收尾。**「界面交互没做好」的体感来源可全部定位。

## A. 致命堵点（不修无法生产）

| # | 问题 | 位置/证据 |
|---|---|---|
| A1 | **零持久化、零恢复**：全部状态在 `useState`，刷新即丢；左栏「最近内容」是占位符（“本轮先保留入口”）；服务端有 content_tasks 等表但 UI 无任何重开任务的入口。编辑到一半离开 = 全部重来 | Workspace.tsx:113-136, 396-402 |
| A2 | **成品无处安放**：平台版本是一次性弹窗，点击遮罩即消失；唯一出口是复制按钮，无成品归档、无历史列表 | Workspace.tsx:761-785 |
| A3 | **复制格式脏**：复制拼接的是原始 role key（`hook`/`cover`/`card` 英文）+ 文本，粘去小红书需手工清理 | Workspace.tsx:283 |
| A4 | **小红书图文需要「文案 + 卡片提示词」两套产物**：现在要分两次 derive，且 image_prompt 在结构无 visual 模态时被禁用、用户无法强制开启——与独居业务的卡片流程直接冲突 | Workspace.tsx:46-50, 717 |

## B. 交互质量（能用但难受）

| # | 问题 | 位置 |
|---|---|---|
| B1 | 重新生成正文**静默覆盖**用户已编辑内容，无确认无保留 | Workspace.tsx:200-202, 508 |
| B2 | 「内容框架」阶段是模板句拼接（“钩子这一段会用「默认写法」推进…”），无真实内容预览，决策价值低 | Workspace.tsx:95-103 |
| B3 | ⌘N 快捷键只有标签没有实现 | Workspace.tsx:334 |
| B4 | 「保存这套写法」按钮 disabled 待接线（M2-10 recipe 未接 UI） | Workspace.tsx:711 |
| B5 | 生成过程无骨架屏/进度反馈，长请求观感像卡死 | 全局 |
| B6 | 回填入口在 /gate0 看板页，与内容流程脱节：发完的内容没有「去回填」的路径 | src/app/gate0/page.tsx |

## C. 与切片票对照

| 票 | 审计结论 |
|---|---|
| G0S-02 品牌喂入 | intake 页面与 brain 摘要 UI 已有；未用独居真实资料实测 |
| G0S-03 手动选题入口 | **比预想轻**：中区 textarea 就是粘贴入口（rawIntent 自由文本），缺的只是顺手性 |
| G0S-04 挂载字段 | 完全缺失，前后端都要加 |
| G0S-05 回填 | API 已有（/api/sessions/:id/performance、gate0 event），UI 需从看板接到内容流程（见 B6） |
| G0S-06 公众号 renderer | 无，按计划切片 2 |

## D. 已验证健康

- `check:structure` / `check:main-content` / `check:derive` / `check:renderers` 全部通过（2026-07-12 本机）
- dev server 正常启动（:3100）；主链路 API 齐备：structure/generate、slot、decision、content/main、content/derive
- 未验证：登录后真实路径（待 Owner）；check:radar（沙箱 EPERM 旧问题）；真实 DB RLS（缺 DB env，见 M2-02 note）

## E. 建议修复顺序（待 Owner 拍板）

1. **G0S-08 持久化 + 恢复**（新票）——不修这个，其他都白搭：能保存、能重开、成品有归档
2. A2 + A3：成品归档 + 复制格式修复（小改，收益即时）
3. A4：小红书「文案 + 卡片提示词」一键双出
4. G0S-02 品牌喂入实测（与 UI 修复并行，互不阻塞）
5. B 组按 dogfood 中的实际疼痛顺序修，不预排
