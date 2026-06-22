#!/usr/bin/env node
// ForgeNote smoke — POST /api/forge 匿名冒烟（QA-01：适配当前 HEAD / Batch A 鉴权）。
//
// 当前路由顺序（src/app/api/forge/route.ts）：
//   1) 解析 JSON         → 失败 VALIDATION_FAILED (400)
//   2) body schema 校验  → 失败 VALIDATION_FAILED (400)
//   3) 鉴权              → 未登录 AUTH_REQUIRED (401)
//   4) 输入空 / 超长     → INPUT_EMPTY / INPUT_TOO_LONG (400)
//
// 关键事实：鉴权在输入校验「之前」。所以匿名请求只要 body 合法，一律 AUTH_REQUIRED，
// 而**看不到** INPUT_EMPTY / INPUT_TOO_LONG（那些需登录后才会触达）。
// 因此本匿名冒烟断言：合法 body → AUTH_REQUIRED；非法 body → VALIDATION_FAILED。
// 登录态下的输入边界用例由浏览器 / eval（I-13）覆盖，不在匿名冒烟范围。

const baseUrl =
  process.env.FORGENOTE_BASE_URL || process.env.BASE_URL || "http://127.0.0.1:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function postForge(body, options = {}) {
  const res = await fetch(`${baseUrl}/api/forge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: options.rawBody ?? JSON.stringify(body),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`OK   ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(`     ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

console.log(`Smoke target: ${baseUrl}/api/forge (匿名)`);

await runCase("非法 JSON → VALIDATION_FAILED (400)", async () => {
  const { status, json } = await postForge(null, { rawBody: "{" });
  assert(status === 400, `期望 400，实际 ${status}`);
  assert(json?.ok === false, "期望 ok=false");
  assert(json?.error?.code === "VALIDATION_FAILED", `意外错误码 ${json?.error?.code}`);
});

await runCase("缺 rawInput → VALIDATION_FAILED (400)", async () => {
  const { status, json } = await postForge({ intentType: "content_package" });
  assert(status === 400, `期望 400，实际 ${status}`);
  assert(json?.ok === false, "期望 ok=false");
  assert(json?.error?.code === "VALIDATION_FAILED", `意外错误码 ${json?.error?.code}`);
});

await runCase("合法输入但未登录 → AUTH_REQUIRED (401)", async () => {
  const { status, json } = await postForge({
    rawInput: "想做一组小红书卡片，主题是第一次独居备用金清单",
  });
  assert(status === 401, `期望 401，实际 ${status}`);
  assert(json?.ok === false, "期望 ok=false");
  assert(json?.error?.code === "AUTH_REQUIRED", `意外错误码 ${json?.error?.code}`);
});

await runCase("空白输入仍先被鉴权拦截 → AUTH_REQUIRED (401)", async () => {
  // 鉴权早于输入校验：匿名下空白输入不会得到 INPUT_EMPTY，而是 AUTH_REQUIRED。
  const { status, json } = await postForge({ rawInput: "   " });
  assert(status === 401, `期望 401，实际 ${status}`);
  assert(json?.error?.code === "AUTH_REQUIRED", `意外错误码 ${json?.error?.code}`);
});

if (process.exitCode) {
  console.error("\nSmoke failed.");
  process.exit(process.exitCode);
}

console.log("\nSmoke passed.");
