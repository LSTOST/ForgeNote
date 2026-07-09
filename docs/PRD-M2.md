# ForgeNote PRD · M2 · 结构生成脊椎 + 工作台

> 版本：M2 / v1.0  | 日期：2026-07-08  | 状态：in_progress
> 前身 M1 已完成并归档至 `docs/archive/m1/`。

---

## 1. M2 是什么

ForgeNote M2 是一个**内容结构生成引擎 + 单任务创作操作系统**。核心承诺不是"AI 帮你写内容"，而是告诉你**下一条做什么、为什么会成、发在哪儿**——基于你的账号，不是给所有人的通用建议。

一句话定位："打开产品 60 秒内，它对你账号的判断比空白 ChatGPT 深一个量级。"

## 2. M2 给谁用

Owner 自己，两个真实账号：
- 小红书「独居生活指南」
- 英文 X（即将开）

目标：Owner 连续 4 周用 ForgeNote 完成真实周更选题 + 发布闭环，且不想回 ChatGPT 裸聊（Gate 0）。

## 3. M2 核心闭环

```
Account Intake → Topic Radar → Structure Generation (stability check) →
Main Content (editable) → Platform Derive → Publish → Feedback/Re-run
```

各环节说明：

| 环节 | 做什么 | 对应模块 |
|------|--------|----------|
| **Account Intake** | 粘贴账号 profile + 近期帖子 → AI 提取账号记忆 | `src/lib/account/` |
| **Topic Radar** | 基于账号记忆，每周生成 N 张选题卡，每张带依据 | `src/lib/radar/` |
| **Structure Generation** | 想法 → 结构化骨架（原型 + 槽位 + 策略），带稳定性判定 | `src/lib/structure/` |
| **Main Content** | 结构 → 平台无关可读内容（正文/卡片/脚本），用户可编辑 | `src/lib/content/main-content.ts` |
| **Platform Derive** | 用户编辑后的内容 → 平台特定格式（小红书/Threads/图片 prompt） | `src/lib/content/derive.ts` |
| **Feedback/Re-run** | 发布后回填表现 → 更新账号记忆 → 下次更准 | M2-12（待开发） |

## 4. M2 不做

- 排程与自动发布
- 平台 API / 实时趋势爬虫
- 视觉媒体生成本身（只生成 prompt）
- 同平台多账号
- 团队协作
- 内容日历
- 独立数据看板
- 登录方式扩展（只有邮箱密码 + Google OAuth）
- Billing/Stripe（M2 免费）
- 多模型路由（单 OpenRouter 模型）

## 5. M2 核心概念

### 5.1 Content Prototype（内容原型）

五种稳定的内容原型，定义内容的基本骨架：

| prototypeKey | 中文 | 描述 |
|---|---|---|
| `experience_recap` | 经验复盘 | 分享亲身经历后的教训 |
| `knowledge_explainer` | 知识解释 | 解释一个概念或知识点 |
| `checklist_guide` | 清单指南 | 可操作的步骤清单 |
| `opinion_argument` | 观点表达 | 表达观点并论证 |
| `case_breakdown` | 案例拆解 | 拆解一个真实案例 |

### 5.2 Modality（表达模态）

三种表达维度，`narrative` 是基础，`visual` 是叠加层：

- `narrative`（叙事）— 必选，提供 hook/context/evidence/insight/resolution 五个槽位
- `visual`（视觉）— 可选，提供 layout/visual_hierarchy 两个槽位
- `temporal`（时间线）— 当前 disabled

### 5.3 Slot + Strategy（槽位 + 策略）

每个 modality 下有一组 slot（槽位），每个 slot 可从 Registry 中选择 strategy（策略）。例如 `hook` slot 可选 `problem_hook`、`loss_open`、`contrarian_hook`、`number_hook`。

### 5.4 Stability（稳定性）

六条件判定结构是否"稳定可渲染"：
1. 原型属于五种 stable 原型之一
2. Modality stack 合法
3. 所有 required slot 已填充有效 strategy
4. 所有 required pending decision 已解决
5. 至少一个 renderer 兼容该 modality stack
6. 结构 hash 可确定性生成

**关键规则：即使 unstable，主内容仍可生成（draftReadable = always true）。**

## 6. 功能清单

| 编号 | 功能 | 票 | 状态 |
|------|------|-----|------|
| F-M2-01 | Account Intake（粘贴账号资料 → AI 脑快照） | M2-05 | accepted |
| F-M2-02 | Topic Radar（每周选题卡 + 依据） | M2-06 | code_done |
| F-M2-03 | Structure Generation（想法 → 结构 + 稳定性） | M2-07 | code_done |
| F-M2-04 | Structure Editing（修改 slot strategy / resolve decision） | M2-09 | code_done |
| F-M2-05 | Main Content Generation（结构 → 平台无关可读内容） | M2-09 Step1-2 | code_done |
| F-M2-06 | Content Editing（中区可编辑正文/卡片/脚本） | M2-09 Step2 | code_done |
| F-M2-07 | Platform Derive（主内容 → 小红书/Threads/图片 prompt） | M2-09 Step4 | code_done |
| F-M2-08 | Right Panel Controls（人类可读控制，非 token slider） | M2-09 Step3 | code_done |
| F-M2-09 | Recipe Schema（保存结构配方，不含 prose） | M2-10 | code_done |
| F-M2-10 | Account Memory（编辑后写回记忆） | M2-09 Step3 | code_done |
| F-M2-11 | Gate 0 Dashboard + Owner 周记 | M2-11 | code_done |
| F-M2-12 | 发布后回填 → 写回 account memory | M2-12 | todo |
| F-M2-13 | ChatGPT baseline eval harness | M2-13 | code_done |
| F-M2-14 | Gate 0 验收包 | M2-14 | todo |

## 7. 验收标准（Gate 0）

M2 完成，当且仅当 Owner 能用 ForgeNote 跑通：
1. 粘贴账号 → 得到可读的账号大脑
2. 每周拿到选题卡（带依据，非随机）
3. 选一张选题卡 → 生成结构（可编辑 slot/strategy）
4. 结构 → 生成可读主内容
5. 在编辑器中修改主内容
6. 派生到至少一个平台格式
7. 保存为配方
8. 发布后手动回填表现
9. **连续 4 周不回到 ChatGPT 裸聊**

## 8. 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16.2 + React 19.2 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui 4 + @base-ui/react + lucide-react |
| 后端/DB | Supabase SSR (Auth + RLS + Postgres) |
| 模型网关 | OpenRouter（单模型，`openai` 兼容 fetch） |
| 校验 | Zod 4 |
| 测试 | Playwright |
| 部署 | Vercel |
