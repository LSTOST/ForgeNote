# ForgeNote v3.16 Codex Architecture Review

> Review 基线：`docs/redefine-v3-freeze` 最新提交。  
> 输入：`REVIEW-HANDOFF.md`、`ForgeNote_重定义方向_v3.md`、`ForgeNote_M1_产品说明与实现方案_含商业化.md`、`concept.html`、`first-run.html`、`design-tokens.md`。  
> 角色：Codex = 技术负责人 / 架构审查 / QA Agent in Review。  
> 结论性质：本文件是架构 review，不是验收；验收必须另走真实用户路径和 `docs/acceptance/*.md` 证据。

## 总结结论

v3.16 方向在工程上可做，但不能沿着现有 `/forge` 改皮肤继续堆。那会把新产品重新拖回旧的“假设条 + 内容包 + 旧配方”系统。

正确路径是：保留 auth、Supabase/RLS、OpenRouter JSON 调用、错误降级、route handler 持久化这些横向基础设施；拆掉旧 `/forge` 表单流程、旧 `ContentPackage` 类型、旧 `recipes` 语义、旧 eval/metrics 口径；重建一条 `Intent -> Prototype -> Structure -> Renderer -> RecipeSchema -> Feedback` 管线。

M2 开工前有三个硬 blocker：

1. 结构 token 词表 + display mapping 必须先落成版本化 registry。
2. renderer 接口必须先定，禁止每个平台各自改结构。
3. Gate 0 埋点必须先接入，否则“Owner 四周离不离得开”只能靠感觉，不能进入 OPERATING-MODEL 的质量闸。

雷达“热度分 86/82”不能按现在概念稿方式进入 MVP。无 API、无爬虫、无明确公式时，数字热度是伪精确。要么删分数，要么改成透明的“证据强度 / 本账号优先级”。

## 7 个重点评审问题

### 1. 结构 token 词表治理

**结论**  
采用“封闭稳定词表 + 开放候选池”的混合方案。Recipe、学习、统计、renderer 只能消费封闭稳定 token；模型可以提出候选 token，但候选 token 不得直接写入 Recipe 或作为学习维度。

`loss_open` / `expectation_reversal` 这类值不是自由文本，它们是结构策略 token。开放生成会导致同义漂移：`loss_open`、`loss_hook`、`pain_opening` 三个词可能指同一东西，Recipe 学习会立刻报废。

**推荐方案**

- 顶层封闭词表：M1 五类内容原型  
  `experience_recap`、`knowledge_explainer`、`checklist_guide`、`opinion_argument`、`case_breakdown`。
- 表达模态封闭词表：M1 只启用 `narrative`、`visual`；`temporal` 只保留 disabled capability，不进入 UI 主路径。
- slot key 封闭：如 `hook`、`context`、`evidence`、`insight`、`resolution`、`layout`、`visual_hierarchy`。
- slot strategy token 半封闭：按 prototype + slot 维护允许列表，如 `problem_hook`、`loss_open`、`case_evidence`、`expectation_reversal`、`actionable_steps`。
- 候选 token 生命周期：`candidate -> reviewed -> stable -> deprecated`。
- 存储必须带 `vocab_version`，Recipe 存 `machine_key`，不存 human label。
- 模型输出不可信任。所有 token 必须经过 registry 校验；未知 token 进入 `pending_mapping` 或降级为 `generic_*`。

**风险**

- 词表太早封死会限制表达力。
- 词表太松会让 Recipe 学习不可用。
- 模型会天然发明近义词，必须用 schema validator 拦住。

**是否 blocker**  
是。没有词表 registry，Recipe、renderer、eval 都没有稳定输入。

### 2. machine_key 和 human_label 映射表

**结论**  
映射表应由代码侧维护，不应由模型或运行时自由写。Owner 可以决定中文/英文文案，但 machine_key 的新增、废弃、迁移必须走工程变更。

**推荐方案**

建立 `structureRegistry`，至少包含：

```ts
type StructureToken = {
  key: string;
  kind: "prototype" | "modality" | "slot" | "strategy" | "constraint";
  version: string;
  status: "candidate" | "stable" | "deprecated";
  allowedParents?: string[];
  labels: {
    "zh-Hans": { label: string; description?: string };
    en: { label: string; description?: string };
  };
  aliases?: string[];
  deprecatedBy?: string;
};
```

