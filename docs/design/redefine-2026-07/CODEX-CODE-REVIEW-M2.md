# ForgeNote M2 实现代码 Review（Codex）

> Review 类型：代码 / 架构实现 review，不是设计 review，不是验收。  
> 基线：`docs/redefine-v3-freeze` 最新提交 `a92c245 feat(M2-07,M2-08): /workspace vertical (idea → structure → render)`。  
> 入口：`docs/design/redefine-2026-07/CODE-REVIEW-HANDOFF-M2.md`。  
> 约束：不重开 v3.16 设计；未做的下阶段票不算缺陷。

## 复现结果

已跑：

```text
npm run typecheck      PASS
npm run lint           PASS
npm run check:intake   PASS（提权后；沙箱内 tsx IPC listen EPERM）
npm run check:structure PASS（提权后；沙箱内 tsx IPC listen EPERM）
npm run check:renderers PASS（提权后）
npm run check:recipe   PASS（提权后）
```

未跑绿：

```text
npm run db:test-rls
```

原因：当前环境缺 `DATABASE_URL` / `SUPABASE_DB_URL`。这是环境缺失，不是 RLS 脚本失败。另：即使该脚本在有 DB 的机器上绿，它目前只检查“RLS 是否启用 + policy 数量”，不检查跨用户插入/引用隔离，不能当完整 RLS 证明。

## Findings

### P1 / Blocker：新表 denormalized `user_id` 没有约束父子归属一致，RLS 可能被跨用户外键引用绕出脏关系

相关代码：

- `supabase/migrations/0003_structure_core.sql:39-49`
- `supabase/migrations/0003_structure_core.sql:62-71`
- `supabase/migrations/0003_structure_core.sql:145-153`
- `supabase/migrations/0003_structure_core.sql:185-211`

问题：M2-02 给每张新表加了 denormalized `user_id` 并用 `auth.uid() = user_id` 做 RLS，这个方向可以接受。但 child 表没有强制 `child.user_id = parent.user_id`。

例子：已登录用户如果知道另一个用户的 `content_tasks.id`，理论上可以直接通过 Supabase REST 插入：

```text
structure_documents.user_id = 自己
structure_documents.task_id = 别人的 task id
```

RLS 只检查 child row 的 `user_id`，不会自动检查 FK 指向的 parent 是否属于同一个用户。正常 app route 当前不会这么写，但数据模型本身没挡住，后续路由一多，这个坑会被复制。

风险：跨用户脏引用、级联删除关系异常、后续 join/统计/回填归因被污染。不是“读到别人数据”的直接漏洞，但会破坏数据边界。

是否 blocker：是。M2-02 数据模型在复制到更多 route 前必须补。

建议：

- 给 parent 表加唯一键 `(id, user_id)`，child 表用复合 FK，例如：
  `foreign key (task_id, user_id) references content_tasks(id, user_id)`。
- `render_artifacts(structure_id, user_id)` 同理引用 `structure_documents(id, user_id)`。
- `performance_records(task_id, user_id)` / `usage_events(task_id, user_id)` 同理处理，或用 trigger 强制 owner 一致。
- `db:test-rls` 增加真正的隔离用例：user A 不能插入引用 user B parent 的 child row。

### P1 / Blocker：账号记忆的 evidence refs 只在 parse 阶段存在，没有校验真实 ledger，也没有持久化

相关代码：

- `src/lib/account/intake.ts:70-88`
- `src/lib/account/intake.ts:97-108`
- `src/app/api/account/intake/route.ts:91-104`
- `src/lib/account/types.ts:50-61`
- `supabase/migrations/0003_structure_core.sql:106-116`

问题有三层：

1. `parseAccountMemory` 只检查 `evidenceRefs.length > 0`，没有校验引用是否真的在输入 ledger 内。模型可以写 `["帖99"]`，也会通过。
2. `AccountMemoryItem` 和 `account_memory_items` 表没有 `evidence_refs` 字段；route 入库只保存 `evidence_count`，证据引用出了 API response 就丢了。
3. `stripContentFields` 只剥离 top-level `body` 字段。模型可以把长正文塞进嵌套对象或数组，例如 `{ note: { text: "长正文..." } }`，当前会入库。

