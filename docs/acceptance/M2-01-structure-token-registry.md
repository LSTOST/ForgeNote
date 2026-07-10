# M2-01 Structure Token Registry v0 — 验收证据

结论: Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: StructureToken 类型、五原型、模态、slot/strategy 词表、label、alias、token 校验
未触及: 浏览器路径（本票为结构底座，不直接暴露用户路径）

## 实现验收部分

- [x] `VOCAB_VERSION = "2026.07.0"`，结构文档可记录词表版本。
- [x] `StructureToken` 覆盖 `prototype` / `modality` / `slot` / `strategy` 四类 token。
- [x] 五个 stable prototype 已定义：`experience_recap`、`knowledge_explainer`、`checklist_guide`、`opinion_argument`、`case_breakdown`。
- [x] active modality 为 `narrative` + `visual`，`temporal` 保留但 disabled。
- [x] 7 个 stable slot 已定义，并通过 `allowedParents` 绑定所属 modality。
- [x] stable strategy 已定义，并通过 `allowedParents` 绑定可填充 slot。
- [x] token 均有 `zh-Hans` / `en` label。
- [x] `loss_hook` / `pain_opening` alias 迁移到 canonical `loss_open`。
- [x] `resolveToken()` 支持 expected kind 与 parent 校验；未知 / 越级 token 不直接进入结构。
- [x] `validateRegistry()` 覆盖重复 key、strategy parent、slot parent、deprecatedBy、alias 冲突。

## 自动验证部分

- [x] `npm run check:structure` -> 通过，覆盖 alias 迁移、越级 strategy 降级、未知 prototype、跨模态 slot 丢弃。
- [x] `npm run typecheck` -> 通过。
- [x] `npm run lint` -> 通过。

## 残余风险

- 后续新增 token 必须 bump `VOCAB_VERSION`，并补 alias / migration 测试。
- 当前词表是 v0，覆盖 Gate 0 结构生成，不代表长期平台全量结构 taxonomy。