规则：

- DB/API 只存 `machine_key`、`vocab_version`、必要的 `alias_from`。
- UI 通过 locale 取 label。内容语言不等于 UI 语言：用户写英文内容时，中文 UI 仍显示中文 label。
- hover/debug 可显示 `machine_key`，但普通 UI 默认只显示 label。
- 多语言 label 是 registry 的一部分，不进学习层。
- 新增 token 必须同时补 label、解释、父级约束、测试样例。

**风险**

- label 被误当成语义源会污染学习。
- 多语言 label 漏翻会导致 UI 退回 token，破坏 v3.12 的双层认知原则。
- token rename 如果没有 alias/migration，会让旧 Recipe 失效。

**是否 blocker**  
是。它是 token 隐藏、Recipe 稳定和多语言 UI 的共同地基。

### 3. 结构稳定性判定

**结论**  
“结构未稳定不可生成”只能用于底部 renderer 的最终输出和保存 Recipe，不能阻止中区出现可读主稿。否则会和 v3.13 之后“中区必须始终呈现可读内容”直接冲突。

**推荐方案**

把状态拆开：

- `content_draft`：中区可读主稿，可随结构变化即时更新，允许 provisional。
- `structure_document`：右栏结构事实源。
- `render_artifact`：底部 renderer 产物，只能从 stable structure 生成。
- `recipe_schema`：只能从 stable structure 保存。

结构稳定条件：

1. 内容原型已确定，且属于 M1 五类之一。
2. modality stack 合法：M1 只允许 `["narrative"]` 或 `["narrative", "visual"]`。
3. required slots 均存在，且每个 slot 有 registry 中合法 token。
4. required pending decisions 均为 `accepted_default` 或 `user_resolved`。
5. renderer compatibility 通过：目标 renderer 支持当前 modality stack。
6. structure hash 已生成，后续 renderer artifact 记录该 hash。

待决策生命周期：

```text
detected
-> defaulted
-> accepted_default | user_resolved | dismissed_as_optional
-> locked_for_render
```

`context.granularity` 这类决策默认不是全部 blocker。只有影响输出真实性、平台适配或结构完整性的项才标 `required=true`。例：案例是否可具名、数据是否精确、是否需要视觉分页，这些可能阻塞 renderer；“写实 / 模糊”如果有安全默认值，可以不阻塞，但必须标注本次用了默认值。

**风险**

- 如果所有不确定点都阻塞，用户会回到填表感。
- 如果没有结构 hash，renderer 输出无法追溯，eval 和回填归因会乱。
- 如果中区主稿和右栏结构没有单一事实源，会出现“看起来改了结构，实际渲染没变”的信任崩塌。

**是否 blocker**  
是。生成按钮、保存配方、版本回滚都依赖这个判定。

### 4. renderer 接口架构

**结论**  
renderer 必须是纯适配层：读 Structure + 账号上下文，输出 RenderArtifact；不得新增 slot、改 prototype、改 structure token。加平台时只新增 renderer module 和测试，不改结构引擎。

**推荐接口**

```ts
type RendererId = "xiaohongshu" | "x_thread" | "image_prompt";

type RendererInput = {
  structure: Readonly<StructureDocument>;
  accountBrain: Readonly<AccountBrainSnapshot>;
  target: {
    rendererId: RendererId;
    language?: string;
    lengthHint?: string;
  };
  constraints: ReadonlyArray<RendererConstraint>;
};

type RenderArtifact = {
  id: string;
  rendererId: RendererId;
  rendererVersion: string;
  sourceStructureId: string;
  sourceStructureHash: string;
  format: "text" | "thread" | "carousel_copy" | "image_prompt";
  output: unknown;
  warnings: string[];
};

interface Renderer {
  id: RendererId;
  version: string;
  supports(structure: StructureDocument): boolean;
  render(input: RendererInput): Promise<RenderArtifact>;
}
```

工程约束：

