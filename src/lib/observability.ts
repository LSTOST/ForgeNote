// ForgeNote M1 — I-14 可选观测 scaffold（no-op，零依赖）。
//
// 设计原则：
//   - 未配置 env 时**全部 no-op**：应用照常运行，不白屏、不报错、不外发。
//   - 当前**不引入** Sentry / PostHog SDK、不硬连任何服务；只提供稳定的调用点，
//     待 key 配置 + 后续票接入真实 SDK（见 docs/DEPLOYMENT.md）。
//   - **安全**：不采集用户输入全文（rawInput / outcome / 复盘正文等一律不传），
//     只接受调用方显式给定的轻量属性；不打印 secret。
//
// env（均可选）：
//   - SENTRY_DSN              服务端错误上报（非公开，仅服务端可读）
//   - NEXT_PUBLIC_POSTHOG_KEY 前端事件（公开，构建期注入客户端）
//   - NEXT_PUBLIC_POSTHOG_HOST（可选，自托管时用）

/** 服务端错误上报是否已配置（仅看存在性，不读值/不打印）。 */
export function isServerTelemetryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN && process.env.SENTRY_DSN.trim());
}

/** 前端事件上报是否已配置。 */
export function isClientTelemetryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY.trim(),
  );
}

/**
 * 服务端错误上报（稳定调用点）。未配置 → no-op。
 * 仅上报错误类型/消息与调用方给定的轻量上下文（如 route 名、错误码），
 * 不上报请求体 / 用户输入全文。后续票在此接入 Sentry server SDK。
 */
export function captureServerError(
  error: unknown,
  context?: Record<string, string>,
): void {
  if (!isServerTelemetryConfigured()) return; // no-op until configured
  const message = error instanceof Error ? error.message : String(error);
  // TODO(I-14 follow-up)：接入 Sentry。当前安全占位，仅本地 stderr，不外发、不含用户输入全文。
  console.error("[telemetry] server_error", { message, ...(context ?? {}) });
}

/**
 * 前端事件上报（稳定调用点）。SSR / 未配置 → no-op。
 * properties 必须是轻量、非敏感字段（事件名 + 枚举/计数等），切勿传入用户输入全文。
 * 后续票在此接入 PostHog client SDK。
 */
export function trackClientEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return; // SSR：no-op
  if (!isClientTelemetryConfigured()) return; // no-op until configured
  // TODO(I-14 follow-up)：接入 PostHog。当前安全占位（不外发）。
  const payload = { event, ...(properties ?? {}) };
  void payload;
}
