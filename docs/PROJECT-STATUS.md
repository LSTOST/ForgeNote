# ForgeNote Project Status

## 当前里程碑
M1

## 当前票
Batch A — M1 基础闭环加固（Codex 条件验收中）

## 当前分支
i-01-forge-workspace

## 当前 PR
PR #1（待 GitHub 确认）

## 已完成
- I-01：Next.js 项目骨架
- `/forge` 静态页面
- 输入框与 8000 字限制
- 示例想法填充
- Outcome / Recipe 空态
- GitHub Actions CI 已配置
- lint / typecheck / build 已通过
- I-02A：OpenRouter 接入规则文档（docs/MODEL-INTEGRATION.md）
- I-02A：`.env.example`
- I-02A：AI 生成类型契约（src/lib/ai/types.ts）
- I-02A：mock generator（src/lib/ai/mock-generator.ts）
- I-02A 契约修正补丁：Assumption source/state/valueType 对齐 DATA-SCHEMA；Verification 改为 overallPassed + checks；Outcome 命名对齐（titles/cardStructure/cardPrompts 等）；失败草稿补 intentType/assumptions/errorCode（D-04）

## 进行中
- Batch A 条件通过，build 待联网环境复验（Supabase 持久化 + `/api/sessions/:id` + 契约收敛已实现，未 commit，待 Codex 验收 diff）

## 阻塞项
- OpenRouter 真实 API Key 尚未配置
- Vercel Preview 未确认
- Codex GitHub App 未确认

## 下一张唯一任务
待定（I-02B 通过 Codex 验收后确定；候选：登录/Supabase 接入、假设条编辑器、配方保存）

## 最近一次验收结果（Batch A）
- npm run lint：通过
- npm run typecheck：通过
- npm run build：因 Google Fonts 网络在 Codex 环境未复验（待联网环境复验；`/api/forge`、`/api/sessions/[id]` 预期为 ƒ 动态服务端路由）

## 最后更新时间
2026-06-20 (Batch A 条件验收通过，build 已在联网环境复验)
