// ForgeNote M2-05→M2-08 桥接 — 把 Owner 已存的账号记忆蒸馏成「账号大脑快照」供 renderer 只读。
//
// 依据：CODEX-REVIEW.md §4（renderer 只读账号上下文，绝不反向改结构/选题）、
//       方向文档 v3.16（账号大脑：用谁的声音写；主题=写什么由 intent 定；结构=怎么写）。
// 纯 TS：仅类型 + 纯函数，不引用 Next / Supabase / 浏览器 API（可离线测试）。
//
// 铁律：本模块只做「记忆 → 短文本快照」的单向蒸馏。快照进 renderer 后只影响
//   语气/受众/长度/禁用词/标签习惯；不携带主题字段，防止 renderer 借账号大脑改选题。

import type { AccountBrainSnapshot } from "@/lib/render/contract";
import type { AccountMemoryItem, MemoryKind } from "./types";

/** 每类记忆蒸馏进快照的上限（防 prompt 过大；短数组语气足够，不需要全量）。 */
const MAX_RULES = 6;
const MAX_PATTERNS = 4;
/** 单个蒸馏字段的字符上限（账号大脑只要短文本，不要正文）。 */
const MAX_FIELD_CHARS = 160;

/**
 * body 键值里凡是「键名只是回声 kind 语义」的（如 voice.voice / rule.rule），
 * 只取值，避免生成 "声音：voice：克制" 这种冗余；其余键保留 "键：值" 以免丢语义
 * （如 rule.avoid_words 必须保留 "avoid_words" 才知道那是禁用词而非鼓励词）。
 */
const ECHO_KEYS = new Set([
  "voice",
  "tone",
  "rule",
  "pattern",
  "proven_pattern",
  "audience",
  "who",
  "topic",
  "visual",
  "visual_pref",
  "style",
  "value",
]);

/** 把单个 body 值（string / number / boolean / string[]）转成短文本；其它类型忽略。 */
function valueToText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .join("、");
  }
  return "";
}

/**
 * 把结构化 body 蒸馏成一行短文本。
 * - 回声键只取值（干净）；其余键保留 "键：值"（保语义，尤其禁用词类规则）。
 * - 嵌套对象忽略（账号大脑只要短文本，不下钻正文）。
 */
function bodyToText(body: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(body)) {
    const val = valueToText(v);
    if (!val) continue;
    parts.push(ECHO_KEYS.has(k.toLowerCase()) ? val : `${k}：${val}`);
  }
  return parts.join("；").slice(0, MAX_FIELD_CHARS);
}

/**
 * 从 account_memory_items 构建只读的账号大脑快照。
 * - 只吃 status="active" 的记忆；按 evidenceCount 降序（证据强的优先），弱证据/推断仍可入受众/视觉。
 * - 刻意不取 kind="topic"：主题="写什么"由 intent 定义，账号大脑只定义"用谁的声音写"（Codex §4）。
 * - 各字段限量 + 限字，防 prompt 过大。空记忆 → 空快照 {}。
 */
export function buildAccountBrainSnapshot(items: readonly AccountMemoryItem[]): AccountBrainSnapshot {
  const active = items
    .filter((it) => it.status === "active")
    .slice()
    .sort((a, b) => b.evidenceCount - a.evidenceCount);

  const byKind = (k: MemoryKind) => active.filter((it) => it.kind === k);

  /** 取该 kind 下第一条非空蒸馏文本（用于单值字段：受众/声音/视觉偏好）。 */
  const firstText = (k: MemoryKind): string | undefined => {
    for (const it of byKind(k)) {
      const t = bodyToText(it.body);
      if (t) return t;
    }
    return undefined;
  };

  /** 取该 kind 下前 max 条去重蒸馏文本（用于多值字段：规则/规律）。 */
  const collectTexts = (k: MemoryKind, max: number): string[] => {
    const out: string[] = [];
    for (const it of byKind(k)) {
      const t = bodyToText(it.body);
      if (t && !out.includes(t)) out.push(t);
      if (out.length >= max) break;
    }
    return out;
  };

  const snapshot: AccountBrainSnapshot = {};
  const audience = firstText("audience");
  const voice = firstText("voice");
  const rules = collectTexts("rule", MAX_RULES);
  const provenPatterns = collectTexts("proven_pattern", MAX_PATTERNS);
  const visualPref = firstText("visual_pref");

  if (audience) snapshot.audience = audience;
  if (voice) snapshot.voice = voice;
  if (rules.length) snapshot.rules = rules;
  if (provenPatterns.length) snapshot.provenPatterns = provenPatterns;
  if (visualPref) snapshot.visualPref = visualPref;

  return snapshot;
}