风险：反编造机制只在当场看起来成立，落库后不可复核；后续雷达、学习、eval 只能看到“证据 x2”，但不知道证据是哪两条。更坏的是，模型可以伪造 evidence ref 或把正文藏进嵌套 JSON。

是否 blocker：是。M2-05 是账号大脑地基，这个洞不补，M2-06 雷达和 M2-12 学习会在不可信记忆上继续放大。

建议：

- `AccountMemoryItem` 增加 `evidenceRefs: string[]`。
- `account_memory_items` 增加 `evidence_refs jsonb not null default '[]'::jsonb`。
- `parseAccountMemory(rawJson, { validRefs })` 校验 ref 必须来自本次输入生成的 ledger：`profile`、`帖1..帖N`、`表现1..表现N`。
- 对 `body` 做递归 sanitizer：禁用正文 key、限制任意字符串长度、限制数组长度、限制对象深度。
- `check:intake` 增加三类失败样例：伪造 `帖99`、嵌套正文、数组长文本。

### P1 / Blocker：结构层没有校验 slot 属于当前 modality stack，pending decision 可夹带任意文本并解锁稳定

相关代码：

- `src/lib/structure/generate.ts:68-96`
- `src/lib/structure/stability.ts:63-84`
- `src/app/api/structure/[id]/decision/route.ts:35`
- `src/app/api/structure/[id]/decision/route.ts:87-93`

问题：

- `parseStructure` 校验了 slot 是已知 token，但没有检查 slot 的 `allowedParents` 是否在当前 `modalityStack` 内。模型可以输出 `modalityStack=["narrative"]`，同时塞入 `layout:list_cards`。稳定性仍可能通过，Recipe 也会保存这个跨模态 slot。
- `pendingDecisions` 的 `key/options` 是自由字符串，未做 registry / 格式 / 长度校验。
- decision route 允许任意 `resolvedValue`，没有检查它是否属于该 decision 的 `options`。任何客户端都可以 PATCH 一个长文本，状态变 `user_resolved`，稳定性条件 4 就通过。

风险：结构层开始存非结构文本，Recipe 会沉淀污染 schema；更严重的是 required decision 可以被任意值“裁决”，稳定 gate 变成假门。

是否 blocker：是。它直接击穿结构层纯 schema 和稳定性 gate。

建议：

- parse slot 时用 registry 的 `allowedParents` 校验 modality：slot 不属于当前 stack 就 dropped；或明确把 `visual` 加入 stack，但必须有规则。
- 定义 pending decision registry / allowlist，例如 `context.granularity`、`case.nameable`、`resolution.form`。
- `options` 和 `resolvedValue` 限制为 machine-key 风格：`^[a-z][a-z0-9_.-]{0,63}$`。
- decision route 必须校验 `resolvedValue` 属于 `target.options`；无 options 的 decision 不允许直接自由写。
- `check:structure` 增加 narrative-only 携带 visual slot、长 decision option、非法 resolvedValue 三个用例。

### P1 / Blocker：`/api/structure/generate` 先落任务再调模型，失败时留下永久 `structuring` 任务

相关代码：

- `src/app/api/structure/generate/route.ts:75-95`
- `src/app/api/structure/generate/route.ts:102-118`

问题：route 先创建 `content_tasks(status="structuring")`，然后调用模型。模型失败、env 缺失、结构 parse 失败时，直接返回错误，不更新 task。结构保存失败时也一样。

风险：真实环境里会产生一批没有结构、没有错误码、状态永久 `structuring` 的任务。后续左栏“当前任务 / 最近内容”接入后，这类任务会变成无法恢复的脏状态。

是否 blocker：是，尤其因为 handoff 明确说这套模式会被复制到后续票。

建议：

- 生成失败时把 task 更新为 `draft` 或 `failed`，写 `error_code/error_message`。当前表无 error 列，需要 migration 或单独 `task_events`。
- 更好：用 DB RPC / transaction 包住 task + structure 写入；失败时保证有可恢复草稿或完整回滚。
- 至少 route 层在 `!result.ok` 和 `docErr` 分支回写 task 状态。

