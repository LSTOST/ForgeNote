// ForgeNote M1 — 固定 mock 生成器（I-02A）。
// 约束：不调用外部 API、不读取环境变量、不生成随机内容、只返回固定 mock。
// 固定示例主题：「第一次独居备用金清单」。
// 依据：docs/MODEL-INTEGRATION.md §5（失败降级）、docs/DATA-SCHEMA.md §4、docs/API-CONTRACT.md §5.1。

import type {
  Assumption,
  CardPromptItem,
  CardStructureItem,
  ContentPackage,
  ForgeGenerationRequest,
  ForgeGenerationResponse,
  Question,
  RecipeDraft,
  Verification,
} from "./types";

/** 输入为空时补的最少 5 条固定假设。 */
const DEFAULT_ASSUMPTIONS: Assumption[] = [
  {
    key: "platform",
    label: "平台",
    value: "小红书",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "format",
    label: "内容形式",
    value: "7张卡片",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "audience",
    label: "受众",
    value: "第一次独居的人",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "style",
    label: "风格",
    value: "成熟生活手册感",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
  },
  {
    key: "tone",
    label: "语气",
    value: "清楚、温和、可收藏",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
  },
];

/** 固定 7 张卡片结构。 */
const CARD_STRUCTURE: CardStructureItem[] = [
  { index: 1, type: "cover", title: "第一次独居\n先留这笔钱" },
  { index: 2, type: "content", title: "为什么要先留备用金" },
  { index: 3, type: "content", title: "先留多少" },
  { index: 4, type: "content", title: "这笔钱放哪里" },
  { index: 5, type: "content", title: "哪些算紧急支出" },
  { index: 6, type: "content", title: "怎么慢慢攒" },
  { index: 7, type: "ending", title: "先有底，再谈生活" },
];

/** 固定 7 张卡片的 Prompt 文本。 */
const CARD_PROMPTS: CardPromptItem[] = [
  {
    index: 1,
    prompt:
      "第 1 张（封面）：暖米白背景，深炭黑大标题「第一次独居 先留这笔钱」，低饱和橙色细节点缀，极简留白，无人物。",
  },
  {
    index: 2,
    prompt:
      "第 2 张：标题「为什么要先留备用金」，三行短句说明独居突发开销，浅灰线稿小图标，排版整齐。",
  },
  {
    index: 3,
    prompt:
      "第 3 张：标题「先留多少」，给出 3 个月基础开销的区间示意，数字清晰，避免焦虑话术。",
  },
  {
    index: 4,
    prompt:
      "第 4 张：标题「这笔钱放哪里」，对比随取账户与定期，用简单图示，强调可随时取用。",
  },
  {
    index: 5,
    prompt:
      "第 5 张：标题「哪些算紧急支出」，列出看病、修家电、临时搬家等，条目化呈现。",
  },
  {
    index: 6,
    prompt:
      "第 6 张：标题「怎么慢慢攒」，给出每月固定划转的小习惯，温和鼓励，不制造压力。",
  },
  {
    index: 7,
    prompt:
      "第 7 张（结尾）：标题「先有底，再谈生活」，一句收尾文案，引导收藏，风格与封面统一。",
  },
];

/**
 * 返回固定 mock 内容包。
 * 不接外部模型，仅用于 I-02A 打通类型与契约。
 */
export function generateMockContentPackage(
  request: ForgeGenerationRequest,
): ForgeGenerationResponse {
  // 规则 1：空输入或纯空白 → 失败（不可重试），保留草稿（D-04）。
  if (request.rawInput.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INPUT_EMPTY",
        message: "输入内容不能为空",
        retryable: false,
      },
      draft: {
        rawInput: request.rawInput,
        intentType: request.intentType,
        assumptions: request.assumptions,
        status: "draft",
        outcome: null,
        errorCode: "INPUT_EMPTY",
      },
    };
  }

  // 规则 2：优先回传请求中的 assumptions；为空则补固定默认。
  const assumptions =
    request.assumptions.length > 0 ? request.assumptions : DEFAULT_ASSUMPTIONS;

  // 规则 3：完整 ContentPackage（字段命名对齐 DATA-SCHEMA §4.2）。
  const outcome: ContentPackage = {
    positioning:
      "这组内容帮助第一次独居的人理解：备用金该留多少、放在哪里、怎么慢慢攒，用成熟生活手册的口吻给出可执行的清单。",
    titles: [
      "第一次独居，先留这笔钱",
      "独居第一年，备用金清单收好",
      "搬出来住之前，先把这笔钱留好",
    ],
    body:
      "第一次一个人住，最该先准备的不是好看的家具，而是一笔能让你睡得着的备用金。\n\n它的作用很简单：当家电突然坏了、人不舒服要看病、或者临时需要搬家时，你不用慌，也不用为了几百块为难。\n\n这份清单分四步：先确认要留多少，再决定放在哪里，然后认清哪些算紧急支出，最后用一个小习惯慢慢把它攒起来。先有底，再谈生活。",
    cardStructure: CARD_STRUCTURE,
    cardPrompts: CARD_PROMPTS,
    hashtags: ["独居生活", "第一次独居", "备用金", "一个人住", "生活手册"],
    commentGuide:
      "你第一次独居时，有没有专门留一笔备用金？大概留了多久的开销？",
  };

  // 规则 4：完整 RecipeDraft。
  const recipe: RecipeDraft = {
    name: "成熟生活手册式独居卡片配方",
    intentType: request.intentType,
    audience: "第一次独居的人",
    goal: "把生活经验整理成可收藏、可复用的图文清单",
    tone: "清楚、温和、可收藏，不制造焦虑",
    structure: [
      "内容定位",
      "标题备选",
      "小红书正文",
      "卡片结构",
      "卡片 Prompt",
      "发布话题",
      "评论区引导",
    ],
    visualStyle: "暖米白背景、深炭黑标题、低饱和橙强调、浅灰线稿、极简留白",
    negativeRules: ["不要广告感", "不要课程感", "不要焦虑营销", "不要引流话术"],
    variables: ["主题", "卡片数量", "目标人群", "核心建议"],
    acceptance: ["标题清楚", "卡片风格统一", "正文可直接发布", "无引流词"],
  };

  // 规则 5：验收结果（overallPassed + checks，对齐 DATA-SCHEMA §4.4）。
  const verification: Verification = {
    overallPassed: true,
    checks: [
      { key: "has_title", label: "有标题", passed: true, message: "已包含标题备选" },
      { key: "has_body", label: "有正文", passed: true, message: "已包含小红书正文" },
      {
        key: "has_card_prompts",
        label: "有卡片 Prompt",
        passed: true,
        message: "已包含 7 张卡片 Prompt",
      },
      { key: "has_hashtags", label: "有话题", passed: true, message: "已包含发布话题" },
      {
        key: "no_diversion",
        label: "无公众号/微信/私信领取等引流词",
        passed: true,
        message: "mock 文案不含引流词",
      },
    ],
  };

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
