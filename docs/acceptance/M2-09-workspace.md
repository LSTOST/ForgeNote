# M2-09 四区工作台 — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: M2-09 Step 1-4 代码审查
未触及: Owner 真实路径验收（需真实登录账号、模型调用路径、浏览器完整点击流）

## 实现验收部分

- [x] Step 1 主内容层已实现：`src/lib/content/main-content.ts` 提供平台无关 `MainContent`，`src/lib/content/outline.ts` 提供确定性 `ContentOutline`。
- [x] Step 1 API 已实现：`POST /api/content/main` 按 RLS 加载 `structure_documents`，加载账号记忆，生成主内容。
- [x] Step 2 中区已改为可读对象：`Workspace.tsx` 展示内容方向、提纲、可编辑 heading/text，不再把 token slot 当中区主对象。
- [x] Step 3 右栏轻控制已实现：内容原型、模态、结构顺序、strategy 选择、pending decision、输出语言、账号记忆摘要在右栏。
- [x] Step 4 派生层已实现：`src/lib/content/derive.ts` 和 `POST /api/content/derive` 从用户编辑后的主内容 sections 派生，而不是从结构直接渲染。
- [x] 双向 hover 高亮已实现：中区 outline/main section 与右栏 slot 通过 `hoverSlot` 联动。
- [x] AI 助手胶囊保持占位态：只展示占位说明，不接后端。
- [x] 上次 blocker 2 基本修复：account memory 增加 `evidenceRefs` 类型、ledger 校验、递归 sanitizer、`evidence_refs` 入库。
- [x] 上次 blocker 3 基本修复：slot 校验 modality stack，decision resolvedValue 必须来自 options。
- [x] 上次 blocker 4 基本修复：structure generation 失败时将 task 标记为 `failed` 并写 error code/message。
- [x] 上次 blocker 1 已补齐：`structure_documents` / `render_artifacts` 使用复合 FK；`performance_records` / `usage_events` 使用 owner consistency trigger 保留 `on delete set null` 语义。
- [x] `/first-run` account intake 成功后进入 `/workspace`，关闭主链路断裂。

## 自动验证部分

- [x] `npm run lint` -> 通过
- [x] `npm run typecheck` -> 通过
- [x] `npm run build` -> 通过
- [x] `npm run doctor` -> 通过，0 failed / 0 warnings
- [x] `npm run check:main-content` -> 通过（沙箱内 tsx IPC EPERM；提权后通过）
- [x] `npm run check:derive` -> 通过（沙箱内 tsx IPC EPERM；提权后通过）
- [x] `npm run check:renderers` -> 通过（沙箱内 tsx IPC EPERM；提权后通过）
- [x] `npm run check:intake` -> 通过（补充验证 blocker 2；沙箱内 tsx IPC EPERM；提权后通过）
- [x] `npm run check:structure` -> 通过（补充验证 blocker 3；沙箱内 tsx IPC EPERM；提权后通过）
- [x] `npm run progress` -> 通过，生成 dashboard；最新完成数以后续 dashboard 为准
- [ ] `npm run db:test-rls` -> 未通过环境前置，缺少 `DATABASE_URL` 或 `SUPABASE_DB_URL`

## Owner 浏览器验收

未执行，待 Owner 以真实账号走通完整路径：

1. `/login` -> 邮箱密码登录 -> `/workspace`
2. `/workspace` 输入想法 -> 生成结构 -> 查看提纲
3. 生成主内容 -> 编辑 heading + text
4. 右栏修改 slot strategy / pending decision
5. 底栏选择平台 -> 派生结果展示
6. `/first-run` account intake -> 返回 `/workspace`

本次仅启动过 `npm run dev`；dev server 显示 ready，但本地 curl 端口探针无法连接，未作为用户路径证据。

## 残余风险

- 残余：DB owner trigger 已写入 migration，但当前环境缺 `DATABASE_URL` / `SUPABASE_DB_URL`，未跑真实数据库隔离测试。
- 残余：`POST /api/content/main` 和 `POST /api/content/derive` 在鉴权前执行 zod schema 校验；未调模型、不落库，但不符合最严格的 auth-first 模板。
- 残余：`POST /api/content/main` 对 `content_tasks` 读取不显式 `.eq("user_id", user.id)`，依赖 RLS；安全边界可接受，但调试时会把 task 读取失败吞成空 intent。
- 残余：中区编辑只有本地 draft，未实现保存持久化；M2-09 done 可以接受，但不能当“编辑后可回看”证据。
- 未覆盖：没有真实浏览器登录、模型生成、Supabase 数据库跨用户隔离测试、Owner 真实路径验收。
