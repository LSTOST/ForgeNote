# ForgeNote Docs Index

> 当前开发以 M2 为准。M1 仅归档参考。Agent 不得依据 M1 文档实现当前功能。

## Agent 入口

| 文件 | 用途 |
|------|------|
| `../AGENTS.md` | 产品边界、当前阶段、执行规则 |
| `geb/CONTEXT.md` | GEB Lite 最小上下文入口 |
| `geb/MAP.md` | 代码区域到语义文档和验证命令的映射 |
| `geb/PROTOCOL.md` | 多 agent 协作与同步协议 |
| `geb/TASK.template.md` | 任务卡模板 |

Agent 默认只读上面入口和当前任务对应的一个 M2 语义文档。不要全量读取 `docs/`。

## 当前文档（M2）

| 文件 | 用途 |
|------|------|
| `roadmap/roadmap.json` | **唯一进度事实源**：方向 → 里程碑 → 票状态 |
| `DECISIONS.md` | 所有已拍板的工程与产品决策，不可重新争论 |
| `PRD-M2.md` | M2 产品需求：为什么做、做成什么、每个功能如何运行 |
| `UIUX-M2.md` | M2 UI/UX 规格：工作台四区布局、交互、视觉方向 |
| `DATA-SCHEMA-M2.md` | M2 数据模型：structure/stability/content 类型定义 |
| `API-CONTRACT-M2.md` | M2 API 契约：全部 API 端点、请求/响应、错误码 |
| `OPERATING-MODEL.md` | 角色 / Gate 模型 / 验收规则 |

## 已归档（M1）

| 原始文件 | 归档位置 |
|----------|----------|
| `PRD-M1.md` | `archive/m1/ARCHIVED-PRD-M1.md` |
| `UIUX-M1.md` | `archive/m1/ARCHIVED-UIUX-M1.md` |
| `DATA-SCHEMA.md` | `archive/m1/ARCHIVED-DATA-SCHEMA-M1.md` |
| `API-CONTRACT.md` | `archive/m1/ARCHIVED-API-CONTRACT-M1.md` |
| `PROJECT-STATUS.md` | `archive/PROJECT-STATUS.md` |

## Agent 阅读顺序

任何 Agent 进入仓库后，请按以下顺序阅读：

1. **`AGENTS.md`**（根目录）— 产品认定 + 核心闭环 + 边界规则
2. **`docs/geb/CONTEXT.md`** — 最小上下文规则
3. **`docs/geb/MAP.md`** — 选择任务对应语义文档
4. 当前任务卡或用户请求
5. 按 `MAP.md` 读取一个对应的 M2 文档

禁止在没有明确上下文需求的情况下读取 `archive/`、`acceptance/`、`agent-runs/`、设计归档或生成物。
