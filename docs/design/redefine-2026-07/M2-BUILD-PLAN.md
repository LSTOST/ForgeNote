# ForgeNote M2 Build Plan（实现工程师 / Claude Code）

> 依据：`CODEX-REVIEW.md`（架构 review + 票表）、方向文档 v3.16、M2-00 裁决、PRD。
> 目标锚点（Gate 0）：**Owner 连续 4 周用 ForgeNote 完成真实周更选题 + 发布闭环，且不想回 ChatGPT 裸聊。**
> 纪律：**脊椎先于 UI**。不在旧 `/forge` 换皮；additive 新表，旧表停写不 drop。

## 0. 我对 Codex 票表的两处调整

1. **Gate 0 埋点前移**：Codex 把 M2-11 放在 UI（M2-09）之后。改为 **事件表随 M2-02 一起建**，
   每个功能票落地时顺手 wire 对应事件。否则做完 05–09 再补埋点 = 返工，且四周自用量不出结论。
2. **每票补"done 标准"**：Codex 票表只有目标，本 plan 给每票可验收的完成定义（下表）。

## 1. 分期（依赖驱动，不是甘特图）

- **Phase A · 脊椎**（先做，定义一次决定一切）：M2-01 registry → M2-02 数据模型(含事件表) → M2-03 renderer 契约。
- **Phase B · AI 核心 + 数据入口**：M2-05 账号接入 → M2-06 雷达 → M2-07 结构生成+稳定性 → M2-08 三 renderer。
- **Phase C · 壳与 UI**：M2-04 旧路径停写切换 → M2-09 v3.16 工作台。
- **Phase D · 学习与验证**：M2-10 Recipe → M2-12 回填+学习可见 → M2-13 eval harness → M2-14 Gate 0 验收包 → M2-15 清理。
- **贯穿**：Gate 0 埋点（原 M2-11）随 Phase B/C 各功能接入，M2-11 收敛为"看板 + fallback 日志"。

最短起步链：**M2-01 → M2-02 → M2-03**（定脊椎），再碰任何 UI。

## 2. 逐票 done 标准

