# M2-03 Renderer 契约 + Golden Harness — 验收证据

结论: Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: Renderer interface、structureHash、RenderPlan 覆盖率、golden coverage harness
未触及: 平台最终文案质量（属于 M2-08 / 主内容派生质量）

## 实现验收部分

- [x] Renderer 契约定义 `RendererId`、`RenderFormat`、`RendererInput`、`RenderArtifact`、`Renderer`。
- [x] `RendererInput.structure` 与 `accountBrain` 为 `Readonly`，类型层禁止 renderer 改结构。
- [x] 每个 artifact 必须带 `sourceStructureHash`。
- [x] `structureHash()` 只吃 machine_key 语义：vocabVersion、prototypeKey、modalityStack、slots。
- [x] `RenderPlan` / `RenderUnit` 记录 slot coverage。
- [x] `planCoverage()` 可确定性提取覆盖 slot。
- [x] `runGoldenCoverage()` 校验 source hash 与 required slot 覆盖，能抓丢 slot / 改 hash。

## 自动验证部分

- [x] `npm run check:renderers` -> 通过，覆盖 plan 覆盖率、sourceStructureHash、不改结构、golden harness、supports 门控。
- [x] `npm run typecheck` -> 通过。
- [x] `npm run lint` -> 通过。

## 残余风险

- `Readonly` 是 TypeScript 护栏，不是运行时 deep freeze；内部 renderer 若恶意 cast 仍可绕过。当前通过 golden hash/coverage 抓核心破坏。
- `structureHash` 为 FNV-1a 32-bit，适合溯源与 golden，不应当成安全哈希。
