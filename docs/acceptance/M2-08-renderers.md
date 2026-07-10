# M2-08 三 Renderer — 验收证据

结论: Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: 小红书 / X thread / 图片 prompt renderer，slot coverage，sourceStructureHash，账号大脑只读注入
未触及: 真实 LLM 文案质量与平台发布表现

## 实现验收部分

- [x] `x_thread` renderer 已实现：每个叙事 slot 映射为一条 tweet，`format=thread`。
- [x] `xiaohongshu` renderer 已实现：hook -> cover，context/evidence/insight -> card，resolution -> summary，visual layout 纳入覆盖。
- [x] `image_prompt` renderer 已实现：hook / visual_hierarchy / layout 映射为图片 prompt 单元。
- [x] `image_prompt` 通过 `supports()` 限制只支持 visual structure。
- [x] shared render 流程按 plan 绑定 slotKeys，不信任模型改变单元数量/顺序。
- [x] 每个 artifact 都带 `sourceStructureHash`，用于结构溯源。
- [x] 账号大脑只注入表达声音、受众、规则；prompt 明确不得改变主题、选题与结构。
- [x] dismissed memory 被忽略，topic 不进入 account brain，避免 renderer 改选题。

## 自动验证部分

- [x] `npm run check:renderers` -> 通过，覆盖三 renderer plan、hash、not mutate、golden harness、supports、account brain。
- [x] `npm run typecheck` -> 通过。
- [x] `npm run lint` -> 通过。

## 残余风险

- 真实模型输出质量未在本票验收；这里只证明 renderer 契约、覆盖率和边界。
- 旧 structure->renderer 路径已被 M2-09 的 main-content -> derive 路径取代；本 renderer foundation 仍作为 shared foundation 与 golden 依据保留。