- `StructureDocument` 对 renderer 只读。
- renderer 不写 DB；由 orchestration layer 持久化 artifact。
- renderer 输出必须带 `sourceStructureHash`。
- 每个 renderer 配 golden tests：同一 structure 渲染到小红书 / X / 图片 Prompt 后，slot 覆盖率不能丢。
- renderer 可读账号大脑的 platform slice，但只能用于格式、语气、长度、禁用词、标签习惯，不得反向改选题或结构。

**风险**

- “薄 renderer”不是“纯模板”。小红书和 X 的篇幅、节奏、CTA 差异很大，renderer 会有 prompt 和格式规则。薄的边界是“不改结构”，不是“代码很少”。
- 如果 renderer 直接调用大模型自由发挥，会偷偷重写结构，三层系统失效。
- 如果账号大脑混进 renderer 写入逻辑，加平台就会动大脑。

**是否 blocker**  
是。先定接口，再写三个 M1 renderer。

### 5. 选题雷达热度分数据诚实性

**结论**  
概念稿里的 `86 / 82 / 78` 不能作为“热度分”进入 MVP。当前前提是无平台 API、无爬虫，只能粘贴和人工维护领域动态；这不支持伪装成客观热度。

**推荐方案**

MVP 用以下二选一：

1. 直接去掉数字，改成来源标签：`账号匹配强`、`近期信号`、`历史有效`、`低证据`。
2. 保留数字但改名为“本账号优先级”，并公开公式和来源。

如果保留分数，必须类似：

```text
priority_score =
  account_fit * 0.35
  + evidence_strength * 0.25
  + freshness * 0.20
  + novelty * 0.10
  + effort_fit * 0.10
```

每张雷达卡必须显示依据来源：

- 来自用户粘贴的历史帖表现；
- 来自用户手动输入的领域观察；
- 来自人工维护的领域动态；
- 来自跨平台迁移推断，且置信度降级；
- 无外部信号，仅账号匹配。

**风险**

- 伪热度会让产品看起来聪明，实际破坏信任。
- Owner 自用阶段最怕“看起来像数据，其实是模型编的”。
- 人工维护领域动态可以做，但必须有 source ledger 和 freshness。

**是否 blocker**  
现在的“热度分”是 blocker。删掉数字或改成透明优先级后，不阻塞 MVP。

### 6. Eval 生死线：对比 ChatGPT 裸聊

**结论**  
必须做强基线盲测，不能拿弱 prompt 的 ChatGPT 当靶子。ForgeNote 如果赢不了“同样账号材料 + 强提示词”的裸聊，就没有产品资格。

**推荐方案**

评测对象：

- ForgeNote：账号材料进入账号大脑，输出 5 张选题卡 + 推荐结构 + 主 renderer。
- ChatGPT baseline：同一账号 profile、最近帖子、表现数据、领域观察，用固定强 prompt 请求 5 张选题卡和结构建议。

盲测流程：

1. 固定材料包：`profile`、最近 10-20 条内容、表现回填、人工领域观察。
2. A/B 两套输出统一格式，隐藏来源、模型名、产品名。
3. 随机排序，每张只保留用户会看到的信息：题目、为什么现在、为什么适合你、建议结构、首发平台。
4. 评委逐张打分：
   - 本周是否真的想做；
   - 是否像懂这个账号；
   - 依据是否可信；
   - 结构是否能直接展开；
   - 是否优于另一张。
5. 记录真实后续：Owner 是否真的发布，是否回填表现。

Gate 1 过线建议：

- 10 个外部创作者中，至少 6 人在 ForgeNote 5 张卡里选出 1 张“本周真的会做”。
- 盲测 forced choice 中 ForgeNote 胜率 >= 60%。
- 中文主场和非中文主场都不能低于 50%，否则“跨语言”只是口号。

Gate 0 用法：

- Owner 每周也跑同样 A/B，但自评不算严格盲测证据，只作为自用决策日志。
- 真正盲测证据留给 Gate 1。

**风险**

- Owner 自己很难完全 blind，因为题材和口吻会被认出来。
- ChatGPT baseline 会随时间变强，eval prompt 要版本化。
- 如果只评“文案好不好”，会把产品拉回成稿工具；必须评选题卡和结构质量。

**是否 blocker**  
是 Gate 1 blocker；不是搭建 Gate 0 工作台的前置 blocker，但 M2 应尽早做 eval harness，否则后面会调不动质量。

