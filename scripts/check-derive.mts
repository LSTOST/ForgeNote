// ForgeNote M2-09 Step 4 — 平台派生层验证（可复现，不调 OpenRouter）。
// 用法：npm run check:derive（tsx）。注入 mock fill。
// 验证：① 消息含主内容草稿 + 平台说明 ② 各平台 format 正确 ③ units 来自 fill ④ 解析失败降级告警

import { buildDeriveMessages, deriveToPlatform } from "@/lib/content/derive";
import type { DraftSection } from "@/lib/content/derive";
import type { RendererFill } from "@/lib/render/contract";

let allPass = true;
const check = (name: string, cond: boolean) => {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) allPass = false;
};

const mockFill: RendererFill = async () =>
  JSON.stringify({ units: [{ role: "card", text: "派生文本A" }, { role: "card", text: "派生文本B" }] });
const badFill: RendererFill = async () => "not json";

const sections: DraftSection[] = [
  { role: "hook", heading: "钩子", text: "上线前一晚我砍掉了三周的功能。" },
  { role: "resolution", heading: "收束", text: "问没有它你上周损失了什么。" },
];

// ① 消息组装
console.log("① 派生消息");
const msgs = buildDeriveMessages({ sections, rendererId: "xiaohongshu", accountBrain: { voice: "亲切复盘" } });
const sys = msgs.find((m) => m.role === "system")?.content ?? "";
const usr = msgs.find((m) => m.role === "user")?.content ?? "";
check("system 含小红书平台说明", sys.includes("小红书"));
check("system 含账号声音", sys.includes("亲切复盘"));
check("user 含主内容草稿", usr.includes("上线前一晚我砍掉了三周的功能"));
check("忠于原内容的约束在场", sys.includes("不改变主题"));
check("小红书强制 title/body 单元（G0S-09）", sys.includes('role="title"') && sys.includes('role="body"'));

const imgMsgs = buildDeriveMessages({ sections, rendererId: "image_prompt", accountBrain: {} });
const imgSys = imgMsgs.find((m) => m.role === "system")?.content ?? "";
check("卡片提示词含封面 + 逐要点约定（G0S-09）", imgSys.includes("封面") && imgSys.includes("要点"));

// ② 各平台 format
console.log("② format 映射");
for (const [rid, fmt] of [["xiaohongshu", "carousel_copy"], ["x_thread", "thread"], ["image_prompt", "image_prompt"]] as const) {
  const a = await deriveToPlatform({ sections, rendererId: rid, accountBrain: {} }, mockFill);
  check(`${rid} → format ${fmt}`, a.format === fmt);
}

// ③ units 来自 fill
console.log("③ 产物");
const art = await deriveToPlatform({ sections, rendererId: "xiaohongshu", accountBrain: {} }, mockFill);
check("units = 2", art.units.length === 2);
check("unit text 来自 fill", art.units[0].text === "派生文本A");
check("rendererId 正确", art.rendererId === "xiaohongshu");

// ④ 降级
console.log("④ 降级");
const bad = await deriveToPlatform({ sections, rendererId: "x_thread", accountBrain: {} }, badFill);
check("解析失败 units 空", bad.units.length === 0);
check("带告警", bad.warnings.length > 0);

console.log(allPass ? "\n✓ 全部通过" : "\n✗ 有失败");
process.exit(allPass ? 0 : 1);
