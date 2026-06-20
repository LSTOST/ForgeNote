// ForgeNote M1 — 固定 mock 生成器（I-02A）。
// 约束：不调用外部 API、不读取环境变量、不生成随机内容、只返回固定 mock。
// 固定示例主题：「第一次独居备用金清单」。
// 依据：docs/MODEL-INTEGRATION.md §5（失败降级）、docs/UIUX-M1.md §7.3、docs/DATA-SCHEMA.md §4。

import type {
  Assumption,
  ContentPackage,
  ForgeGenerationRequest,
  ForgeGenerationResponse,
  Question,
  RecipeDraft,
  VerificationCheck,
} from "./types";

/** 输入为空时补的最少 5 条固定假设。 */
const DEFAULT_ASSUMPTIONS: Assumption[] = [
  {
    key: "platform",
    label: "平台",
    value: "小红书",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "format",
    label: "内容形式",
    value: "7张卡片",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "audience",
    label: "受众",
    value: "第一次独居的人",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "style",
    label: "风格",
    value: "成熟生活手册感",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "tone",
    label: "语气",
    value: "清楚、温和、可收藏",
    source: "inferred",
    state: "default",
    editable: true,
  },
];

/** 固定 7 张卡片的 Prompt 文本。 */
const CARD_PROMPTS = [
  "第 1 张（封面）：暖米白背景，深炭黑大标题「第一次独居 先留这笔钱」，低饱和橙色细节点缀，极简留白，无人物。",
  "第 2 张：标题「为什么要先留备用金」，三行短句说明独居突发开销，浅灰线稿小图标，排版整齐。",
  "第 3 张：标题「先留多少」，给出 3 个月基础开销的区间示意，数字清晰，避免焦虑话术。",
  "第 4 张：标题「这笔钱放哪里」，对比随取账户与定期，用简单图示，强调可随时取用。",
  "第 5 张：标题「哪些算紧急支出」，列出看病、修家电、临时搬家等，条目化呈现。",
  "第 6 张：标题「怎么慢慢攒」，给出每月固定划转的小习惯，温和鼓励，不制造压力。",
  "第 7 张（结尾）：标题「先有底，再谈生活」，一句收尾文案，引导收藏，风格与封面统一。",
];

/**
 * 返回固定 mock 内容包。
 * 不接外部模型，仅用于 I-02A 打通类型与契约。
 */
export function generateMockContentPackage(
  request: ForgeGenerationRequest,
): ForgeGenerationResponse {
  // 规则 1：空输入或纯空白 → 失败（不可重试）。
  if (request.rawInput.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "输入内容不能为空",
        retryable: false,
      },
      draft: {
        rawInput: request.rawInput,
        status: "draft",
        outcome: null,
      },
    };
  }

  // 规则 2：优先回传请求中的 assumptions；为空则补固定默认。
  const assumptions =
    request.assumptions.length > 0 ? request.assumptions : DEFAULT_ASSUMPTIONS;

  // 规则 3：完整 ContentPackage 七区块。
  const outcome: ContentPackage = {
    positioning: {
      key: "positioning",
      label: "内容定位",
      content:
        "这组内容帮助第一次独居的人理解：备用金该留多少、放在哪里、怎么慢慢攒，用成熟生活手册的口吻给出可执行的清单。",
    },
    titleOptions: {
      key: "titleOptions",
      label: "标题备选",
      content: [
        "第一次独居，先留这笔钱",
        "独居第一年，备用金清单收好",
        "搬出来住之前，先把这笔钱留好",
      ].join("\n"),
    },
    body: {
      key: "body",
      label: "小红书正文",
      content:
        "第一次一个人住，最该先准备的不是好看的家具，而是一笔能让你睡得着的备用金。\n\n它的作用很简单：当家电突然坏了、人不舒服要看病、或者临时需要搬家时，你不用慌，也不用为了几百块为难。\n\n这份清单分四步：先确认要留多少，再决定放在哪里，然后认清哪些算紧急支出，最后用一个小习惯慢慢把它攒起来。先有底，再谈生活。",
    },
    cardStructure: {
      key: "cardStructure",
      label: "卡片结构",
      content: [
        "1. 封面：第一次独居 先留这笔钱",
        "2. 为什么要先留备用金",
        "3. 先留多少",
        "4. 这笔钱放哪里",
        "5. 哪些算紧急支出",
        "6. 怎么慢慢攒",
        "7. 结尾：先有底，再谈生活",
      ].join("\n"),
    },
    cardPrompts: {
      key: "cardPrompts",
      label: "卡片 Prompt",
      content: CARD_PROMPTS.join("\n\n"),
    },
    hashtags: {
      key: "hashtags",
      label: "发布话题",
      content: ["#独居生活", "#第一次独居", "#备用金", "#一个人住", "#生活手册"].join(
        " ",
      ),
    },
    commentGuide: {
      key: "commentGuide",
      label: "评论区引导",
      content: "你第一次独居时，有没有专门留一笔备用金？大概留了多久的开销？",
    },
  };

  // 规则 5：完整 RecipeDraft。
  const recipe: RecipeDraft = {
    name: "成熟生活手册式独居卡片配方",
    intentType: request.intentType,
    audience: "第一次独居的人",
    goal: "把生活经验整理成可收藏、可复用的图文清单",
    tone: "清楚、温和、可收藏，不制造焦虑",
    structure: ["内容定位", "标题备选", "小红书正文", "卡片结构", "卡片 Prompt", "发布话题", "评论区引导"],
    visualStyle: "暖米白背景、深炭黑标题、低饱和橙强调、浅灰线稿、极简留白",
    negativeRules: ["不要广告感", "不要课程感", "不要焦虑营销", "不要引流话术"],
    variables: ["主题", "卡片数量", "目标人群", "核心建议"],
    acceptance: ["标题清楚", "卡片风格统一", "正文可直接发布", "无引流词"],
  };

  // 规则 6：验收检查（含引流词检查）。
  const verification: VerificationCheck[] = [
    { key: "has_title", label: "有标题", passed: true },
    { key: "has_body", label: "有正文", passed: true },
    { key: "has_card_prompts", label: "有卡片 Prompt", passed: true },
    { key: "has_hashtags", label: "有话题", passed: true },
    {
      key: "no_diversion",
      label: "无公众号/微信/私信领取等引流词",
      passed: true,
      note: "mock 文案不含引流词",
    },
  ];

  const questions: Question[] = [];

  return {
    ok: true,
    intentType: request.intentType,
    assumptions,
    questions,
    outcome,
    recipe,
    verification,
  };
}