### 7. Gate 0 埋点

**结论**  
Gate 0 不是“Owner 感觉还行”。最小要能回答三件事：是否完成真实周更、是否逃回 ChatGPT、是否回填表现并形成下一次学习。

**推荐最小事件**

沿用 `usage_events` 思路，但换新事件词表：

```text
task_created
radar_card_viewed
radar_card_selected
own_idea_started
brief_generated
structure_generated
structure_slot_edited
decision_resolved
renderer_generated
render_artifact_copied
recipe_saved
recipe_reused
published_marked
performance_filled
chatgpt_fallback_logged
task_completed
```

事件 payload 禁止存正文，只存：

- `task_id`
- `prototype_key`
- `structure_id`
- `renderer_id`
- `source`: `radar | own_idea | recipe`
- `counts`: slots 数、决策数、重生成次数、复制次数
- `duration_ms`
- `fallback_reason_key`

Gate 0 最小看板：

- 每周真实内容任务数；
- 完成并发布数；
- 雷达卡采用率；
- 结构编辑率；
- renderer 复制/导出率；
- Recipe 保存/复用数；
- 表现回填率；
- ChatGPT fallback 次数和原因；
- Owner 主观周记：本周是否想回裸聊，为什么。

**风险**

- 不记录 fallback，就会自欺欺人：产品可能只是打开了，实际还是靠 ChatGPT 完成。
- 只记按钮点击不记任务完成，会把“使用痕迹”误判为“离不开”。
- 记录正文会带来隐私和数据冗余，没必要。

**是否 blocker**  
是 Gate 0 blocker。没有这些事件，四周自用结论不能进入 OPERATING-MODEL 的验收体系。

## 方向级异议，需 Owner 裁决

这些不是我直接改方向文档的点，但实现前必须裁决，否则工程会各写各的。

1. **“平台只存在底部”与“主输出 · 小红书”冲突。**  
   v3.16 handoff 明确平台只在底部渲染层，但 concept 中区顶部有 `主输出 · 小红书`，左栏当前任务和最近内容也展示平台。Owner 需要裁决：严格平台只在底部，还是放宽为“平台控制只在底部，历史/任务 metadata 可以显示平台”。

2. **“结构未稳定不可生成”与“中区始终可读”需要定义生成的对象。**  
   如果“生成”指中区主稿，会冲突；如果指 renderer artifact 和 Recipe 保存，则可成立。建议按后者执行。

3. **“选题引擎”与 PRD 的“内容创作与沉淀工作台”重心不完全一致。**  
   方向文档说真正痛点在上游选题，PRD 主路径更偏“模糊想法 -> 可编辑草稿 -> 多平台派生”。Gate 0 目标应以“Owner 每周周更选题和完成闭环”为准，不应只优化 1 分钟出草稿。

4. **Recipe 含“已验证表现信号”的存储边界需定。**  
   Recipe 禁存正文是对的；但“已验证表现信号”如果直接内嵌到 Recipe，后续归因和删除会复杂。建议 Recipe 只存 signal summary / refs，表现原始记录留在 performance/event 表。

## 文档与概念稿不一致处

1. **M1 renderer 铁线被概念稿破坏。**  
   Handoff 和方向文档规定 M1 renderer 只有小红书 / X / 图片 Prompt；concept 底栏展示公众号、IG、YouTube、更多；first-run 最近内容也出现公众号。实现时必须删到 M1 三个，其他只可做 disabled / future 标记，不能作为可点目标。

2. **平台位置不一致。**  
   Handoff 说平台只在底部；concept 中区顶部 `主输出 · 小红书`、左栏 task tag `小红书`、最近内容 metadata `小红书图文 / 公众号文章` 都把平台带到非底部区域。需要按上面的 Owner 裁决执行。

3. **方向文档内部历史段落容易误导。**  
   §4 仍有“同一选题支持小红书版 / X 版两个标签页”的旧描述；v3.13-v3.16 已经删除平台 tab，改为底部 renderer。实现票必须引用 v3.16 当前规则，不要拿早期段落做依据。

