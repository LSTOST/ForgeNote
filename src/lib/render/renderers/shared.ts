// ForgeNote M2-08 — renderer 共享流程（fill + assemble），三个 renderer 复用。
//
// 铁律（CODEX §4）：renderer 只读 structure，输出 artifact；不改结构。
// 分层：plan()（各 renderer 的纯确定性 slot→单元映射，可离线测）与 render()（文本填充）分离。

import { z } from "zod";
import { structureHash } from "@/lib/render/contract";
import type {
  AccountBrainSnapshot,
  RenderArtifact,
  RenderPlan,
  RendererFill,
  RendererId,
  RendererInput,
} from "@/lib/render/contract";
import type { ChatMessage } from "@/lib/ai/openrouter-client";
import type { StructureDocument } from "@/lib/structure/types";

/** 叙事 slot 的规范顺序（决定 thread / 卡片的排列）。 */
export const NARRATIVE_ORDER = ["hook", "context", "evidence", "insight", "resolution"] as const;

/** 结构中实际存在的、按规范顺序排列的 slot key。 */
export function presentSlotsInOrder(
  structure: Readonly<StructureDocument>,
  order: readonly string[],
): string[] {
  const have = new Set(structure.slots.map((s) => s.key));
  return order.filter((k) => have.has(k));
}

/** 默认文本填充：走 OpenRouter（仅服务端）。测试注入 mock 覆盖之。 */
export const defaultFill: RendererFill = async (messages: ChatMessage[]) => {
  const { callOpenRouterJSON } = await import("@/lib/ai/openrouter-client");
  return callOpenRouterJSON(messages);
};

const fillSchema = z.object({
  units: z.array(z.object({ role: z.string(), text: z.string() })).default([]),
});

/**
 * 把账号大脑快照转成 prompt 行（只读）。返回空数组 = 无账号上下文，prompt 不注入任何声音约束。
 * 铁律：这些行只影响表达风格（语气/受众/长度/禁用词/标签习惯），绝不改主题、选题与结构。
 */
export function accountBrainPromptLines(brain?: Readonly<AccountBrainSnapshot>): string[] {
  if (!brain) return [];
  const lines: string[] = [];
  if (brain.audience) lines.push(`- 受众：${brain.audience}`);
  if (brain.voice) lines.push(`- 声音/语气：${brain.voice}`);
  if (brain.rules?.length) lines.push(`- 必须遵守的规则（含禁用词/红线）：${brain.rules.join("；")}`);
  if (brain.provenPatterns?.length) lines.push(`- 已验证的表达规律：${brain.provenPatterns.join("；")}`);
  if (brain.visualPref) lines.push(`- 视觉偏好：${brain.visualPref}`);
  return lines;
}

/** 组装填充消息：给模型主题 + 结构 + 计划 + 账号声音，要求逐单元产出**围绕主题、贴账号声音**的具体文本（JSON）。 */
export function buildFillMessages(
  intent: string,
  structure: Readonly<StructureDocument>,
  plan: RenderPlan,
  platformNote: string,
  language?: string,
  accountBrain?: Readonly<AccountBrainSnapshot>,
): ChatMessage[] {
  const slotStrategy = new Map(structure.slots.map((s) => [s.key, s.strategyKey]));
  const unitLines = plan.units
    .map((u, i) => `#${i} [${u.role}] 覆盖 slot: ${u.slotKeys.map((k) => `${k}(${slotStrategy.get(k) ?? "待填"})`).join(", ")}`)
    .join("\n");
  const brainLines = accountBrainPromptLines(accountBrain);
  const system = [
    `你是「${platformNote}」的内容渲染器。只做格式化表达，不改变结构与选题。`,
    "必须紧扣给定主题写具体内容——出现主题里的具体对象、场景、细节；禁止写与主题无关的通用套话/空泛励志。",
    "按给定单元逐个产出文本，每个单元覆盖其 slot 的语义（如 hook 抓注意、resolution 给可执行收束）。",
    ...(brainLines.length
      ? [
          "以下是本账号的声音设定，只影响表达风格（语气/受众/长度/禁用词/标签习惯），绝不改变主题、选题与结构：",
          ...brainLines,
          "严格遵守上述规则（如禁用词、不蹭热点、不用 emoji）；用该受众听得懂的语气写，但主题与单元结构保持不变。",
        ]
      : []),
    language ? `输出语言：${language}。` : "",
    '仅输出 JSON：{"units":[{"role","text"}]}，顺序与数量必须与输入单元一致。',
  ].filter(Boolean).join("\n");
  const user = [
    `主题（务必围绕它写）：${intent}`,
    `原型：${structure.prototypeKey}`,
    `模态：${structure.modalityStack.join("+")}`,
    "单元：",
    unitLines,
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** 组装 RenderArtifact：绑定 plan 覆盖的 slot + sourceStructureHash（溯源），不触碰结构。 */
export function assembleArtifact(config: {
  rendererId: RendererId;
  rendererVersion: string;
  structure: Readonly<StructureDocument>;
  plan: RenderPlan;
  filledRaw: string;
}): RenderArtifact {
  const { rendererId, rendererVersion, structure, plan, filledRaw } = config;
  const warnings: string[] = [];

  let texts: { role: string; text: string }[] = [];
  try {
    texts = fillSchema.parse(JSON.parse(filledRaw)).units;
  } catch {
    warnings.push("填充文本解析失败，产物仅含结构骨架");
  }

  // 以 plan 为准绑定 slot（不信任模型改变单元数量/顺序）；文本按序对齐，缺则留空。
  const units = plan.units.map((u, i) => ({
    role: u.role,
    slotKeys: u.slotKeys,
    text: texts[i]?.text ?? "",
  }));

  return {
    id: crypto.randomUUID(),
    rendererId,
    rendererVersion,
    sourceStructureId: structure.id,
    sourceStructureHash: structureHash(structure),
    format: plan.format,
    output: { units },
    warnings,
  };
}

/** 通用 render 流程：plan → fill → assemble。各 renderer 传入自己的 plan / platformNote。 */
export async function runRender(args: {
  rendererId: RendererId;
  rendererVersion: string;
  input: RendererInput;
  plan: RenderPlan;
  platformNote: string;
  fill: RendererFill;
}): Promise<RenderArtifact> {
  const { rendererId, rendererVersion, input, plan, platformNote, fill } = args;
  const messages = buildFillMessages(
    input.intent,
    input.structure,
    plan,
    platformNote,
    input.target.language,
    input.accountBrain,
  );
  const filledRaw = await fill(messages);
  return assembleArtifact({ rendererId, rendererVersion, structure: input.structure, plan, filledRaw });
}

/** golden 覆盖率提取：从 artifact 读回每个单元覆盖的 slot（供 runGoldenCoverage）。 */
export function artifactCoverage(artifact: RenderArtifact): string[] {
  const out = artifact.output as { units?: { slotKeys?: string[] }[] };
  return [...new Set((out.units ?? []).flatMap((u) => u.slotKeys ?? []))];
}
