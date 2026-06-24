# Open Design DSN-01 Runbook

> 目的：把 Open Design 用在 DSN-01 原型上，但不再做纸面迁移。本文件记录真实跑通方式、模型/费用归属、产物进入实现票的协议。

## 结论

Open Design 已能在本机以 Docker 方式运行，但**不能直接消费 Owner 的 Claude Pro**。

当前可行路径：

1. Open Design 用 Docker 独立运行在 `http://127.0.0.1:7456`。
2. DSN-01 原型若使用 Open Design，模型走 **BYOK**，优先复用 Owner 已有的 OpenRouter / OpenAI-compatible API key；费用由对应 API key 的账户承担。
3. Owner 不愿为 BYOK/AMR 额外花 API 费用时，直接回退 **Claude Pro / Claude Design**，不要为了 Open Design 折腾环境。
4. Open Design 生成代码不进入 ForgeNote。只进入设计交付物和后续实现票。

## 已验证运行证据（2026-06-23）

- Docker Desktop 已安装；首次 `docker info` 显示 daemon 未启动，执行 `open -a Docker` 后 daemon 可用。
- 官方镜像直拉失败：`docker pull ghcr.io/nexu-io/od:latest` 返回 `unauthorized`。
- 源码 fallback 已跑通：
  - `git clone --depth 1 https://github.com/nexu-io/open-design.git /private/tmp/open-design`
  - 在 `/private/tmp/open-design/deploy/.env` 写入本地一次性 `OD_API_TOKEN`
  - `docker compose up -d --build`
- 构建事实：
  - 使用 `node:24-alpine`
  - `pnpm@10.33.2`
  - `better-sqlite3` 预编译下载失败后本地编译成功
  - `@open-design/web` 的 `next build` 通过
- 运行事实：
  - `docker compose ps` 显示 `open-design` 为 `Up ... (healthy)`
  - `curl -I http://127.0.0.1:7456` 返回 `HTTP/1.1 200 OK`
  - `curl -s http://127.0.0.1:7456/api/health` 返回 `{"ok":true,"version":"0.11.1"}`
  - 日志显示 `[od] listening on http://127.0.0.1:7456`

## 运行方式

Open Design 不安装进 ForgeNote 仓库。运行目录固定为临时外部目录：

```bash
git clone --depth 1 https://github.com/nexu-io/open-design.git /private/tmp/open-design
cd /private/tmp/open-design/deploy
cp .env.example .env
openssl rand -hex 32
```

把生成值填入 `.env`：

```env
OPEN_DESIGN_IMAGE=ghcr.io/nexu-io/od:latest
OPEN_DESIGN_PORT=7456
OD_API_TOKEN=<openssl rand -hex 32 的输出>
OPEN_DESIGN_MEM_LIMIT=384m
NODE_OPTIONS=--max-old-space-size=192
```

启动：

```bash
docker compose up -d --build
```

验证：

```bash
docker compose ps
curl -I http://127.0.0.1:7456
curl -s http://127.0.0.1:7456/api/health
```

停止：

```bash
cd /private/tmp/open-design/deploy
docker compose down
```

清空本地 Open Design 数据：

```bash
cd /private/tmp/open-design/deploy
docker compose down -v
```

## 模型与费用归属

### 不可行：直接吃 Claude Pro

当前 Docker 路径不能直接用 Owner 的 Claude Pro：

- 宿主机没有 `claude` CLI（`which claude` → `claude not found`）。
- 宿主机只有 Codex.app 内的 `codex`：`/Applications/Codex.app/Contents/Resources/codex`。
- Open Design Docker 容器内没有 `claude` / `codex` CLI，只能看到 Node 和容器内 PATH。
- macOS Codex.app 不能直接当 Linux 容器里的 CLI 用。

结论：**Open Design Docker 模式不会自动复用 Claude Pro 会员。**

### 推荐：BYOK，Owner 付模型费

若坚持用 Open Design 做 DSN-01 POC，推荐 BYOK：