4. **PRD §4 的管线表述有一处模型歧义。**  
   PRD 写 `内容原型 -> 内容结构 -> 表达模态 -> 平台渲染`；方向文档当前模型是 Narrative 为基座，Visual/Temporal 是叠加层。建议工程模型使用 `prototype -> narrative base -> optional visual layer -> renderer`，避免把 Narrative 和 Visual 做成互斥类型。

5. **雷达分数在概念稿中像真实热度。**  
   Handoff 明确要求审数据诚实性；concept/first-run 直接显示 86/82。实现时不能复制这个 UI 语义。

6. **PRD 的“保存为可复用内容资产”容易和 Recipe 禁存正文混淆。**  
   可以有 Content Asset 保存正文和历史结果，但 Recipe 必须是另一种资产：只保存生产方法 / schema。UI 和 DB 命名要分开。

## 代码资产保留 / 拆除边界

### 保留

1. **Auth / DSN-02**
   - `src/lib/supabase/server.ts`
   - `src/lib/supabase/client.ts`
   - `src/app/login/page.tsx`
   - `src/components/auth/*`
   - `src/app/auth/callback/route.ts`
   - `src/app/auth/signout/route.ts`
   - `src/app/reset-password/page.tsx`

   原因：这些是横向登录能力，不绑定旧 `/forge` 产品定义。RLS 也按 `auth.uid() = user_id`，保留正确。

2. **Supabase / RLS 基础模式**
   - `profiles`
   - `usage_events`
   - RLS policy 模式
   - `created_at / updated_at` 触发器

   原因：多用户隔离、事件记录、profile 扩展都还需要。

3. **生成 pipeline 基建**
   - `src/lib/ai/openrouter-client.ts`
   - server-only 模型调用边界
   - JSON schema parse + failure draft 思路
   - route handler 鉴权、错误码、持久化模式

   但 `generateContentPackage` 的 prompt 和类型不能保留原语义，只能保留编排壳。

4. **表现回填思路**
   - 手动回填、range 化、best-effort event 记录的思路可保留。
   - 具体字段应从旧 session 迁到新 task/performance 结构。

### 拆除 / 重建

1. **`/forge` UI 整体重建**
   - `src/components/forge/ForgeWorkbench.tsx`
   - `IdeaInput`
   - `DirectionPanel`
   - `AssumptionPanel`
   - `OutcomePanel`
   - `RecipePanel`
   - `PerformancePanel`

   原因：这些组件的心智模型是旧“方向判断 / 假设条 / 内容包 / 旧配方”，不适合在里面补 v3.16。

2. **旧 AI 类型整体替换**
   - `IntentType = content_package | xiaohongshu_note | card_prompt | generic_content`
   - `Assumption`
   - `ContentPackage`
   - `CardPromptItem`
   - `RecipeDraft`

   替换为：
   - `ContentPrototype`
   - `StructureDocument`
   - `StructureSlot`
   - `PendingDecision`
   - `RenderArtifact`
   - `RecipeSchema`

3. **旧 recipes 体系拆除**
   - `src/app/recipes/*`
   - `src/components/recipes/*`
   - `src/app/api/recipes/*`

   当前 recipes 保存的是 `recipe_snapshot` 拆出的字段，本质仍是旧内容包配方。v3.16 的 Recipe 是 Structure Schema，不应沿用旧详情页和重跑逻辑。

4. **旧 eval / metrics 口径重写**
   - `scripts/eval-forge.mjs`
   - `scripts/smoke-forge-api.mjs`
   - `scripts/metrics.mjs`

   旧 metrics 看的是 `activation_rate / assumption_edit_rate / recipe_save_rate` 等旧链路。Gate 0 需要新事件：雷达采用、结构稳定、renderer 生成、ChatGPT fallback、发布回填。

5. **旧 copy 导航重写**
   - `Forge`
   - `Recipes`
   - 假设条相关 copy

   登录页 copy 可保留；工作台 copy 应按 v3.16 重写。

### DB 处理建议

不要在 M2 第一票里破坏性 drop 旧表。更稳的做法是 additive 新表：

```text
content_tasks
structure_documents
render_artifacts
recipe_schemas
account_memory_items
radar_cards
performance_records
```

