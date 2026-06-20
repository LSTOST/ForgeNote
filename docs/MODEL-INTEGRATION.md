# ForgeNote MODEL-INTEGRATION

> 范围：M1 OpenRouter 单模型接入契约。本文件只定义接入规则，不执行真实模型调用、不安装 SDK、不创建 API route。

## 1. M1 模型网关决策

- ForgeNote M1 的唯一模型网关是 OpenRouter。
- M1 只使用一个默认模型。
- 业务代码不得绑定具体模型厂商。
- 后续通过 OpenAI SDK 的兼容客户端接入 OpenRouter。
- 本票（I-02A）仅定义接入契约，不安装 SDK、不发起真实请求。

## 2. 环境变量

```
OPENROUTER_API_KEY
OPENROUTER_MODEL
```

规则：

- `OPENROUTER_API_KEY` 只存在于本地 `.env.local`、Vercel Environment Variables 或其他受控密钥系统。
- 不得提交真实 key。
- `OPENROUTER_MODEL` 是唯一默认模型配置来源。
- 业务代码中不得硬编码模型名。
- `.env.example` 只能放空值占位。

## 3. 本地配置规则

1. 从 `.env.example` 复制创建 `.env.local`。
2. 在 `.env.local` 填入真实 `OPENROUTER_API_KEY`。
3. 在 `.env.local` 填入 `OPENROUTER_MODEL`。
4. `.env.local` 必须被 `.gitignore` 忽略。
5. 未配置 key 时，应用仍可启动；真实生成票应返回明确配置错误（`MODEL_NOT_CONFIGURED`），不得白屏。

## 4. Vercel 配置规则

- 在 Vercel Project Settings → Environment Variables 配置 `OPENROUTER_API_KEY`。
- 在 Preview 和 Production 环境分别配置。
- `OPENROUTER_MODEL` 也通过 Vercel 环境变量配置。
- 不通过客户端暴露任何 key。
- 只允许服务端 API route 读取 key。

## 5. 失败与降级策略

真实生成阶段如果发生：

- 缺少 API Key
- OpenRouter 超时
- 上游 5xx
- 网络错误
- 返回内容解析失败

则：

- Session 可保存为草稿。
- `status = draft`。
- `outcome = null`。
- `error_code = GENERATION_FAILED`。
- 用户原始输入必须保留。
- UI 必须显示明确错误态与「重试」入口。
- 不自动切换到第二个模型。
- 不做多模型降级。
- 不得白屏。

## 6. 成本控制原则

- M1 每次只调用一次默认模型。
- 不做自动连续重试。
- 单次失败最多允许用户手动重试。
- 不做后台批量生成。
- 不做自动重生成。
- 后续在 I-02B 增加输入长度和输出 token 上限。
- M1 暂不做模型路由和成本优化器。

## 7. 本票边界

本文件只定义 OpenRouter 接入规则。

- 本票不执行真实模型调用。
- 本票不安装模型 SDK。
- 本票不创建 API route。
