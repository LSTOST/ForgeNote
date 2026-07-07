// ForgeNote M2-09 重做 Step 1 — 主内容层（平台无关的可读内容）。
//
// Owner 2026-07-06 定稿：结构是幕后导演，内容是用户在看/在改的舞台。
// 管线：想法 → 判模态+结构(幕后) → **主内容(可读、平台无关，本层)** → 用户稳定 → 派生平台版。
// 本层介于 structure 与平台 renderer 之间：把结构渲成一份人类可读、可编辑的主内容
// （按模态：叙事→正文 / 视觉→卡片 / 时间→脚本），供中区展示与编辑；不是 token 槽位。
//
// 确定性提纲 + 形态判定拆到 ./outline（纯函数、可客户端引入）；本文件含 LLM 生成（仅服务端）。
// 铁律同 renderer：只读 structure，不改结构/选题。

import { z } from "zod";

import { structureHash } from "@/lib/render/contract";
import type { AccountBrainSnapshot, RendererFill } from "@/lib/render/contract";
import {
  NARRATIVE_ORDER,
  accountBrainPromptLines,
  defaultFill,
  presentSlotsInOrder,
} from "@/lib/render/renderers/shared";
import type { ChatMessage } from "@/lib/ai/openrouter-client";
import { getLabel } from "@/lib/structure/registry";
import type { StructureDocument } from "@/lib/structure/types";
import { mainContentForm } from "./outline";
import type { MainContentForm } from "./outline";

// 兼容旧引入路径：提纲/形态从本模块也可取（实现在 ./outline）。
export { buildOutline, mainContentForm } from "./outline";
export type { ContentOutline, OutlinePoint, MainContentForm } from "./outline";

const MAIN_CONTENT_VERSION = "0.1.0";

/** 主内容的一个可读单元（段落 / 卡 / 节拍）。绑定它承载的 slot（溯源，非展示）。 */
export interface MainContentSection {
  /** 单元角色 = 承载的 slot machine_key（幕后溯源用，不展示给用户）。 */
  role: string;
  slotKeys: string[];
  /** 人类可读的小标题（如「钩子」「行动步骤」）。 */
  heading: string;
  /** 人类可读、可编辑的内容文本（不是 token）。 */
  text: string;
}

/** 主内容：平台无关的可读对象，中区展示与编辑的事实源。 */
export interface MainContent {
  form: MainContentForm;
  version: string;
  sourceStructureId: string;
  /** 溯源：对应结构的 hash（派生平台版 / 回填归因用）。 */
  sourceStructureHash: string;
  sections: MainContentSection[];
  warnings: string[];
}

const FORM_GUIDANCE: Record<MainContentForm, string> = {
  prose: "写成连贯的正文段落——每个单元一段人类可读的文字，读起来像一篇完整草稿，不是要点罗列。",
  cards: "写成图文卡片流——每个单元是一张卡的正文（一句钩子 + 简短展开），适合分页阅读。",
  script: "写成脚本节拍——每个单元是一段口播/画面节拍，带自然的口语节奏。",
};

const fillSchema = z.object({
  sections: z
    .array(z.object({ role: z.string(), heading: z.string().default(""), text: z.string() }))
    .default([]),
});

/** 组装主内容填充消息：平台无关、可读、贴账号声音、紧扣主题；按 slot 顺序逐单元产出。 */
export function buildMainContentMessages(
  intent: string,
  structure: Readonly<StructureDocument>,
  form: MainContentForm,
  orderedSlots: readonly string[],
  language?: string,
  accountBrain?: Readonly<AccountBrainSnapshot>,
): ChatMessage[] {
  const slotStrategy = new Map(structure.slots.map((s) => [s.key, s.strategyKey]));
  const unitLines = orderedSlots
    .map(
      (k, i) =>
        `#${i} [${k}] ${getLabel(k, "zh-Hans")}（策略：${slotStrategy.get(k) ? getLabel(slotStrategy.get(k)!, "zh-Hans") : "待定"}）`,
    )
    .join("\n");
  const brainLines = accountBrainPromptLines(accountBrain);
  const system = [
    "你在生成一份**平台无关的主内容**：用户会直接阅读和编辑它，之后再派生到具体平台。",
    "写人类可读的自然语言内容，绝不是 token/标签/结构名（如 hook、context 这类词不许出现在正文里）。",
    FORM_GUIDANCE[form],
    "必须紧扣给定主题——出现主题里的具体对象、场景、细节；禁止与主题无关的通用套话/空泛励志。",
    "按给定单元逐个产出，每个单元承载其结构语义（钩子抓注意、收束给可执行落点等），但用可读文字表达。",
    ...(brainLines.length
      ? [
          "以下是本账号的声音设定，只影响表达风格（语气/受众/长度/禁用词/标签习惯），绝不改变主题、选题与结构：",
          ...brainLines,
          "严格遵守上述规则；用该受众听得懂的语气写。",
        ]
      : []),
    language ? `输出语言：${language}。` : "",
    '仅输出 JSON：{"sections":[{"role","heading","text"}]}，顺序与数量必须与输入单元一致，role 用输入的方括号 key。',
  ]
    .filter(Boolean)
    .join("\n");
  const user = [
    `主题（务必围绕它写）：${intent}`,
    `原型：${getLabel(structure.prototypeKey, "zh-Hans")}`,
    `模态：${structure.modalityStack.map((m) => getLabel(m, "zh-Hans")).join(" + ")}`,
    "单元（按此顺序产出）：",
    unitLines,
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** 主内容生成输入。structure 与 accountBrain 只读（类型层禁改结构）。 */
export interface MainContentInput {
  /** 主题/原始想法（"写什么"）。 */
  intent: string;
  structure: Readonly<StructureDocument>;
  accountBrain: Readonly<AccountBrainSnapshot>;
  /** 输出语言（自由文本，多语言在输出层）。 */
  language?: string;
}

/**
 * 生成平台无关的主内容（Stage B）。不做稳定性门控——主内容是用户refine的工作稿，
 * 稳定后才由平台 renderer 派生（派生那步才 gate 稳定性）。fill 可注入 mock 供离线测试。
 */
export async function generateMainContent(
  input: MainContentInput,
  fill: RendererFill = defaultFill,
): Promise<MainContent> {
  const { intent, structure, accountBrain, language } = input;
  const form = mainContentForm(structure);
  const orderedSlots = presentSlotsInOrder(structure, NARRATIVE_ORDER);
  const messages = buildMainContentMessages(intent, structure, form, orderedSlots, language, accountBrain);
  const raw = await fill(messages);

  const warnings: string[] = [];
  let filled: { role: string; heading: string; text: string }[] = [];
  try {
    filled = fillSchema.parse(JSON.parse(raw)).sections;
  } catch {
    warnings.push("主内容解析失败，仅返回可读提纲骨架");
  }

  // 以 orderedSlots 为准绑定 slot（不信任模型改变单元数量/顺序），文本按序对齐，缺则留空。
  const sections: MainContentSection[] = orderedSlots.map((key, i) => ({
    role: key,
    slotKeys: [key],
    heading: filled[i]?.heading?.trim() || getLabel(key, "zh-Hans"),
    text: filled[i]?.text ?? "",
  }));

  return {
    form,
    version: MAIN_CONTENT_VERSION,
    sourceStructureId: structure.id,
    sourceStructureHash: structureHash(structure),
    sections,
    warnings,
  };
}