旧 `sessions` / `recipes` 可以先停止写入并保留历史；等 Owner 确认旧数据无迁移价值，再出单独 cleanup migration。这样拆代码干净，数据风险最低。

## 推荐 M2 架构基线

最小新模型：

```text
content_tasks
  user_id
  raw_intent
  prototype_key
  source_type: own_idea | radar | recipe
  status

structure_documents
  task_id
  vocab_version
  prototype_key
  modality_stack
  slots
  pending_decisions
  stability_status
  structure_hash

render_artifacts
  task_id
  structure_id
  renderer_id
  renderer_version
  source_structure_hash
  output

recipe_schemas
  user_id
  vocab_version
  prototype_key
  modality_stack
  slot_schema
  renderer_policy
  performance_signal_refs
```

原则：

- 中区可读主稿可以存在，但它不是 Recipe。
- Recipe 只存 schema 和生产方法。
- renderer artifact 可以存最终文本，因为它是历史输出，不是 Recipe。
- 学习只吃 structure token、source ledger、performance signal，不吃 human label。

## M2 建议票列表

目标倒排：Gate 0 = Owner 连续 4 周用 ForgeNote 完成真实周更，且不想回 ChatGPT 裸聊。

| 票 | 标题 | 目标 | 依赖 |
|---|---|---|---|
| M2-00 | 冻结冲突裁决补丁 | Owner 裁决平台位置、M1 renderer 可见范围、雷达分数语义、生成稳定性语义 | 本 review |
| M2-01 | Structure Registry v0 | 落 prototype / modality / slot / strategy token registry + zh/en label + versioning | M2-00 |
| M2-02 | 新数据模型 migration | 新增 content_tasks / structure_documents / render_artifacts / recipe_schemas / radar_cards / performance_records | M2-01 |
| M2-03 | Renderer Contract | 定义 renderer interface、structure hash、artifact schema、golden test harness | M2-01 |
| M2-04 | Legacy Cutover Shell | 停止旧 `/forge` 写入路径，移除旧内容包 UI 入口，保留 auth 后进入新 workspace 壳 | M2-02, M2-03 |
| M2-05 | First-run Account Intake | 支持 Owner 粘贴小红书/X profile、近期内容、表现数据，生成带来源的 account memory snapshot | M2-02 |
| M2-06 | Radar Cards Without Fake Heat | 生成每周 5 张雷达卡，显示 evidence/source/freshness，不显示伪热度 | M2-05 |
| M2-07 | Structure Generator + Stability Gate | 从 idea/radar card 生成 Narrative + Visual structure，支持 pending decisions 和稳定性判定 | M2-01, M2-02 |
| M2-08 | Three M1 Renderers | 小红书 / X / 图片 Prompt 三个 renderer 输出 artifact，不改 structure | M2-03, M2-07 |
| M2-09 | Workspace v3.16 UI Implementation | first-run + 四区工作台 + 中区可读主稿 + 右栏结构控制 + 底部 renderer | M2-04, M2-07, M2-08 |
| M2-10 | RecipeSchema Save/Re-use | 保存结构配方，换输入复用，严格不存正文 | M2-07, M2-08 |
| M2-11 | Gate 0 Instrumentation | 新 usage_events 词表、ChatGPT fallback logging、Owner 周看板 | M2-02, M2-09 |
| M2-12 | Performance Fill + Learning Visible | 发布后手动回填，展示“本周验证/推翻了什么”，写回 account memory signal | M2-05, M2-11 |
| M2-13 | ChatGPT Baseline Eval Harness | 固定材料包、强 baseline prompt、A/B 匿名输出、judgment 记录 | M2-06, M2-08 |
| M2-14 | Gate 0 Acceptance Pack | 每周真实路径验收模板、证据归档到 `docs/acceptance/*.md`，四周总结 | M2-11, M2-12, M2-13 |
| M2-15 | Legacy Cleanup | 删除旧 `/recipes` 体系、旧 eval/metrics、旧 copy；旧 DB 表只停止写入，drop 另票 | M2-10, M2-14 |

最短实施顺序不是先做漂亮工作台。先做 `M2-00 -> M2-01 -> M2-02 -> M2-03 -> M2-11`，再做 UI。否则做出来的只是新皮旧系统。
