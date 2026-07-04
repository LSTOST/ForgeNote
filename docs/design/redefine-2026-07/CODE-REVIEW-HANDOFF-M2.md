# ForgeNote M2 代码 Review 交接（To: Codex，第 1 次）

> 2026-07-04。这是**实现/代码 review**，区别于之前的设计 review（`CODEX-REVIEW.md` 审的是冻结设计）。
> 触发点：域核心层全部完成 + 第一条端到端垂直（账号接入）Owner 浏览器验收通过。
> 目的：**在这套模式被复制到其余票之前，审它架构上站不站得住**——错一处会被抄十遍。

## 背景

- 分支：`docs/redefine-v3-freeze`（M2 实现代码 + 冻结设计都在此）。
- 设计基线：`ForgeNote_重定义方向_v3.md` v3.16、`CODEX-REVIEW.md`（你上次的架构 review + M2 票表 + M2-00 裁决）。
- 策略：先做能离线验证的域核心，需 live env 的路由/UI 攒到环境就绪再做。已到"路由/UI"阶段。

## 本次 review 范围（M2 已完成部分）

| 票 | 产物 | 可复现验证 |
|---|---|---|
| M2-01 | `src/lib/structure/registry.ts` 结构 token 词表 + 多语言映射 | 运行时完整性 |
| M2-02 | `supabase/migrations/0003_structure_core.sql` 7 表 + 事件 | `npm run db:test-rls`（12/12） |
| M2-03 | `src/lib/render/contract.ts` renderer 契约 + structureHash + golden harness | `check:renderers` |
| M2-05 | `src/lib/account/{types,intake}.ts` + `app/api/account/intake/route.ts` + `first-run` 页 | `check:intake` + 真实模型 + 浏览器验收 |
| M2-07 | `src/lib/structure/{generate,stability}.ts` 结构生成 + 稳定性 gate | `check:structure` |
| M2-08 | `src/lib/render/renderers/*` 三 renderer | `check:renderers` |
| M2-10 | `src/lib/recipe/{types,schema}.ts` Recipe 保存/复用 | `check:recipe` |
| tokens | `src/app/globals.css` 纸感 tokens（M2-09 down-payment） | typecheck |

复现全部验证：
```bash
npm run typecheck && npm run lint
npm run check:intake && npm run check:structure && npm run check:renderers && npm run check:recipe
npm run db:test-rls   # 需 DATABASE_URL；本机直连 5432 被代理挡，Codex 若同环境同样受限
```

## 请重点看的 8 点

1. **词表 registry 治理**：`registry.ts` 的封闭词表 + 别名迁移 + `resolveToken`（未知→pending/generic、越级拦截）。
   是否足以防模型近义漂移？`VOCAB_VERSION` 演进/迁移策略够不够。
2. **反编造过滤**（`account/intake.ts` `parseAccountMemory` + `structure/generate.ts` `parseStructure`）：
   ledger 来源校验、证据强制、正文剥离、越级降级——有没有绕过口子？阈值（280/120 字）合理吗？
3. **稳定性 gate**（`stability.ts`）：CODEX §3 六条件实现是否忠实；`draftReadable` 恒真是否真的让中区不被阻塞；
   required slots 的 v0 启发式（narrative=hook/insight/resolution，visual=layout）是否需要按 prototype 细化。
4. **renderer 契约边界**（`contract.ts` + `renderers/*`）：`Readonly<StructureDocument>` + golden harness
   能否真挡住"偷改结构"；`structureHash`（FNV-1a，不含 pending_decisions）作为溯源键够不够稳。
5. **Recipe 禁正文**（`recipe/schema.ts`）：`buildRecipeFromStructure` 只从 stable 保存 + `auditRecipeNoContent`
   守卫是否够；`applyRecipeToStructure` 换输入复用有无遗漏。
6. **路由安全**（`app/api/account/intake/route.ts`）：auth 门控顺序（先 auth 后业务校验）、RLS 写入、
   错误码映射、批量 insert 的失败处理——对照你上次 review 的 §"代码资产" 保留清单。
7. **数据模型**（`0003_structure_core.sql`）：denormalized `user_id`（我加的，为复用 RLS 模式）是否可接受；
   索引、级联删除、`recipe_schemas` 无正文列的约束是否足够；additive/旧表停写是否干净。
8. **纸感 tokens**（`globals.css`）：把 shadcn 中性主题整体换成纸色 + 橙 primary，对既有页面（login/forge）
   有无破坏；橙是否真只在 primary/ring（≤3%）。

## 边界与约束

- **不重开设计**：v3.16 设计与 UI 形态已 Owner 拍板；架构级异议单列供 Owner 裁决。
- **review ≠ 验收**：验收走真实用户路径 + `docs/acceptance/*.md`（M2-05 已有 `M2-05-account-intake.md`）。
- 未做（下阶段，勿当缺陷）：M2-04 停写切换、M2-06 雷达、M2-07/08/10 的路由+持久化、M2-09 完整工作台 UI、
  M2-11 Gate0 埋点、M2-13 eval harness。旧 `/forge` `/recipes` 保留待 M2-15。
- 产出：写入 `docs/design/redefine-2026-07/CODEX-CODE-REVIEW-M2.md`，每条 finding 给：结论/风险/是否 blocker/建议。

## 给 Codex 的指令（Owner 直接粘贴）

> 你是 ForgeNote 技术负责人（Codex），对 M2 已完成的实现代码做**代码 review**（非设计、非验收）。
> 入口：`docs/design/redefine-2026-07/CODE-REVIEW-HANDOFF-M2.md`。分支 `docs/redefine-v3-freeze` 最新提交。
> 先跑上面的复现命令确认验证套件绿，再逐条回答"请重点看的 8 点"，每条给 结论/风险/是否 blocker/建议。
> 发现架构级异议单列"方向级异议"供 Owner 裁决，不直接改设计文档。
> 产出写 `docs/design/redefine-2026-07/CODEX-CODE-REVIEW-M2.md`。约束：review≠验收；不重开已拍板设计；
> 未做的下阶段票不算缺陷。
