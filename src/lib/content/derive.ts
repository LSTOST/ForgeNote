// ForgeNote M2-09 重做 Step 4 — 平台派生层（从主内容派生，而非从结构）。
//
// Owner 2026-07-06 定稿：系统先生成一份主内容，用户稳定后再派生到具体平台。
// 本层输入 = 用户编辑过的主内容（可读草稿），输出 = 某平台的发布格式；
// 与旧 renderer（structure → platform）的区别：派生从**主内容文本**出发，带上用户的编辑。
// 铁律：只调格式/长度/平台惯例/账号声音，不改主题与要点。

import { z } from "zod";

import type { AccountBrainSnapshot, RendererFill, RendererId } from "@/lib/render/contract";
import { accountBrainPromptLines, defaultFill } from "@/lib/render/renderers/shared";
import type { ChatMessage } from "@/lib/ai/openrouter-client";

const DERIVE_VERSION = "0.1.0";

/** 平台适配说明（长度/分段/惯例；黑白克制，不承诺未支持能力）。
 *  G0S-09：小红书强制两单元结构（title/body），发布时直接可贴；卡片提示词按封面+要点逐张。 */
const PLATFORM_NOTE: Record<RendererId, string> = {
  xiaohongshu: [
    "小红书图文笔记，输出恰好两个 unit，顺序固定：",
    '① role="title"：发布标题，20 字以内，抓人、口语，可带 1 个 emoji；',
    '② role="body"：完整正文——口语、短段或分点；结尾另起一行给 3-6 个话题标签，每个以 # 开头。',
  ].join("\n"),
  x_thread: 'X（推特）thread：拆成多条推文，每条独立成立、承接自然；简洁有力，首条是钩子。role 用 "tweet"。',
  image_prompt: [
    '图片生成 Prompt（role 一律用 "image"）：',
    "第 1 条是封面图提示词；之后为每个内容要点各写一条卡片图提示词。",
    "每条包含：画面主体 + 风格 + 构图 + 氛围 + 卡片上要突出的一句短文案；不写笔记正文。",
  ].join("\n"),
};

const DERIVE_FORMAT: Record<RendererId, string> = {
  xiaohongshu: "carousel_copy",
  x_thread: "thread",
  image_prompt: "image_prompt",
};

/** 主内容的一段（用户编辑后的草稿）。 */
export interface DraftSection {
  role: string;
  heading: string;
  text: string;
}

export interface DeriveInput {
  sections: readonly DraftSection[];
  rendererId: RendererId;
  accountBrain: Readonly<AccountBrainSnapshot>;
  language?: string;
}

export interface DerivedArtifact {
  rendererId: RendererId;
  version: string;
  format: string;
  units: { role: string; text: string }[];
  warnings: string[];
}

const fillSchema = z.object({
  units: z.array(z.object({ role: z.string().default(""), text: z.string() })).default([]),
});

/** 组装派生消息：把主内容草稿适配到平台格式，贴账号声音，不改主题/要点。 */
export function buildDeriveMessages(input: DeriveInput): ChatMessage[] {
  const { sections, rendererId, accountBrain, language } = input;
  const brainLines = accountBrainPromptLines(accountBrain);
  const draft = sections.map((s) => `【${s.heading}】\n${s.text}`).join("\n\n");
  const system = [
    `你在把一份已经写好的主内容，改写成「${rendererId}」的发布格式。`,
    PLATFORM_NOTE[rendererId],
    "只调整格式、长度、分段与平台惯例——不改变主题、事实与核心要点；忠于原主内容。",
    ...(brainLines.length
      ? ["贴合本账号声音（只影响表达风格，不改内容）：", ...brainLines]
      : []),
    language ? `输出语言：${language}。` : "",
    '仅输出 JSON：{"units":[{"role","text"}]}。role 用上面平台说明规定的单元名。',
  ]
    .filter(Boolean)
    .join("\n");
  const user = ["主内容（忠于它改写）：", draft].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * 从主内容派生平台版（Step 4）。fill 可注入 mock 供离线测试。
 * 不 gate 稳定性（由调用方在有主内容时才允许派生）；只读账号大脑。
 */
export async function deriveToPlatform(
  input: DeriveInput,
  fill: RendererFill = defaultFill,
): Promise<DerivedArtifact> {
  const messages = buildDeriveMessages(input);
  const raw = await fill(messages);

  const warnings: string[] = [];
  let units: { role: string; text: string }[] = [];
  try {
    units = fillSchema.parse(JSON.parse(raw)).units.map((u) => ({ role: u.role || "unit", text: u.text }));
  } catch {
    warnings.push("派生结果解析失败");
  }

  return {
    rendererId: input.rendererId,
    version: DERIVE_VERSION,
    format: DERIVE_FORMAT[input.rendererId],
    units,
    warnings,
  };
}