- Provider：OpenAI-compatible / OpenRouter 兼容路径。
- Base URL：`https://openrouter.ai/api/v1`（若用 ForgeNote 现有 OpenRouter 账户）。
- API Key：Owner 手动在 Open Design Settings 输入；Codex 不读取、不粘贴、不保存 secret。
- Model：优先用 ForgeNote 当前 `OPENROUTER_MODEL` 对应模型，或由 Owner 在 OpenRouter 控制台选一个强视觉/前端原型能力模型。
- 费用：由该 OpenRouter / provider 账户承担。

这条路的本质是：Open Design 是原型壳，模型账单是 Owner 的 API 账户，不是 Claude Pro。

### 可选但不推荐：Open Design AMR

Open Design AMR 是 Open Design 的第一方模型路由服务，需要登录/充值。除非 Owner 明确想测试 AMR，否则 DSN-01 不走这条路。

原因很简单：Owner 已有 Claude Pro，且 ForgeNote 已有 OpenRouter 路径；再开 AMR 是新增付费面。

### 保底：Claude Pro / Claude Design

如果 Owner 不想为 Open Design BYOK/AMR 花 API 费，或者 Open Design 原型质量不明显优于 Claude Design，直接用 Claude Pro / Claude Design。不要为了工具替换拖慢 DSN-01。

## DSN-01 操作流程

1. 打开 `http://127.0.0.1:7456`。
2. 在 Settings / Execution mode 中选择 BYOK API 模式。
3. Owner 手动填入 provider `baseUrl` / `apiKey` / `model`。
4. 选择：
   - Skill：`web-prototype`
   - Design system：`Neutral Modern` 或等价 neutral/shadcn 风格
5. 粘贴 `docs/design/DSN-01-brief.md` 的「Brief 正文」。
6. 生成原型。
7. 导出 HTML，或至少保存关键屏截图/录屏。
8. Codex review 原型是否满足 DSN-01。

## POC 判定

Open Design POC 只有三种结论：

| 结论 | 条件 | 后续 |
|---|---|---|
| Pass | 能稳定生成；视觉接近 ForgeNote neutral/shadcn；状态覆盖完整；交付物足够拆 I-20 | 使用 Open Design 产物拆实现票 |
| Conditional Pass | 能生成，但需要 Codex 明显修正信息架构/状态/文案 | 可继续，但先补 `handoff.md` |
| Fail | 跑不稳、模型费不值得、产物弱于 Claude Design、或需要大量手工返工 | 回退 Claude Design |

## 产物进入实现票的协议

Open Design 产物必须落到：

```text
docs/design/dsn-01-open-design/
```

建议结构：

```text
docs/design/dsn-01-open-design/
├── README.md
├── prototype.html          # 可选，Open Design 导出的 HTML
├── screenshots/            # 必须，关键状态截图
├── recording-notes.md      # 可选，录屏说明或链接
├── handoff.template.md     # 模板
├── handoff.md              # 必须，给 Codex / Claude Code 的交接说明
├── codex-review.template.md # 模板
└── codex-review.md         # 必须，Codex review 结论
```

`handoff.md` 必须包含：

- 原型入口或截图列表。
- 覆盖状态：输入、理解中、有账号上下文、无账号上下文、失败重试、认可后收起、工作台终态示意。
- 交互说明：哪些标签可编辑、依据如何展开、置信度如何提示、如何跳过。
- 数据锚点：`rationale`、`confidence`、`account_post`。
- 与现有 `/forge` 差异点：保留什么、替换什么、延后什么。
- 不进入实现票的内容。

`codex-review.md` 必须给出：

- Pass / Conditional Pass / Fail。
- 是否允许拆 I-20。
- I-20 范围建议。
- 需要 Claude Code 实现的文件/组件/API/prompt 影响清单。
- 不允许直接复用 Open Design 生成代码的说明。

## 进入 I-20 的规则

只有当 `codex-review.md` 至少为 Conditional Pass，才允许拆 I-20。

I-20 只接收这些输入：

- 原型截图/HTML作为视觉参考。
- `handoff.md` 的状态与交互定义。
- `codex-review.md` 的实现范围。

I-20 不接收：

- Open Design 生成的业务逻辑。
- Open Design 生成的 API / schema / auth / DB 假设。
- 未经 review 的文案。
- 视觉渲染卡片、内容包重设计、学习闭环等 DSN-01 范围外内容。
