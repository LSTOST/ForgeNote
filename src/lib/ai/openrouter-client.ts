// ForgeNote M1 — OpenRouter 服务端调用层（I-02B）。
// 仅限服务端：本模块读取 OPENROUTER_API_KEY / OPENROUTER_MODEL，不得被客户端组件 import。
// 依据：docs/MODEL-INTEGRATION.md（§1 单网关 / §2 env / §5 失败降级 / §6 单次调用）、
//       docs/DECISIONS.md（模型网关决策：OpenRouter 唯一网关、OpenAI 兼容、env 控制模型名）。
//
// 实现说明：M1 不安装 SDK，直接以原生 fetch 调用 OpenRouter 的 OpenAI 兼容
// chat/completions 端点（DECISIONS 提到“后续以 OpenAI SDK 兼容客户端接入”——
// 端点与报文一致，后续换 SDK 不影响契约）。不做 streaming、不做多模型路由、不做自动重试。

/** OpenRouter OpenAI 兼容端点（chat/completions）。 */
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** 单次调用超时（ms）。M1 单模型单次调用，不做自动重试（MODEL-INTEGRATION §6）。 */
const REQUEST_TIMEOUT_MS = 30_000;

/** 缺少必需环境变量时抛出，由上层映射为 MODEL_NOT_CONFIGURED。 */
export class ModelNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelNotConfiguredError";
  }
}

/** OpenRouter 调用失败（网络/超时/上游 5xx/空响应），由上层映射为 GENERATION_FAILED。 */
export class ModelRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelRequestError";
  }
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * 解析后的环境配置。缺任一项即抛 ModelNotConfiguredError。
 * key 只在服务端读取，绝不返回给调用方或客户端。
 */
function readModelConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();

  if (!apiKey) {
    throw new ModelNotConfiguredError("缺少 OPENROUTER_API_KEY 环境变量");
  }
  if (!model) {
    throw new ModelNotConfiguredError("缺少 OPENROUTER_MODEL 环境变量");
  }
  return { apiKey, model };
}

/**
 * 调用 OpenRouter，要求模型以 JSON 对象返回，回传文本内容（未解析）。
 * - 强制 response_format=json_object（MODEL-INTEGRATION：要求模型返回 JSON）。
 * - 超时/网络错误/上游非 2xx/空内容 → ModelRequestError。
 * - 缺 env → ModelNotConfiguredError。
 */
export async function callOpenRouterJSON(messages: ChatMessage[]): Promise<string> {
  const { apiKey, model } = readModelConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter 可选归因头，便于在控制台识别来源；不含任何密钥。
        "X-Title": "ForgeNote",
      },
      body: JSON.stringify({
        model,
        messages,
        // 要求结构化 JSON 输出；不做 streaming。
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? `OpenRouter 请求超时（>${REQUEST_TIMEOUT_MS}ms）`
        : "OpenRouter 网络请求失败";
    throw new ModelRequestError(reason);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ModelRequestError(
      `OpenRouter 返回非 2xx 状态：${response.status}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ModelRequestError("OpenRouter 响应不是合法 JSON");
  }

  const content = extractMessageContent(payload);
  if (!content) {
    throw new ModelRequestError("OpenRouter 响应缺少有效内容");
  }
  return content;
}

/** 从 OpenAI 兼容响应体中取出首条 choice 的 message.content。 */
function extractMessageContent(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim().length > 0
    ? content
    : null;
}
