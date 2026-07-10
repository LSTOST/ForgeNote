# M2-12 发布后回填 → 写回 account memory — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: M2 发布后表现回填 API、学习信号写回账号记忆、Gate 0 事件接线
未触及: Owner 真实发布内容回填、真实 Supabase RLS 数据验证、下周雷达质量变化验证

## 实现验收部分

- [x] 新增 `POST /api/performance/fill`。
- [x] 请求必须登录；服务端按 `taskId` / `renderArtifactId` 加 `user_id` 校验归属。
- [x] 写入 `performance_records`，保存平台、发布时间、range 化 metrics、vsMedian、Owner note。
- [x] 写回 `account_memory_items`：`kind=proven_pattern`、`source=user_observation`、`evidence_refs=["performance:<id>"]`。
- [x] 学习信号收窄为 `validated | invalidated | new_signal`。
- [x] 有 `publishedAt` 时把 `content_tasks.status` 标为 `published`。
- [x] 写入 Gate 0 事件：`published_marked`、`performance_filled`。
- [x] 新增纯 Node 验证脚本 `npm run check:performance-learning`。

## 自动验证部分

- [x] `npm run check:performance-learning` -> 通过

## Owner 浏览器验收

未执行，待 Owner 用真实发布内容确认：

1. 选择已发布任务或派生产物。
2. 回填平台、发布时间、表现区间和一句复盘。
3. 系统生成一条账号记忆学习信号。
4. Gate 0 看板表现回填率增加。
5. 下周雷达/主内容能读到该学习信号。

## 残余风险

- 当前没有完整 UI 表单入口，仅 API 与学习写回路径完成。
- 未跑真实 Supabase 跨用户 RLS 验证。
- 学习信号是 Owner 手动总结，不自动判断表现好坏。
