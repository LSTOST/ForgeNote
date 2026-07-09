# M2-11 Gate 0 看板 + Owner 周记模板 — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: Gate 0 周看板、Owner 周记模板、ChatGPT fallback 记录、最小 usage_events 接线
未触及: Owner 连续四周真实使用、真实 Supabase 数据回放、`check:gate0` 成功执行

## 实现验收部分

- [x] 新增 `/gate0` 受保护页面；未登录沿用 `getAuthenticatedContext()` 跳 `/login`。
- [x] 看板按周读取 `content_tasks`、`usage_events`、`radar_cards`、`performance_records`，不读取正文。
- [x] 看板覆盖 M2-11 done 指标：周任务数、发布/完成、雷达采用、结构编辑、复制导出、表现回填、ChatGPT fallback 次数+原因。
- [x] 新增 Owner 周记模板，直接回答“本周是否想回裸聊，为什么”。
- [x] 新增 `POST /api/gate0/fallback`，记录 `chatgpt_fallback_logged`，reason key 白名单校验，note max 160。
- [x] 新增 `POST /api/gate0/event`，只允许 `render_artifact_copied` / `radar_card_selected` 两个前端事件。
- [x] 主链路最小埋点：task_created、structure_generated、structure_slot_edited、decision_resolved、renderer_generated。
- [x] 派生结果弹层新增复制按钮，成功写剪贴板后记录 `render_artifact_copied`。
- [x] 雷达卡“展开做这条”点击记录 `radar_card_selected`。

## 自动验证部分

- [x] `npm run typecheck` -> 通过
- [x] `npm run lint` -> 通过
- [x] `npm run doctor` -> 通过，0 failed / 0 warnings
- [x] `npm run build` -> 通过，route list 包含 `/gate0`、`/api/gate0/event`、`/api/gate0/fallback`
- [ ] `npm run check:gate0` -> 未执行成功；沙箱内 tsx IPC `EPERM`，沙箱外放行请求被拒

## Owner 浏览器验收

未执行，待 Owner 以真实账号确认：

1. 打开 `/gate0` 可看到本周指标。
2. 在工作台派生后点击复制，刷新 `/gate0` 后复制/导出数增加。
3. 在雷达页点击“展开做这条”，刷新 `/gate0` 后雷达采用数增加。
4. 记录一次 ChatGPT fallback，刷新 `/gate0` 后 fallback 次数和原因增加。
5. 用周记模板记录本周是否愿意继续先打开 ForgeNote。

## 残余风险

- `check:gate0` 因当前沙箱/审批策略未跑通，不能把 M2-11 标为 code_done。
- 发布/表现回填依赖 M2-12 继续接线；当前看板能读 `performance_records`，但真实回填流程未闭环。
- fallback 记录是 Owner 手动点击，不能自动检测外部 ChatGPT 使用。