### P2：route 层普遍先做 schema 校验再鉴权，且账号接入没有总输入量上限

相关代码：

- `src/app/api/account/intake/route.ts:47-67`
- `src/app/api/structure/generate/route.ts:54-68`
- `src/app/api/render/route.ts:85-99`

问题：

- 三个 route 都是 parse body / zod schema 后再 auth。没有调模型、没有落库，风险可控；但和 handoff “先 auth 后业务校验”的口径不一致。
- `account/intake` 对单条 `recentPosts` / `performanceNotes` 限制 8000 字，但没有数组长度和总字符上限。已登录用户可以构造超大 prompt，触发成本和延迟风险。

风险：不是数据泄漏，但会形成不统一的安全模式；账号接入 route 可能被滥用成超大模型调用。

是否 blocker：否。但应在下一轮修。

建议：

- 允许先解析 JSON，但 auth 应该紧跟 JSON parse；zod 业务校验放 auth 后。
- `recentPosts.max(20)`，`performanceNotes.max(20)`，总输入字符上限例如 40k；UI 同步提示。

### P2：`/api/render` 把 `MODEL_NOT_CONFIGURED` 映射成普通 `GENERATION_FAILED`

相关代码：

- `src/app/api/render/route.ts:124-135`
- `src/lib/render/renderers/shared.ts:30-34`

问题：renderer 默认 fill 调 `callOpenRouterJSON`，会抛 `ModelNotConfiguredError` / `ModelRequestError`。`/api/render` catch 全部吞成 `GENERATION_FAILED`，虽然错误码枚举里已经有 `MODEL_NOT_CONFIGURED`。

风险：缺 env 时用户看到“渲染失败”，运维/配置问题被误报为模型生成失败；和旧 `/api/forge` 的错误语义不一致。

是否 blocker：否。

建议：按旧 `/api/forge` 和 `generateStructure` 的模式区分 `ModelNotConfiguredError` 和 `ModelRequestError`。

## 请重点看的 8 点

### 1. 词表 registry 治理

结论：基础方向对。封闭 prototype/modality/slot/strategy、alias 迁移、`VOCAB_VERSION`、多语言 label 都站得住。`resolveToken` 能拦未知 key 和 strategy 越级，足以挡住一部分模型近义漂移。

风险：当前没有把 slot 的 `allowedParents` 用到 `modalityStack` 校验上。registry 有规则，parse/stability 没消费完整。

是否 blocker：部分 blocker。registry 文件本身不 blocker；slot-parent 校验缺失是 blocker。

建议：`parseStructure` 里对 slot 做父级校验；`validateRegistry` 增加“stable strategy 不能指向 disabled slot/modality”等完整性检查；下一次 bump `VOCAB_VERSION` 时写 migration/alias 测试。

### 2. 反编造过滤

结论：意图正确，但实现还没达到“source ledger 可复核”。账号记忆目前只校验 source 枚举和 evidence 数量，没校验证据引用真实性，也没持久化引用。结构生成的 pending decision 也有自由文本入口。

风险：模型可以伪造来源、藏正文、用任意 decision value 解锁稳定。

是否 blocker：是。

建议：按上面 P1 finding 补 `evidenceRefs`、valid ref 校验、递归 sanitizer、pending decision allowlist。

### 3. 稳定性 gate

结论：CODEX §3 六条件大体忠实；`draftReadable: true` 是正确的，确实没有把中区主稿阻塞住。required slots v0 用 `hook/insight/resolution + visual layout` 能支撑 smoke。

风险：v0 required slots 还不是按 prototype 定制；更关键的是 stability 没发现“模态栈和 slot 不一致”。decision 裁决值也没进入合法性检查。

是否 blocker：slot/modality 和 decision 合法性是 blocker；prototype 细化不是 blocker。

建议：先补合法性，再逐步改成 per-prototype requirements。例如 checklist 可能必须有 `context` 或 `evidence`，opinion 可能必须有 `evidence`。

### 4. renderer 契约边界