| 票 | done 标准（可验收） | 依赖 |
|---|---|---|
| M2-00 | ✅ 已完成（commit 1d7bc90）：3 裁决落地概念稿+文档 | — |
| **M2-01** | `src/lib/structure/registry.ts`：StructureToken 类型 + 5 原型/2 模态(+temporal disabled)/slot keys/strategy 词表 + zh/en label + `VOCAB_VERSION`；`validateToken` 未知 token → `pending`/`generic_*`；`npm run typecheck` + `lint` 通过 | M2-00 |
| M2-02 | 迁移 `0003_structure_core.sql`：content_tasks / structure_documents / render_artifacts / recipe_schemas / radar_cards / performance_records + **usage_events 新词表** + RLS(`auth.uid()=user_id`)；`db:test-rls` 通过 | M2-01 |
| M2-03 | `Renderer` 接口 + `RendererInput/RenderArtifact` 类型 + `structureHash()` + golden-test harness 骨架（空 renderer 也能跑）；structure 对 renderer 只读（类型层 `Readonly`） | M2-01 |
| M2-04 | 旧 `/forge` 停止写入（route 返回迁移提示），移除旧内容包 UI 入口；auth 后进入新 `/workspace` 空壳；旧数据保留 | M2-02,03 |
| M2-05 | 首屏账号接入：粘贴 profile+近期内容+表现 → 生成带 source ledger 的 account_memory snapshot（每条标来源+freshness）；不编正文 | M2-02 |
| M2-06 | 每周 5 张雷达卡，显示**来源标签**（账号匹配强/近期信号/历史有效/低证据），**无伪热度数字**；每卡带依据来源 | M2-05 |
| M2-07 | 从 idea/雷达卡生成 Narrative(+可选 Visual) structure，slot 用 registry 合法 token，pending decisions + 稳定性判定（§CODEX-3 六条件）；中区主稿始终可读、不被稳定性阻塞 | M2-01,02 |
| M2-08 | 小红书/X/图片 Prompt 三 renderer，输出 artifact 带 sourceStructureHash；不改 structure；各配 golden test（slot 覆盖率不丢） | M2-03,07 |
| M2-09 | first-run + 四区工作台按 concept.html/first-run.html 实现（中区可读主稿、右栏结构控制、底部 renderer、助手胶囊、点阵纸暖化 tokens） | M2-04,07,08 |
| M2-10 | RecipeSchema 保存（只存 slot_schema+生产方法+signal_refs，**禁存正文**）+ 换输入复用 | M2-07,08 |
| M2-11 | Gate 0 看板（周任务数/发布/雷达采用/结构编辑/复制导出/回填/**chatgpt_fallback 次数+原因**）+ Owner 周记模板 | M2-02,09 |
| M2-12 | 发布后手动回填 → "本周验证/推翻了什么" → 写回 account memory signal | M2-05,11 |
| M2-13 | ChatGPT baseline eval harness：固定材料包 + 强 baseline prompt + A/B 匿名 + judgment 记录（Gate 1 用，M2 早搭防止后期调不动） | M2-06,08 |
| M2-14 | Gate 0 验收包：每周真实路径模板 + 证据归档 `docs/acceptance/*.md` + 四周总结 | M2-11,12,13 |
| M2-15 | 删旧 `/recipes`、旧 eval/metrics、旧 copy；旧 DB 表停写(drop 另票) | M2-10,14 |

## 3. 依赖图（关键路径）

```text
M2-00 ✅
  └─ M2-01 registry ──┬─ M2-02 数据模型(+事件表) ─┬─ M2-04 停写切换 ─┐
                      │                          ├─ M2-05 账号接入 ─ M2-06 雷达 ─┐
                      ├─ M2-03 renderer 契约 ─────┤                              │
                      └───────────────── M2-07 结构生成 ─ M2-08 三 renderer ─────┼─ M2-09 UI
                                                                                 │
        M2-10 Recipe / M2-11 Gate0 看板 / M2-12 回填 / M2-13 eval ── M2-14 验收包 ─ M2-15 清理
```

## 4. 保留 / 拆除（据 CODEX-REVIEW，已核对文件真实存在）

- **保留**：`src/lib/supabase/*`、login/auth/reset-password、`profiles`/`usage_events`/RLS 模式、
  `src/lib/ai/openrouter-client.ts`（编排壳，prompt/类型不留）、手动回填思路、`src/lib/copy`（i18n 脚手架，registry label 复用其 `Locale`）。
- **拆除/重建**：`src/components/forge/*`（8 组件）、旧 `src/lib/ai/types.ts` 语义
  （IntentType/Assumption/ContentPackage/RecipeDraft → ContentPrototype/StructureDocument/StructureSlot/PendingDecision/RenderArtifact/RecipeSchema）、
  `src/app/recipes/*` + `src/app/api/recipes/*`、旧 `scripts/eval-forge|metrics|smoke-forge-api`、Forge/Recipes/假设条 copy。
  **策略：先 additive 并存，M2-15 才删；M2-04 只"停写"。**

## 5. 现在开工：M2-01

范围：纯 TS registry 模块，无 Next/DB 依赖，`typecheck`+`lint` 可验收。产出 `src/lib/structure/registry.ts`。
词表 v0（据 CODEX §1）：
- 原型（封闭）：experience_recap / knowledge_explainer / checklist_guide / opinion_argument / case_breakdown
- 模态：narrative(stable) / visual(stable) / temporal(disabled，不进 M1 UI 主路径)
- slot key（封闭）：hook / context / evidence / insight / resolution / layout / visual_hierarchy
- strategy token（半封闭，按 slot 挂 allowedParents）：problem_hook / loss_open / case_evidence / expectation_reversal / actionable_steps …
- 存储只留 machine_key + vocab_version；label 走 registry，不进学习层；未知 token 走 pending/generic。
