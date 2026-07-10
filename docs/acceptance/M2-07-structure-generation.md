# M2-07 结构生成 + 稳定性判定 — 验收证据

结论: Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: idea/radar input -> StructureDocument parse、registry 合法性、stability 六条件、API 持久化边界
未触及: 真实模型创意质量与 Owner 浏览器路径

## 实现验收部分

- [x] `parseStructure()` 只接受 stable prototype，不接受未知原型。
- [x] modality stack 规范化为 M2 主路径：`narrative` 或 `narrative + visual`，`temporal` 被过滤。
- [x] slot 必须来自 registry，且必须属于当前 modality stack；跨模态 slot 会被丢弃。
- [x] strategy 必须属于对应 slot；alias 可迁移，越级 strategy 降级为待填。
- [x] pending decision 做 key/options 数量和长度限制，避免夹带自由长文本。
- [x] `evaluateStability()` 实现六条件：prototype、modality、required slot、required decision、renderer compatibility、structure hash。
- [x] stability 不阻塞主稿，`draftReadable` 恒为 true。
- [x] `/api/structure/generate` 登录后才建任务、调模型、写结构。
- [x] 模型失败或结构保存失败时，`content_tasks` 标记为 `failed` 并写 error code/message，不留下永久 `structuring`。

## 自动验证部分

- [x] `npm run check:structure` -> 通过，覆盖合法结构、alias 迁移、越级 strategy 降级、缺必填 slot、原型差异必填、temporal 过滤、required decision、跨模态 slot、超长 decision option、未知 prototype、visual layout 要求。
- [x] `npm run typecheck` -> 通过。
- [x] `npm run lint` -> 通过。

## 残余风险

- 未执行真实 OpenRouter 生成质量验收；本票验收的是结构合法性、稳定性 gate 和失败边界。
- DB 写入依赖当前 Supabase 环境；本轮未跑 `db:test-rls`，因为缺 Postgres 连接串。