结论：契约方向对。`Renderer` 接口、`RenderPlan`、slot coverage、`sourceStructureHash`、golden harness 都是对的。`Readonly<StructureDocument>` 是类型层护栏，golden harness 能抓“丢 slot / 改 hash”。

风险：`Readonly` 不能挡住恶意 cast，也不深冻结运行时对象；不过 renderer 是内部模块，风险可控。FNV-1a 32-bit 作为 debug/source trace 可以，别把它当唯一安全 ID。当前 `/api/render` 传空 `accountBrain`，后续质量会受限。

是否 blocker：否。

建议：在 artifact 多起来前把 hash 升级为 SHA-256 或至少 64-bit；route catch 区分 `MODEL_NOT_CONFIGURED`；接入 account memory 时保持 renderer 只读，不让 renderer 回写大脑。

### 5. Recipe 禁正文

结论：`buildRecipeFromStructure` / `auditRecipeNoContent` 方向正确：stable 才能保存、slotSchema 只含 machine_key、rendererPolicy 有长度清洗、signal 只存 ref。

风险：Recipe 的正确性依赖上游 structure 合法性。只要 stability 允许跨模态 slot 或 pending decision 文本，Recipe 就会把污染结构保存下来。DB 层也没有 JSON 内容约束，未来 route 必须显式调用 `auditRecipeNoContent`。

是否 blocker：Recipe 核心本身不 blocker；依赖的 structure 合法性 blocker。

建议：新 Recipe route 落库前必须执行 `auditRecipeNoContent`；`rendererPolicy.defaultRenderer` 应收窄为 M1 renderer enum；`performanceSignalRefs` 最好引用 `performance_records.id` 而不是自由 `ref`。

### 6. 路由安全

结论：三条新 route 都做到“未登录不调模型、不落库”，RLS 写入也使用登录用户 `user.id`。这是对旧资产保留模式的正确复用。

风险：schema 校验在 auth 前；账号接入总 prompt 无上限；结构生成失败留下 stuck task；render 错误码语义丢失；account intake 入库丢 evidence refs。

是否 blocker：stuck task 和 evidence refs 是 blocker；其余非 blocker。

建议：统一 route 模板：JSON parse -> auth -> zod/business validation -> model -> transactional persist -> typed error mapping。

### 7. 数据模型

结论：additive 策略正确，旧表不停写的切换留到 M2-04/M2-15 也合理。`recipe_schemas` 无正文列这个方向对。

风险：denormalized `user_id` 没有 parent-owner 约束，是数据模型最大问题。账号记忆缺 `evidence_refs`。新表缺少 status/source/renderer enum check，直接 Supabase 写入时只能靠应用自觉。

是否 blocker：跨表 owner 一致性和 account evidence_refs 是 blocker。

建议：补复合 FK 或 trigger；加 check constraints；`db:test-rls` 从“policy 存在”升级到“隔离行为测试”。

### 8. 纸感 tokens

结论：`globals.css` 编译通过，tokens 基本对齐 v3.16：纸色 background/card/border、橙 primary/ring、深色变体也有。作为 M2-09 down-payment 可接受。

风险：这是全局 shadcn 主题替换，会影响旧 login/forge/recipes/profile。登录页大量硬编码旧暖橙，不一定完全跟随新 token。橙色 ≤3% 属视觉验收，代码层无法证明。

是否 blocker：否。

建议：M2-09 做浏览器截图回归时同时看 login、first-run、workspace、旧 forge/recipes 的可用性；不要在代码 review 里把“看起来符合”当验收。

## 方向级异议

无新的方向级异议。发现的问题都是实现层和数据边界问题，不需要重开已拍板设计。

## 结论

M2 的方向是对的：先做 domain core，再接 route/UI，比直接在旧 `/forge` 上换皮正确太多。离线验证也已经覆盖了不少关键边界。

但现在还不能把这套模式复制到后续票。必须先补四件事：

1. DB parent/child owner 一致性约束。
2. Account memory 的 evidence refs 校验与持久化。
3. Structure slot/modality + pending decision 合法性。
4. 结构生成失败后的 task 可恢复状态。

这四个补完，再继续铺 M2-06 / M2-09 / M2-11，才不会把地基里的裂缝复制到整栋楼。
