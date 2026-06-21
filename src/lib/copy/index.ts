// ForgeNote M1 — I-17 UI copy 入口（typed scaffold）。
//
// 用法（默认 zh-Hans，行为不变）：
//   import { copy } from "@/lib/copy";
//   copy.nav.recipes // "配方库"
//
// 说明：本票只做资源结构 + en/zh-Hans 脚手架与 typed helper。
//   不做运行时语言切换、不存用户语言偏好、不接路由 locale、不与 output_locale 联动。
//   `getCopy(locale)` 为后续真正接入多语言预留入口；当前组件一律用默认 `copy`（zh-Hans）。

import { zhHans, type Copy } from "./zh-Hans";
import { en } from "./en";

export type { Copy };

/** 默认语言：zh-Hans（保持当前 UI 行为）。 */
export const DEFAULT_LOCALE = "zh-Hans" as const;

/** 可用 copy 字典（key 由 Copy 类型保证两套一致）。 */
export const dictionaries = { "zh-Hans": zhHans, en } as const;

export type Locale = keyof typeof dictionaries;

/** 组件消费的默认 copy（zh-Hans）。 */
export const copy: Copy = dictionaries[DEFAULT_LOCALE];

/** 预留：按 locale 取 copy。当前无 UI 切换入口，默认即 zh-Hans。 */
export function getCopy(locale: Locale = DEFAULT_LOCALE): Copy {
  return dictionaries[locale];
}
